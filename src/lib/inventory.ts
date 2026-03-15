import type { HomeopathicMedicines, InventoryBatches, StockTransactionLedger, Suppliers } from '@/entities';
import { normalizeClinicLocation, type ClinicLocation } from '@/lib/clinic';

export interface ReorderSuggestion {
  medicineName: string;
  clinicLocation: ClinicLocation;
  currentStock: number;
  reorderLevel: number;
  recommendedOrderQuantity: number;
  averageMonthlyUsage: number;
  daysOfCover: number | null;
}

export interface UsageTrend {
  medicineName: string;
  clinicLocation: ClinicLocation;
  monthLabel: string;
  quantityUsed: number;
}

export interface SupplierInsight {
  supplierName: string;
  recentPurchases: number;
  suppliedMedicines: number;
  lastPurchaseDate: string | null;
  totalPurchaseValue: number;
}

export interface BatchCountVariance {
  batchId: string;
  medicineSKU: string;
  batchNumber: string;
  clinicLocation: ClinicLocation;
  systemQuantity: number;
  countedQuantity: number;
  variance: number;
}

function normalizeKey(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

export function getBatchStatus(batch: InventoryBatches, referenceDate = new Date()) {
  if (batch.stockStatus) return batch.stockStatus;
  if (!batch.expiryDate) return 'Active';

  const expiry = new Date(batch.expiryDate);
  if (Number.isNaN(expiry.getTime())) return 'Active';
  if (expiry < referenceDate) return 'Expired';

  const ninetyDays = new Date(referenceDate);
  ninetyDays.setDate(ninetyDays.getDate() + 90);
  if (expiry <= ninetyDays) return 'Expiring';
  return 'Active';
}

export function getClinicBatches(batches: InventoryBatches[], clinicLocation: string) {
  const normalizedClinic = normalizeClinicLocation(clinicLocation);
  return batches.filter((batch) => normalizeClinicLocation(batch.clinicLocation) === normalizedClinic);
}

export function getTotalStockForMedicine(
  batches: InventoryBatches[],
  medicineName: string,
  clinicLocation: string,
  options?: { includeExpired?: boolean }
) {
  return getClinicBatches(batches, clinicLocation)
    .filter((batch) => normalizeKey(batch.medicineSKU) === normalizeKey(medicineName))
    .filter((batch) => options?.includeExpired || getBatchStatus(batch) !== 'Expired')
    .reduce((sum, batch) => sum + (batch.quantityAvailable || 0), 0);
}

export function getBatchesForMedicine(
  batches: InventoryBatches[],
  medicineName: string,
  clinicLocation: string,
  options?: { includeExpired?: boolean }
) {
  return getClinicBatches(batches, clinicLocation).filter(
    (batch) =>
      normalizeKey(batch.medicineSKU) === normalizeKey(medicineName) &&
      (options?.includeExpired || getBatchStatus(batch) !== 'Expired')
  );
}

export function getLowStockSuggestions(
  medicines: HomeopathicMedicines[],
  batches: InventoryBatches[],
  transactions: StockTransactionLedger[],
  clinicLocation: string
) {
  const normalizedClinic = normalizeClinicLocation(clinicLocation);
  const now = new Date();
  const last90Days = new Date(now);
  last90Days.setDate(last90Days.getDate() - 90);

  return medicines
    .filter((medicine) => medicine.isActive !== false)
    .map((medicine) => {
      const medicineName = medicine.medicineName || '';
      const currentStock = getTotalStockForMedicine(batches, medicineName, normalizedClinic);
      const reorderLevel = medicine.reorderLevel || 0;
      const usage = transactions
        .filter((transaction) => normalizeClinicLocation(transaction.clinicLocation) === normalizedClinic)
        .filter((transaction) => normalizeKey(transaction.medicineSku) === normalizeKey(medicineName))
        .filter((transaction) => transaction.transactionType === 'Stock Out' || transaction.transactionType === 'Adjustment Out')
        .filter((transaction) => {
          const date = transaction.transactionDateTime ? new Date(transaction.transactionDateTime) : null;
          return Boolean(date && date >= last90Days);
        })
        .reduce((sum, transaction) => sum + Math.abs(transaction.quantityChange || 0), 0);

      const averageMonthlyUsage = Number((usage / 3).toFixed(1));
      const suggestedByUsage = Math.ceil(Math.max(averageMonthlyUsage * 1.5, reorderLevel * 1.25));
      const recommendedOrderQuantity = Math.max(suggestedByUsage - currentStock, reorderLevel - currentStock, 0);
      const daysOfCover = averageMonthlyUsage > 0 ? Math.round((currentStock / averageMonthlyUsage) * 30) : null;

      return {
        medicineName,
        clinicLocation: normalizedClinic,
        currentStock,
        reorderLevel,
        recommendedOrderQuantity,
        averageMonthlyUsage,
        daysOfCover,
      } satisfies ReorderSuggestion;
    })
    .filter((suggestion) => suggestion.recommendedOrderQuantity > 0)
    .sort((a, b) => b.recommendedOrderQuantity - a.recommendedOrderQuantity);
}

export function getUsageTrends(
  transactions: StockTransactionLedger[],
  clinicLocation: string,
  monthCount = 6
) {
  const normalizedClinic = normalizeClinicLocation(clinicLocation);
  const months = Array.from({ length: monthCount }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - index);
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthLabel = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    return { year, month, monthLabel };
  }).reverse();

  const rows: UsageTrend[] = [];
  for (const month of months) {
    const monthly = new Map<string, number>();

    transactions
      .filter((transaction) => normalizeClinicLocation(transaction.clinicLocation) === normalizedClinic)
      .filter((transaction) => transaction.transactionType === 'Stock Out' || transaction.transactionType === 'Adjustment Out')
      .forEach((transaction) => {
        const txDate = transaction.transactionDateTime ? new Date(transaction.transactionDateTime) : null;
        if (!txDate) return;
        if (txDate.getFullYear() !== month.year || txDate.getMonth() !== month.month) return;

        const medicineName = transaction.medicineSku || 'Unknown';
        monthly.set(medicineName, (monthly.get(medicineName) || 0) + Math.abs(transaction.quantityChange || 0));
      });

    monthly.forEach((quantityUsed, medicineName) => {
      rows.push({
        medicineName,
        clinicLocation: normalizedClinic,
        monthLabel: month.monthLabel,
        quantityUsed,
      });
    });
  }

  return rows;
}

export function getSupplierInsights(
  suppliers: Suppliers[],
  transactions: StockTransactionLedger[],
  clinicLocation: string
) {
  const normalizedClinic = normalizeClinicLocation(clinicLocation);

  return suppliers
    .map((supplier) => {
      const supplierName = supplier.supplierName || 'Unknown Supplier';
      const purchaseTransactions = transactions
        .filter((transaction) => normalizeClinicLocation(transaction.clinicLocation) === normalizedClinic)
        .filter((transaction) => transaction.transactionType === 'Stock In')
        .filter((transaction) => normalizeKey(transaction.supplierName) === normalizeKey(supplierName));

      const medicineSet = new Set(purchaseTransactions.map((transaction) => normalizeKey(transaction.medicineSku)));
      const lastPurchase = purchaseTransactions
        .map((transaction) => transaction.transactionDateTime)
        .filter(Boolean)
        .sort()
        .at(-1);
      const totalPurchaseValue = purchaseTransactions.reduce(
        (sum, transaction) => sum + Math.abs(transaction.quantityChange || 0) * (transaction.unitCost || 0),
        0
      );

      return {
        supplierName,
        recentPurchases: purchaseTransactions.length,
        suppliedMedicines: medicineSet.size,
        lastPurchaseDate: lastPurchase ? String(lastPurchase) : null,
        totalPurchaseValue,
      } satisfies SupplierInsight;
    })
    .filter((supplier) => supplier.recentPurchases > 0 || supplier.suppliedMedicines > 0)
    .sort((a, b) => b.totalPurchaseValue - a.totalPurchaseValue || b.recentPurchases - a.recentPurchases);
}

export function buildCsv(rows: Record<string, string | number | null | undefined>[]) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number | null | undefined) => {
    const serialized = String(value ?? '');
    return /[",\n]/.test(serialized) ? `"${serialized.replaceAll('"', '""')}"` : serialized;
  };

  return [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function getInventoryValuation(batches: InventoryBatches[], clinicLocation: string) {
  return getClinicBatches(batches, clinicLocation).reduce(
    (sum, batch) => sum + (batch.quantityAvailable || 0) * (batch.unitCost || 0),
    0
  );
}

export function buildCountVariance(batch: InventoryBatches, countedQuantity: number): BatchCountVariance {
  const systemQuantity = batch.quantityAvailable || 0;
  return {
    batchId: batch._id,
    medicineSKU: batch.medicineSKU || '',
    batchNumber: batch.batchNumber || '',
    clinicLocation: normalizeClinicLocation(batch.clinicLocation),
    systemQuantity,
    countedQuantity,
    variance: countedQuantity - systemQuantity,
  };
}
