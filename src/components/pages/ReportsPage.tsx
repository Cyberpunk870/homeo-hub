import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Download, Package, RefreshCw, TrendingUp, Truck } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { HomeopathicMedicines, InventoryBatches, Prescriptions, StockTransactionLedger, Suppliers } from '@/entities';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useClinicLocation } from '@/hooks/use-clinic-location';
import { useToast } from '@/hooks/use-toast';
import {
  buildCsv,
  downloadCsv,
  getInventoryValuation,
  getLowStockSuggestions,
  getSupplierInsights,
  getUsageTrends,
} from '@/lib/inventory';

interface StockSummary {
  totalMedicines: number;
  totalBatches: number;
  lowStockCount: number;
  expiringCount: number;
  inventoryValue: number;
}

interface TopMedicine {
  name: string;
  totalStock: number;
  batches: number;
}

interface FinanceSummary {
  totalConsultations: number;
  totalBilled: number;
  totalCollected: number;
  outstandingBalance: number;
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<StockSummary>({
    totalMedicines: 0,
    totalBatches: 0,
    lowStockCount: 0,
    expiringCount: 0,
    inventoryValue: 0,
  });
  const [topMedicines, setTopMedicines] = useState<TopMedicine[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<StockTransactionLedger[]>([]);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReturnType<typeof getLowStockSuggestions>>([]);
  const [usageTrends, setUsageTrends] = useState<ReturnType<typeof getUsageTrends>>([]);
  const [supplierInsights, setSupplierInsights] = useState<ReturnType<typeof getSupplierInsights>>([]);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary>({
    totalConsultations: 0,
    totalBilled: 0,
    totalCollected: 0,
    outstandingBalance: 0,
  });
  const [recentReceipts, setRecentReceipts] = useState<Prescriptions[]>([]);
  const [allConsultations, setAllConsultations] = useState<Prescriptions[]>([]);
  const [reportView, setReportView] = useState<'daily' | 'income-tax' | 'cancelled' | 'balances'>('daily');
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const clinicLocation = useClinicLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const isHostedBackupEnabled = (import.meta.env.PUBLIC_DATA_BACKEND ?? 'local').toLowerCase() === 'postgres';

  useEffect(() => {
    void loadReports();
  }, [clinicLocation]);

  const loadReports = async () => {
    try {
      const [medicinesResult, batchesResult, transactionsResult, suppliersResult, prescriptionsResult] = await Promise.all([
        BaseCrudService.getAllItems<HomeopathicMedicines>('homeopathicmedicines'),
        BaseCrudService.getAllItems<InventoryBatches>('inventorybatches'),
        BaseCrudService.getAllItems<StockTransactionLedger>('stocktransactionledger'),
        BaseCrudService.getAllItems<Suppliers>('suppliers'),
        BaseCrudService.getAllItems<Prescriptions>('prescriptions'),
      ]);

      const medicines = medicinesResult.filter((medicine) => medicine.isActive !== false);
      const batches = batchesResult.filter((batch) => batch.clinicLocation === clinicLocation);
      const transactions = transactionsResult.filter((tx) => tx.clinicLocation === clinicLocation);
      const inventoryValue = getInventoryValuation(batchesResult, clinicLocation);
      const consultationRecords = prescriptionsResult.filter((entry) => (entry.clinicLocation || 'Noida') === clinicLocation);
      setAllConsultations(consultationRecords);

      let lowStockCount = 0;
      let expiringCount = 0;
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

      medicines.forEach((medicine) => {
        const totalStock = batches
          .filter((batch) => (batch.medicineSKU || '').trim().toLowerCase() === (medicine.medicineName || '').trim().toLowerCase())
          .reduce((sum, batch) => sum + (batch.quantityAvailable || 0), 0);

        if (totalStock <= (medicine.reorderLevel || 0)) {
          lowStockCount++;
        }
      });

      batches.forEach((batch) => {
        if (!batch.expiryDate || !batch.quantityAvailable || batch.quantityAvailable <= 0) return;
        const expiryDate = new Date(batch.expiryDate);
        if (expiryDate <= threeMonthsFromNow && expiryDate >= new Date()) {
          expiringCount++;
        }
      });

      setSummary({
        totalMedicines: medicines.length,
        totalBatches: batches.length,
        lowStockCount,
        expiringCount,
        inventoryValue,
      });

      const medicineStocks = medicines
        .map((medicine) => {
          const medicineBatches = batches.filter((batch) => (batch.medicineSKU || '').trim().toLowerCase() === (medicine.medicineName || '').trim().toLowerCase());
          return {
            name: medicine.medicineName || '',
            totalStock: medicineBatches.reduce((sum, batch) => sum + (batch.quantityAvailable || 0), 0),
            batches: medicineBatches.length,
          };
        })
        .sort((a, b) => b.totalStock - a.totalStock);

      setTopMedicines(medicineStocks.slice(0, 8));
      setRecentTransactions(
        [...transactions].sort((a, b) => new Date(String(b.transactionDateTime || '')).getTime() - new Date(String(a.transactionDateTime || '')).getTime()).slice(0, 12)
      );
      setReorderSuggestions(getLowStockSuggestions(medicinesResult, batchesResult, transactionsResult, clinicLocation).slice(0, 10));
      setUsageTrends(getUsageTrends(transactionsResult, clinicLocation, 6));
      setSupplierInsights(getSupplierInsights(suppliersResult, transactionsResult, clinicLocation).slice(0, 8));
      setFinanceSummary(
        consultationRecords.reduce(
          (summary, consultation) => {
            summary.totalConsultations += 1;
            summary.totalBilled += Number(consultation.totalAmount ?? 0);
            summary.totalCollected += Number(consultation.amountPaidCash ?? 0) + Number(consultation.amountPaidOnline ?? 0);
            summary.outstandingBalance += Number(consultation.balanceAmount ?? 0);
            return summary;
          },
          { totalConsultations: 0, totalBilled: 0, totalCollected: 0, outstandingBalance: 0 }
        )
      );
      setRecentReceipts(
        [...consultationRecords]
          .sort((a, b) => new Date(String(b.prescriptionDate || '')).getTime() - new Date(String(a.prescriptionDate || '')).getTime())
          .slice(0, 10)
      );
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({ title: 'Report Load Failed', description: 'Could not load report data', variant: 'destructive' });
    }
  };

  const financeRows = useMemo(() => {
    const fromTime = dateFrom ? new Date(dateFrom).getTime() : Number.NEGATIVE_INFINITY;
    const toTime = dateTo ? new Date(dateTo).getTime() : Number.POSITIVE_INFINITY;
    const inRange = allConsultations.filter((entry) => {
      const time = new Date(String(entry.prescriptionDate || '')).getTime();
      return time >= fromTime && time <= toTime;
    });

    if (reportView === 'cancelled') {
      return inRange.filter((entry) => entry.cancelledReceipt);
    }
    if (reportView === 'balances') {
      return inRange.filter((entry) => Number(entry.balanceAmount ?? 0) > 0);
    }
    return inRange;
  }, [allConsultations, dateFrom, dateTo, reportView]);

  const usageTrendSummary = useMemo(() => {
    const totals = new Map<string, number>();
    usageTrends.forEach((entry) => totals.set(entry.monthLabel, (totals.get(entry.monthLabel) || 0) + entry.quantityUsed));
    return Array.from(totals.entries()).map(([monthLabel, quantityUsed]) => ({ monthLabel, quantityUsed }));
  }, [usageTrends]);

  const handleExportBackup = async () => {
    try {
      const response = await fetch('/api/data/export', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to export backup');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `homeo-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Backup Downloaded', description: 'Backup file downloaded successfully' });
    } catch (error) {
      toast({ title: 'Backup Failed', description: error instanceof Error ? error.message : 'Could not export backup', variant: 'destructive' });
    }
  };

  const handleImportBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const response = await fetch('/api/data/import', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to restore backup');
      await loadReports();
      toast({ title: 'Backup Restored', description: 'Backup restored into PostgreSQL' });
    } catch (error) {
      toast({ title: 'Restore Failed', description: error instanceof Error ? error.message : 'Could not restore backup', variant: 'destructive' });
    } finally {
      event.target.value = '';
    }
  };

  const exportStockSummary = () => {
    const csv = buildCsv(
      topMedicines.map((medicine) => ({
        clinic: clinicLocation,
        medicine: medicine.name,
        totalStock: medicine.totalStock,
        batches: medicine.batches,
      }))
    );
    downloadCsv(`stock-summary-${clinicLocation.toLowerCase()}.csv`, csv);
  };

  const exportLedger = () => {
    const csv = buildCsv(
      recentTransactions.map((transaction) => ({
        clinic: transaction.clinicLocation,
        transactionType: transaction.transactionType,
        medicine: transaction.medicineSku,
        quantityChange: transaction.quantityChange,
        reference: transaction.referenceIdentifier,
        reason: transaction.auditReason,
        dateTime: transaction.transactionDateTime ? String(transaction.transactionDateTime) : '',
      }))
    );
    downloadCsv(`inventory-ledger-${clinicLocation.toLowerCase()}.csv`, csv);
  };

  const exportReorderPlan = () => {
    const csv = buildCsv(
      reorderSuggestions.map((suggestion) => ({
        clinic: suggestion.clinicLocation,
        medicine: suggestion.medicineName,
        currentStock: suggestion.currentStock,
        reorderLevel: suggestion.reorderLevel,
        recommendedOrderQuantity: suggestion.recommendedOrderQuantity,
        averageMonthlyUsage: suggestion.averageMonthlyUsage,
        daysOfCover: suggestion.daysOfCover,
      }))
    );
    downloadCsv(`reorder-plan-${clinicLocation.toLowerCase()}.csv`, csv);
  };

  return (
    <DashboardShell
      title="Inventory Reports"
      description={`Inventory analytics plus finance-style clinic reporting for ${clinicLocation}.`}
      actions={(
        <>
            <Button variant="outline" onClick={exportStockSummary}>
              <Download className="w-4 h-4 mr-2" />
              Stock CSV
            </Button>
            <Button variant="outline" onClick={exportLedger}>
              <Download className="w-4 h-4 mr-2" />
              Ledger CSV
            </Button>
            <Button variant="outline" onClick={exportReorderPlan}>
              <Download className="w-4 h-4 mr-2" />
              Reorder CSV
            </Button>
            {isHostedBackupEnabled && (
              <>
                <Button variant="outline" onClick={handleExportBackup}>
                  Download Backup
                </Button>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Restore Backup
                </Button>
                <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportBackup} />
              </>
            )}
        </>
      )}
    >

        <Card className="rounded-[28px] border-emerald-100 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Clinic Financial Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.6fr]">
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-11 rounded-2xl border border-emerald-100 px-4 text-sm" />
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-11 rounded-2xl border border-emerald-100 px-4 text-sm" />
              <div className="flex flex-wrap gap-2">
                {[
                  ['daily', 'Daily Report'],
                  ['income-tax', 'Income Tax Register'],
                  ['cancelled', 'Cancelled Receipts'],
                  ['balances', 'Balance List'],
                ].map(([value, label]) => (
                  <Button key={value} variant={reportView === value ? 'default' : 'outline'} onClick={() => setReportView(value as typeof reportView)}>
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Visit Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Cash</TableHead>
                  <TableHead>Online</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financeRows.length > 0 ? financeRows.map((entry) => (
                  <TableRow key={entry._id}>
                    <TableCell>{entry.receiptNumber || entry.prescriptionId}</TableCell>
                    <TableCell>{entry.patientName}</TableCell>
                    <TableCell>{entry.prescriptionDate ? new Date(entry.prescriptionDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>Rs. {Number(entry.totalAmount ?? 0).toFixed(0)}</TableCell>
                    <TableCell>Rs. {Number(entry.amountPaidCash ?? 0).toFixed(0)}</TableCell>
                    <TableCell>Rs. {Number(entry.amountPaidOnline ?? 0).toFixed(0)}</TableCell>
                    <TableCell>Rs. {Number(entry.balanceAmount ?? 0).toFixed(0)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={7}>No records match this report view and date range.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-12">
          {[
            { label: 'Tracked Medicines', value: summary.totalMedicines, icon: Package },
            { label: 'Total Batches', value: summary.totalBatches, icon: BarChart3 },
            { label: 'Low Stock', value: summary.lowStockCount, icon: TrendingUp },
            { label: 'Expiring Soon', value: summary.expiringCount, icon: RefreshCw },
            { label: 'Inventory Value', value: `Rs. ${summary.inventoryValue.toFixed(0)}`, icon: Truck },
          ].map((item, index) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
              <Card className="rounded-[28px] border-emerald-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="font-paragraph text-sm text-foreground/60 font-normal">{item.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-lime-50 p-3 ring-1 ring-emerald-100"><item.icon className="w-6 h-6 text-emerald-700" /></div>
                    <p className="font-heading text-2xl text-foreground">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Consultations', value: financeSummary.totalConsultations, icon: BarChart3 },
            { label: 'Billed Amount', value: `Rs. ${financeSummary.totalBilled.toFixed(0)}`, icon: TrendingUp },
            { label: 'Collected Amount', value: `Rs. ${financeSummary.totalCollected.toFixed(0)}`, icon: Download },
            { label: 'Outstanding', value: `Rs. ${financeSummary.outstandingBalance.toFixed(0)}`, icon: RefreshCw },
          ].map((item, index) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * index }}>
              <Card className="rounded-[28px] border-emerald-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="font-paragraph text-sm text-foreground/60 font-normal">{item.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-lime-50 p-3 ring-1 ring-emerald-100"><item.icon className="w-6 h-6 text-emerald-700" /></div>
                    <p className="font-heading text-2xl text-foreground">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <Card className="rounded-[28px] border-emerald-100 shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Reorder Planning Engine</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Suggested Order</TableHead>
                    <TableHead>Monthly Usage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reorderSuggestions.length > 0 ? reorderSuggestions.map((item) => (
                    <TableRow key={item.medicineName}>
                      <TableCell>
                        <div className="font-medium text-gray-900">{item.medicineName}</div>
                        <div className="text-xs text-gray-500">{item.daysOfCover ? `${item.daysOfCover} days cover` : 'No usage history'}</div>
                      </TableCell>
                      <TableCell>{item.currentStock}</TableCell>
                      <TableCell className="text-primary font-medium">{item.recommendedOrderQuantity}</TableCell>
                      <TableCell>{item.averageMonthlyUsage}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4}>No reorder suggestions for this clinic right now.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-emerald-100 shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Supplier Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Purchases</TableHead>
                    <TableHead>Medicines</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierInsights.length > 0 ? supplierInsights.map((supplier) => (
                    <TableRow key={supplier.supplierName}>
                      <TableCell>
                        <div className="font-medium text-gray-900">{supplier.supplierName}</div>
                        <div className="text-xs text-gray-500">{supplier.lastPurchaseDate ? new Date(supplier.lastPurchaseDate).toLocaleDateString() : 'No purchase yet'}</div>
                      </TableCell>
                      <TableCell>{supplier.recentPurchases}</TableCell>
                      <TableCell>{supplier.suppliedMedicines}</TableCell>
                      <TableCell>Rs. {supplier.totalPurchaseValue.toFixed(0)}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4}>No supplier performance data yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[28px] border-emerald-100 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Recent Receipts & Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Cash</TableHead>
                  <TableHead>Online</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReceipts.length > 0 ? recentReceipts.map((receipt) => (
                  <TableRow key={receipt._id}>
                    <TableCell>{receipt.receiptNumber || receipt.prescriptionId}</TableCell>
                    <TableCell>{receipt.patientName}</TableCell>
                    <TableCell>{receipt.prescriptionDate ? new Date(receipt.prescriptionDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>Rs. {Number(receipt.totalAmount ?? 0).toFixed(0)}</TableCell>
                    <TableCell>Rs. {Number(receipt.amountPaidCash ?? 0).toFixed(0)}</TableCell>
                    <TableCell>Rs. {Number(receipt.amountPaidOnline ?? 0).toFixed(0)}</TableCell>
                    <TableCell>Rs. {Number(receipt.balanceAmount ?? 0).toFixed(0)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={7}>No receipt history available yet for this clinic.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr,1.05fr] gap-8">
          <Card className="rounded-[28px] border-emerald-100 shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Usage Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usageTrendSummary.length > 0 ? usageTrendSummary.map((entry) => (
                  <div key={entry.monthLabel} className="rounded-lg bg-background p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{entry.monthLabel}</p>
                      <p className="font-heading text-xl text-primary">{entry.quantityUsed} units</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-primary/10 overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.min((entry.quantityUsed / Math.max(...usageTrendSummary.map((item) => item.quantityUsed), 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                )) : <p className="font-paragraph text-sm text-gray-600">Usage trends will appear once dispensing and adjustment transactions accumulate.</p>}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="rounded-[28px] border-emerald-100 shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">Top Medicines by Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topMedicines.length > 0 ? topMedicines.map((medicine) => (
                    <div key={medicine.name} className="flex items-center justify-between p-4 bg-background rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{medicine.name}</p>
                        <p className="text-sm text-gray-600">{medicine.batches} batches</p>
                      </div>
                      <p className="font-heading text-xl text-primary">{medicine.totalStock}</p>
                    </div>
                  )) : <p className="font-paragraph text-sm text-gray-600">No stock data available.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-emerald-100 shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">Recent Inventory Ledger</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicine</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.length > 0 ? recentTransactions.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">{transaction.medicineSku}</div>
                          <div className="text-xs text-gray-500">{transaction.auditReason || 'N/A'}</div>
                        </TableCell>
                        <TableCell>{transaction.transactionType}</TableCell>
                        <TableCell className={(transaction.quantityChange || 0) > 0 ? 'text-primary' : 'text-destructive'}>
                          {(transaction.quantityChange || 0) > 0 ? '+' : ''}{transaction.quantityChange}
                        </TableCell>
                        <TableCell>{transaction.transactionDateTime ? new Date(transaction.transactionDateTime).toLocaleString() : 'N/A'}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={4}>No recent inventory movements.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
    </DashboardShell>
  );
}
