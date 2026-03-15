import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, ClipboardCheck, Minus, PackagePlus, Plus, Truck } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { HomeopathicMedicines, InventoryBatches, StockTransactionLedger, Suppliers } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { CLINIC_LOCATIONS, getStoredClinicLocation, normalizeClinicLocation } from '@/lib/clinic';
import { useClinicLocation } from '@/hooks/use-clinic-location';
import {
  buildCountVariance,
  getClinicBatches,
  getInventoryValuation,
  getSupplierInsights,
} from '@/lib/inventory';
import { normalizeText, validateStockDraft } from '@/lib/validators';

function getOppositeClinic(clinic: string) {
  return normalizeClinicLocation(clinic) === 'Delhi' ? 'Noida' : 'Delhi';
}

export default function StockManagementPage() {
  const [medicines, setMedicines] = useState<HomeopathicMedicines[]>([]);
  const [suppliers, setSuppliers] = useState<Suppliers[]>([]);
  const [batches, setBatches] = useState<InventoryBatches[]>([]);
  const [transactions, setTransactions] = useState<StockTransactionLedger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const clinicLocation = useClinicLocation();

  const [stockInForm, setStockInForm] = useState({
    clinicLocation: 'Noida',
    medicineSKU: '',
    batchNumber: '',
    expiryDate: '',
    quantity: '',
    supplierName: '',
    purchaseInvoiceNumber: '',
    unitCost: '',
    receivedDate: '',
  });

  const [stockOutForm, setStockOutForm] = useState({
    clinicLocation: 'Noida',
    medicineSKU: '',
    batchNumber: '',
    quantity: '',
    referenceId: '',
  });

  const [transferForm, setTransferForm] = useState({
    sourceClinicLocation: 'Noida',
    destinationClinicLocation: 'Delhi',
    medicineSKU: '',
    batchNumber: '',
    quantity: '',
    notes: '',
  });

  const [countForm, setCountForm] = useState({
    clinicLocation: 'Noida',
    batchId: '',
    countedQuantity: '',
    reason: 'Monthly physical verification',
  });

  const [supplierForm, setSupplierForm] = useState({
    supplierName: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    address: '',
    paymentTerms: '',
  });

  useEffect(() => {
    const activeClinic = getStoredClinicLocation();
    setStockInForm((prev) => ({ ...prev, clinicLocation: activeClinic, receivedDate: new Date().toISOString().slice(0, 10) }));
    setStockOutForm((prev) => ({ ...prev, clinicLocation: activeClinic }));
    setTransferForm((prev) => ({
      ...prev,
      sourceClinicLocation: activeClinic,
      destinationClinicLocation: getOppositeClinic(activeClinic),
    }));
    setCountForm((prev) => ({ ...prev, clinicLocation: activeClinic }));
    void loadData();
  }, []);

  useEffect(() => {
    setStockInForm((prev) => ({ ...prev, clinicLocation }));
    setStockOutForm((prev) => ({ ...prev, clinicLocation }));
    setTransferForm((prev) => ({ ...prev, sourceClinicLocation: clinicLocation, destinationClinicLocation: getOppositeClinic(clinicLocation) }));
    setCountForm((prev) => ({ ...prev, clinicLocation }));
  }, [clinicLocation]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [medicinesResult, suppliersResult, batchesResult, transactionsResult] = await Promise.all([
        BaseCrudService.getAllItems<HomeopathicMedicines>('homeopathicmedicines'),
        BaseCrudService.getAllItems<Suppliers>('suppliers'),
        BaseCrudService.getAllItems<InventoryBatches>('inventorybatches'),
        BaseCrudService.getAllItems<StockTransactionLedger>('stocktransactionledger'),
      ]);
      setMedicines(medicinesResult);
      setSuppliers(suppliersResult);
      setBatches(batchesResult);
      setTransactions(transactionsResult);
    } catch (error) {
      console.error('Error loading inventory operations data:', error);
      toast({ title: 'Load Failed', description: 'Could not load inventory data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const clinicBatches = useMemo(
    () => getClinicBatches(batches, clinicLocation).sort((a, b) => (b._updatedDate ? new Date(String(b._updatedDate)).getTime() : 0) - (a._updatedDate ? new Date(String(a._updatedDate)).getTime() : 0)),
    [batches, clinicLocation]
  );

  const pendingTransfers = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.transactionType === 'Transfer Request')
        .filter((transaction) => transaction.approvalStatus === 'Pending')
        .sort((a, b) => new Date(String(b.transactionDateTime || '')).getTime() - new Date(String(a.transactionDateTime || '')).getTime()),
    [transactions]
  );

  const recentPurchases = useMemo(
    () =>
      transactions
        .filter((transaction) => normalizeClinicLocation(transaction.clinicLocation) === clinicLocation)
        .filter((transaction) => transaction.transactionType === 'Stock In')
        .sort((a, b) => new Date(String(b.transactionDateTime || '')).getTime() - new Date(String(a.transactionDateTime || '')).getTime())
        .slice(0, 8),
    [transactions, clinicLocation]
  );

  const supplierInsights = useMemo(() => getSupplierInsights(suppliers, transactions, clinicLocation).slice(0, 6), [suppliers, transactions, clinicLocation]);
  const inventoryValue = useMemo(() => getInventoryValuation(batches, clinicLocation), [batches, clinicLocation]);
  const selectedCountBatch = clinicBatches.find((batch) => batch._id === countForm.batchId) || null;

  const upsertBatch = async (
    sourceCollection: InventoryBatches[],
    payload: {
      clinicLocation: string;
      medicineSKU: string;
      batchNumber: string;
      expiryDate?: string;
      supplierName?: string;
      quantityDelta: number;
      unitCost?: number;
      purchaseInvoiceNumber?: string;
      receivedDate?: string;
      stockStatus?: string;
    }
  ) => {
    const match = sourceCollection.find(
      (batch) =>
        normalizeText(batch.medicineSKU) === normalizeText(payload.medicineSKU) &&
        normalizeText(batch.batchNumber) === normalizeText(payload.batchNumber) &&
        normalizeClinicLocation(batch.clinicLocation) === normalizeClinicLocation(payload.clinicLocation)
    );

    if (match) {
      const nextQuantity = (match.quantityAvailable || 0) + payload.quantityDelta;
      if (nextQuantity < 0) {
        throw new Error('Insufficient stock available for this batch');
      }

      return BaseCrudService.update<InventoryBatches>('inventorybatches', {
        _id: match._id,
        clinicLocation: payload.clinicLocation,
        quantityAvailable: nextQuantity,
        expiryDate: payload.expiryDate ?? match.expiryDate,
        supplierName: payload.supplierName ?? match.supplierName,
        unitCost: payload.unitCost ?? match.unitCost,
        purchaseInvoiceNumber: payload.purchaseInvoiceNumber ?? match.purchaseInvoiceNumber,
        receivedDate: payload.receivedDate ?? match.receivedDate,
        stockStatus: payload.stockStatus ?? match.stockStatus ?? 'Active',
      });
    }

    if (payload.quantityDelta < 0) {
      throw new Error('Cannot create a negative batch');
    }

    return BaseCrudService.create<InventoryBatches>('inventorybatches', {
      _id: crypto.randomUUID(),
      clinicLocation: payload.clinicLocation,
      medicineSKU: payload.medicineSKU,
      batchNumber: payload.batchNumber,
      expiryDate: payload.expiryDate,
      supplierName: payload.supplierName,
      quantityAvailable: payload.quantityDelta,
      unitCost: payload.unitCost,
      purchaseInvoiceNumber: payload.purchaseInvoiceNumber,
      receivedDate: payload.receivedDate,
      stockStatus: payload.stockStatus ?? 'Active',
    });
  };

  const createTransaction = async (payload: Partial<StockTransactionLedger>) =>
    BaseCrudService.create<StockTransactionLedger>('stocktransactionledger', {
      _id: crypto.randomUUID(),
      transactionDateTime: new Date().toISOString(),
      approvalStatus: 'Confirmed',
      ...payload,
    });

  const handleStockIn = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validateStockDraft(stockInForm, 'in');
    if (validationError) {
      toast({ title: 'Stock Entry Not Saved', description: validationError, variant: 'destructive' });
      return;
    }

    try {
      const quantity = Number(stockInForm.quantity);
      const unitCost = Number(stockInForm.unitCost || '0');
      const updatedBatch = await upsertBatch(batches, {
        clinicLocation: stockInForm.clinicLocation,
        medicineSKU: normalizeText(stockInForm.medicineSKU),
        batchNumber: normalizeText(stockInForm.batchNumber),
        expiryDate: stockInForm.expiryDate,
        supplierName: normalizeText(stockInForm.supplierName),
        quantityDelta: quantity,
        unitCost: Number.isFinite(unitCost) ? unitCost : 0,
        purchaseInvoiceNumber: normalizeText(stockInForm.purchaseInvoiceNumber),
        receivedDate: stockInForm.receivedDate,
        stockStatus: 'Active',
      });

      await createTransaction({
        transactionType: 'Stock In',
        medicineSku: normalizeText(stockInForm.medicineSKU),
        quantityChange: quantity,
        referenceIdentifier: normalizeText(stockInForm.purchaseInvoiceNumber || stockInForm.batchNumber),
        auditReason: 'Purchase Entry',
        clinicLocation: stockInForm.clinicLocation,
        supplierName: normalizeText(stockInForm.supplierName),
        unitCost: Number.isFinite(unitCost) ? unitCost : 0,
        resultingQuantity: updatedBatch.quantityAvailable,
      });

      toast({ title: 'Purchase Recorded', description: `Added ${quantity} units to ${stockInForm.clinicLocation}` });
      setStockInForm((prev) => ({
        ...prev,
        medicineSKU: '',
        batchNumber: '',
        expiryDate: '',
        quantity: '',
        supplierName: '',
        purchaseInvoiceNumber: '',
        unitCost: '',
        receivedDate: new Date().toISOString().slice(0, 10),
      }));
      await loadData();
    } catch (error) {
      toast({ title: 'Stock In Failed', description: error instanceof Error ? error.message : 'Could not record purchase', variant: 'destructive' });
    }
  };

  const handleStockOut = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validateStockDraft(stockOutForm, 'out');
    if (validationError) {
      toast({ title: 'Stock Out Not Saved', description: validationError, variant: 'destructive' });
      return;
    }

    try {
      const quantity = Number(stockOutForm.quantity);
      const updatedBatch = await upsertBatch(batches, {
        clinicLocation: stockOutForm.clinicLocation,
        medicineSKU: normalizeText(stockOutForm.medicineSKU),
        batchNumber: normalizeText(stockOutForm.batchNumber),
        quantityDelta: -quantity,
      });

      await createTransaction({
        transactionType: 'Stock Out',
        medicineSku: normalizeText(stockOutForm.medicineSKU),
        quantityChange: -quantity,
        referenceIdentifier: normalizeText(stockOutForm.referenceId),
        auditReason: 'Dispensed to Patient',
        clinicLocation: stockOutForm.clinicLocation,
        resultingQuantity: updatedBatch.quantityAvailable,
      });

      toast({ title: 'Stock Dispensed', description: `Dispensed ${quantity} units` });
      setStockOutForm((prev) => ({
        ...prev,
        medicineSKU: '',
        batchNumber: '',
        quantity: '',
        referenceId: '',
      }));
      await loadData();
    } catch (error) {
      toast({ title: 'Stock Out Failed', description: error instanceof Error ? error.message : 'Could not dispense stock', variant: 'destructive' });
    }
  };

  const handleTransferRequest = async (event: React.FormEvent) => {
    event.preventDefault();

    const quantity = Number(transferForm.quantity);
    if (!normalizeText(transferForm.medicineSKU) || !normalizeText(transferForm.batchNumber) || !Number.isFinite(quantity) || quantity <= 0) {
      toast({ title: 'Transfer Not Created', description: 'Enter medicine, batch, and quantity', variant: 'destructive' });
      return;
    }
    if (normalizeClinicLocation(transferForm.sourceClinicLocation) === normalizeClinicLocation(transferForm.destinationClinicLocation)) {
      toast({ title: 'Transfer Not Created', description: 'Source and destination clinics must be different', variant: 'destructive' });
      return;
    }

    const sourceBatch = batches.find(
      (batch) =>
        normalizeClinicLocation(batch.clinicLocation) === normalizeClinicLocation(transferForm.sourceClinicLocation) &&
        normalizeText(batch.medicineSKU) === normalizeText(transferForm.medicineSKU) &&
        normalizeText(batch.batchNumber) === normalizeText(transferForm.batchNumber)
    );

    if (!sourceBatch || (sourceBatch.quantityAvailable || 0) < quantity) {
      toast({ title: 'Transfer Not Created', description: 'Source batch does not have enough stock', variant: 'destructive' });
      return;
    }

    try {
      await BaseCrudService.create<StockTransactionLedger>('stocktransactionledger', {
        _id: crypto.randomUUID(),
        transactionType: 'Transfer Request',
        medicineSku: normalizeText(transferForm.medicineSKU),
        quantityChange: quantity,
        transactionDateTime: new Date().toISOString(),
        referenceIdentifier: normalizeText(transferForm.batchNumber),
        auditReason: normalizeText(transferForm.notes) || 'Clinic transfer request',
        clinicLocation: transferForm.sourceClinicLocation,
        sourceClinicLocation: transferForm.sourceClinicLocation,
        destinationClinicLocation: transferForm.destinationClinicLocation,
        transferGroupId: crypto.randomUUID(),
        approvalStatus: 'Pending',
      });

      toast({ title: 'Transfer Request Created', description: 'Review and confirm it from the queue below' });
      setTransferForm((prev) => ({
        ...prev,
        medicineSKU: '',
        batchNumber: '',
        quantity: '',
        notes: '',
      }));
      await loadData();
    } catch (error) {
      toast({ title: 'Transfer Failed', description: error instanceof Error ? error.message : 'Could not create transfer request', variant: 'destructive' });
    }
  };

  const confirmTransfer = async (request: StockTransactionLedger) => {
    try {
      const quantity = Math.abs(request.quantityChange || 0);
      const sourceClinic = normalizeClinicLocation(request.sourceClinicLocation || request.clinicLocation);
      const destinationClinic = normalizeClinicLocation(request.destinationClinicLocation);
      const sourceBatch = batches.find(
        (batch) =>
          normalizeClinicLocation(batch.clinicLocation) === sourceClinic &&
          normalizeText(batch.medicineSKU) === normalizeText(request.medicineSku) &&
          normalizeText(batch.batchNumber) === normalizeText(request.referenceIdentifier)
      );

      if (!sourceBatch || (sourceBatch.quantityAvailable || 0) < quantity) {
        throw new Error('Source batch no longer has enough stock to confirm this transfer');
      }

      const sourceUpdated = await upsertBatch(batches, {
        clinicLocation: sourceClinic,
        medicineSKU: normalizeText(request.medicineSku),
        batchNumber: normalizeText(request.referenceIdentifier),
        quantityDelta: -quantity,
      });
      const destinationUpdated = await upsertBatch(batches, {
        clinicLocation: destinationClinic,
        medicineSKU: normalizeText(request.medicineSku),
        batchNumber: normalizeText(request.referenceIdentifier),
        quantityDelta: quantity,
        expiryDate: sourceBatch.expiryDate ? String(sourceBatch.expiryDate) : undefined,
        supplierName: sourceBatch.supplierName,
        unitCost: sourceBatch.unitCost,
        purchaseInvoiceNumber: sourceBatch.purchaseInvoiceNumber,
        receivedDate: sourceBatch.receivedDate ? String(sourceBatch.receivedDate) : undefined,
        stockStatus: sourceBatch.stockStatus || 'Active',
      });

      await BaseCrudService.update<StockTransactionLedger>('stocktransactionledger', {
        _id: request._id,
        approvalStatus: 'Confirmed',
      });

      await Promise.all([
        createTransaction({
          transactionType: 'Transfer Out',
          medicineSku: request.medicineSku,
          quantityChange: -quantity,
          referenceIdentifier: request.referenceIdentifier,
          auditReason: request.auditReason || 'Clinic transfer confirmed',
          clinicLocation: sourceClinic,
          sourceClinicLocation: sourceClinic,
          destinationClinicLocation: destinationClinic,
          transferGroupId: request.transferGroupId,
          resultingQuantity: sourceUpdated.quantityAvailable,
        }),
        createTransaction({
          transactionType: 'Transfer In',
          medicineSku: request.medicineSku,
          quantityChange: quantity,
          referenceIdentifier: request.referenceIdentifier,
          auditReason: request.auditReason || 'Clinic transfer confirmed',
          clinicLocation: destinationClinic,
          sourceClinicLocation: sourceClinic,
          destinationClinicLocation: destinationClinic,
          transferGroupId: request.transferGroupId,
          resultingQuantity: destinationUpdated.quantityAvailable,
        }),
      ]);

      toast({ title: 'Transfer Confirmed', description: `${quantity} units moved to ${destinationClinic}` });
      await loadData();
    } catch (error) {
      toast({ title: 'Transfer Confirmation Failed', description: error instanceof Error ? error.message : 'Could not confirm transfer', variant: 'destructive' });
    }
  };

  const handleCountSubmission = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCountBatch) {
      toast({ title: 'Stock Count Failed', description: 'Select a batch to count', variant: 'destructive' });
      return;
    }

    const countedQuantity = Number(countForm.countedQuantity);
    if (!Number.isFinite(countedQuantity) || countedQuantity < 0) {
      toast({ title: 'Stock Count Failed', description: 'Enter a valid counted quantity', variant: 'destructive' });
      return;
    }

    try {
      const variance = buildCountVariance(selectedCountBatch, countedQuantity);
      await BaseCrudService.update<InventoryBatches>('inventorybatches', {
        _id: selectedCountBatch._id,
        quantityAvailable: countedQuantity,
        stockStatus: countedQuantity === 0 ? 'Quarantine' : selectedCountBatch.stockStatus || 'Active',
      });

      if (variance.variance !== 0) {
        await createTransaction({
          transactionType: variance.variance > 0 ? 'Adjustment In' : 'Adjustment Out',
          medicineSku: selectedCountBatch.medicineSKU,
          quantityChange: variance.variance,
          referenceIdentifier: selectedCountBatch.batchNumber,
          auditReason: normalizeText(countForm.reason) || 'Physical verification',
          clinicLocation: selectedCountBatch.clinicLocation,
          resultingQuantity: countedQuantity,
        });
      }

      toast({ title: 'Stock Count Recorded', description: `Variance: ${variance.variance >= 0 ? '+' : ''}${variance.variance} units` });
      setCountForm((prev) => ({ ...prev, batchId: '', countedQuantity: '', reason: 'Monthly physical verification' }));
      await loadData();
    } catch (error) {
      toast({ title: 'Stock Count Failed', description: error instanceof Error ? error.message : 'Could not save stock count', variant: 'destructive' });
    }
  };

  const handleSupplierCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!normalizeText(supplierForm.supplierName)) {
      toast({ title: 'Supplier Not Saved', description: 'Supplier name is required', variant: 'destructive' });
      return;
    }

    try {
      await BaseCrudService.create<Suppliers>('suppliers', {
        _id: crypto.randomUUID(),
        supplierName: normalizeText(supplierForm.supplierName),
        contactPerson: normalizeText(supplierForm.contactPerson),
        phoneNumber: normalizeText(supplierForm.phoneNumber),
        email: normalizeText(supplierForm.email),
        address: normalizeText(supplierForm.address),
        paymentTerms: normalizeText(supplierForm.paymentTerms),
      });
      toast({ title: 'Supplier Added', description: 'Supplier master data updated' });
      setSupplierForm({
        supplierName: '',
        contactPerson: '',
        phoneNumber: '',
        email: '',
        address: '',
        paymentTerms: '',
      });
      await loadData();
    } catch (error) {
      toast({ title: 'Supplier Not Saved', description: error instanceof Error ? error.message : 'Could not save supplier', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="w-full max-w-[110rem] mx-auto px-4 sm:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="font-heading text-4xl sm:text-5xl text-foreground mb-4">Inventory Operations</h1>
          <p className="font-paragraph text-base sm:text-lg text-foreground/70">
            Purchase, dispense, transfer, verify, and plan stock for {clinicLocation} clinic
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-secondary/30 bg-white p-5">
            <p className="font-paragraph text-sm text-gray-600">Current Clinic Value</p>
            <p className="font-heading text-3xl text-gray-900 mt-2">Rs. {inventoryValue.toFixed(0)}</p>
          </div>
          <div className="rounded-xl border border-secondary/30 bg-white p-5">
            <p className="font-paragraph text-sm text-gray-600">Active Batches</p>
            <p className="font-heading text-3xl text-gray-900 mt-2">{clinicBatches.length}</p>
          </div>
          <div className="rounded-xl border border-secondary/30 bg-white p-5">
            <p className="font-paragraph text-sm text-gray-600">Pending Transfers</p>
            <p className="font-heading text-3xl text-gray-900 mt-2">{pendingTransfers.length}</p>
          </div>
        </div>

        <Tabs defaultValue="stock-in" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8 h-auto">
            <TabsTrigger value="stock-in" className="font-paragraph">
              <PackagePlus className="w-4 h-4 mr-2" />
              Purchases
            </TabsTrigger>
            <TabsTrigger value="stock-out" className="font-paragraph">
              <Minus className="w-4 h-4 mr-2" />
              Dispense
            </TabsTrigger>
            <TabsTrigger value="transfer" className="font-paragraph">
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Transfers
            </TabsTrigger>
            <TabsTrigger value="count" className="font-paragraph">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Stock Count
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="font-paragraph">
              <Truck className="w-4 h-4 mr-2" />
              Suppliers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stock-in">
            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr,0.85fr] gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-lg border border-secondary/30">
                <h2 className="font-heading text-2xl text-gray-900 mb-2">Record Purchase</h2>
                <p className="font-paragraph text-sm text-gray-600 mb-6">Capture invoice, unit cost, supplier, and received batch details.</p>
                <form onSubmit={handleStockIn} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clinic-in">Clinic</Label>
                      <Select value={stockInForm.clinicLocation} onValueChange={(value) => setStockInForm({ ...stockInForm, clinicLocation: value })}>
                        <SelectTrigger id="clinic-in"><SelectValue placeholder="Select clinic" /></SelectTrigger>
                        <SelectContent>{CLINIC_LOCATIONS.map((clinic) => <SelectItem key={clinic} value={clinic}>{clinic}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="received-date">Received Date</Label>
                      <Input id="received-date" type="date" value={stockInForm.receivedDate} onChange={(event) => setStockInForm({ ...stockInForm, receivedDate: event.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicine-in">Medicine</Label>
                    <Select value={stockInForm.medicineSKU} onValueChange={(value) => setStockInForm({ ...stockInForm, medicineSKU: value })}>
                      <SelectTrigger id="medicine-in"><SelectValue placeholder="Select medicine" /></SelectTrigger>
                      <SelectContent>
                        {medicines.filter((medicine) => medicine.medicineName && medicine.isActive !== false).map((medicine) => (
                          <SelectItem key={medicine._id} value={medicine.medicineName!}>
                            {medicine.medicineName} - {medicine.potency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="batch-in">Batch Number</Label>
                      <Input id="batch-in" value={stockInForm.batchNumber} onChange={(event) => setStockInForm({ ...stockInForm, batchNumber: event.target.value })} placeholder="e.g., ARN-30C-03" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiry-in">Expiry Date</Label>
                      <Input id="expiry-in" type="date" value={stockInForm.expiryDate} onChange={(event) => setStockInForm({ ...stockInForm, expiryDate: event.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity-in">Quantity</Label>
                      <Input id="quantity-in" type="number" min="1" value={stockInForm.quantity} onChange={(event) => setStockInForm({ ...stockInForm, quantity: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit-cost">Unit Cost</Label>
                      <Input id="unit-cost" type="number" min="0" step="0.01" value={stockInForm.unitCost} onChange={(event) => setStockInForm({ ...stockInForm, unitCost: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invoice-number">Invoice / GRN</Label>
                      <Input id="invoice-number" value={stockInForm.purchaseInvoiceNumber} onChange={(event) => setStockInForm({ ...stockInForm, purchaseInvoiceNumber: event.target.value })} placeholder="INV-1001" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier-in">Supplier</Label>
                    <Select value={stockInForm.supplierName} onValueChange={(value) => setStockInForm({ ...stockInForm, supplierName: value })}>
                      <SelectTrigger id="supplier-in"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                      <SelectContent>{suppliers.filter((supplier) => supplier.supplierName).map((supplier) => <SelectItem key={supplier._id} value={supplier.supplierName!}>{supplier.supplierName}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">Record Purchase</Button>
                </form>
              </motion.div>

              <div className="bg-white p-6 rounded-lg border border-secondary/30">
                <h3 className="font-heading text-2xl text-gray-900 mb-4">Recent Purchases</h3>
                <div className="space-y-3">
                  {recentPurchases.length > 0 ? recentPurchases.map((purchase) => (
                    <div key={purchase._id} className="rounded-lg border border-secondary/20 bg-background p-4">
                      <p className="font-medium text-gray-900">{purchase.medicineSku}</p>
                      <p className="text-sm text-gray-600">{purchase.supplierName || 'Supplier not captured'} • {purchase.referenceIdentifier || 'No invoice'}</p>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-primary font-semibold">+{purchase.quantityChange} units</span>
                        <span className="text-gray-500">{purchase.transactionDateTime ? new Date(purchase.transactionDateTime).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  )) : <p className="font-paragraph text-sm text-gray-600">No purchases recorded for {clinicLocation} yet.</p>}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stock-out">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-lg border border-secondary/30 max-w-3xl">
              <h2 className="font-heading text-2xl text-gray-900 mb-2">Dispense Stock</h2>
              <p className="font-paragraph text-sm text-gray-600 mb-6">Dispense from a specific batch and preserve an accurate movement ledger.</p>
              <form onSubmit={handleStockOut} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinic-out">Clinic</Label>
                    <Select value={stockOutForm.clinicLocation} onValueChange={(value) => setStockOutForm({ ...stockOutForm, clinicLocation: value })}>
                      <SelectTrigger id="clinic-out"><SelectValue placeholder="Select clinic" /></SelectTrigger>
                      <SelectContent>{CLINIC_LOCATIONS.map((clinic) => <SelectItem key={clinic} value={clinic}>{clinic}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicine-out">Medicine</Label>
                    <Select value={stockOutForm.medicineSKU} onValueChange={(value) => setStockOutForm({ ...stockOutForm, medicineSKU: value })}>
                      <SelectTrigger id="medicine-out"><SelectValue placeholder="Select medicine" /></SelectTrigger>
                      <SelectContent>{medicines.filter((medicine) => medicine.medicineName).map((medicine) => <SelectItem key={medicine._id} value={medicine.medicineName!}>{medicine.medicineName} - {medicine.potency}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch-out">Batch Number</Label>
                    <Input id="batch-out" value={stockOutForm.batchNumber} onChange={(event) => setStockOutForm({ ...stockOutForm, batchNumber: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity-out">Quantity</Label>
                    <Input id="quantity-out" type="number" min="1" value={stockOutForm.quantity} onChange={(event) => setStockOutForm({ ...stockOutForm, quantity: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference-out">Reference</Label>
                    <Input id="reference-out" value={stockOutForm.referenceId} onChange={(event) => setStockOutForm({ ...stockOutForm, referenceId: event.target.value })} placeholder="Prescription / patient reference" />
                  </div>
                </div>
                <Button type="submit" variant="destructive" className="w-full">Dispense Stock</Button>
              </form>
            </motion.div>
          </TabsContent>

          <TabsContent value="transfer">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr,1.05fr] gap-6">
              <div className="bg-white p-6 rounded-lg border border-secondary/30">
                <h2 className="font-heading text-2xl text-gray-900 mb-2">Create Transfer Request</h2>
                <p className="font-paragraph text-sm text-gray-600 mb-6">Request stock movement between clinics, then confirm from the queue.</p>
                <form onSubmit={handleTransferRequest} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Source Clinic</Label>
                      <Select value={transferForm.sourceClinicLocation} onValueChange={(value) => setTransferForm({ ...transferForm, sourceClinicLocation: value })}>
                        <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                        <SelectContent>{CLINIC_LOCATIONS.map((clinic) => <SelectItem key={clinic} value={clinic}>{clinic}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Destination Clinic</Label>
                      <Select value={transferForm.destinationClinicLocation} onValueChange={(value) => setTransferForm({ ...transferForm, destinationClinicLocation: value })}>
                        <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                        <SelectContent>{CLINIC_LOCATIONS.filter((clinic) => clinic !== transferForm.sourceClinicLocation).map((clinic) => <SelectItem key={clinic} value={clinic}>{clinic}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Medicine</Label>
                    <Select value={transferForm.medicineSKU} onValueChange={(value) => setTransferForm({ ...transferForm, medicineSKU: value })}>
                      <SelectTrigger><SelectValue placeholder="Select medicine" /></SelectTrigger>
                      <SelectContent>{medicines.filter((medicine) => medicine.medicineName).map((medicine) => <SelectItem key={medicine._id} value={medicine.medicineName!}>{medicine.medicineName} - {medicine.potency}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Batch Number</Label>
                      <Input value={transferForm.batchNumber} onChange={(event) => setTransferForm({ ...transferForm, batchNumber: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input type="number" min="1" value={transferForm.quantity} onChange={(event) => setTransferForm({ ...transferForm, quantity: event.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Transfer Notes</Label>
                    <Textarea value={transferForm.notes} onChange={(event) => setTransferForm({ ...transferForm, notes: event.target.value })} rows={3} placeholder="Reason for transfer, urgency, or receiving context" />
                  </div>
                  <Button type="submit" className="w-full">Create Transfer Request</Button>
                </form>
              </div>

              <div className="bg-white p-6 rounded-lg border border-secondary/30">
                <h3 className="font-heading text-2xl text-gray-900 mb-4">Pending Transfer Queue</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicine</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTransfers.length > 0 ? pendingTransfers.map((transfer) => (
                      <TableRow key={transfer._id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">{transfer.medicineSku}</div>
                          <div className="text-xs text-gray-500">{transfer.referenceIdentifier}</div>
                        </TableCell>
                        <TableCell>{`${transfer.sourceClinicLocation || transfer.clinicLocation} to ${transfer.destinationClinicLocation}`}</TableCell>
                        <TableCell>{transfer.quantityChange}</TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => void confirmTransfer(transfer)}>
                            Confirm
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4}>No pending transfers</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="count">
            <div className="grid grid-cols-1 xl:grid-cols-[0.95fr,1.05fr] gap-6">
              <div className="bg-white p-6 rounded-lg border border-secondary/30">
                <h2 className="font-heading text-2xl text-gray-900 mb-2">Physical Verification</h2>
                <p className="font-paragraph text-sm text-gray-600 mb-6">Capture counted stock and automatically post an adjustment if the count differs.</p>
                <form onSubmit={handleCountSubmission} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Clinic</Label>
                    <Select value={countForm.clinicLocation} onValueChange={(value) => setCountForm({ ...countForm, clinicLocation: value, batchId: '' })}>
                      <SelectTrigger><SelectValue placeholder="Select clinic" /></SelectTrigger>
                      <SelectContent>{CLINIC_LOCATIONS.map((clinic) => <SelectItem key={clinic} value={clinic}>{clinic}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Batch</Label>
                    <Select value={countForm.batchId} onValueChange={(value) => setCountForm({ ...countForm, batchId: value })}>
                      <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                      <SelectContent>
                        {getClinicBatches(batches, countForm.clinicLocation).map((batch) => (
                          <SelectItem key={batch._id} value={batch._id}>
                            {batch.medicineSKU} • {batch.batchNumber} • system {batch.quantityAvailable || 0}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>System Quantity</Label>
                      <Input value={selectedCountBatch?.quantityAvailable || ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Counted Quantity</Label>
                      <Input type="number" min="0" value={countForm.countedQuantity} onChange={(event) => setCountForm({ ...countForm, countedQuantity: event.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason / Count Notes</Label>
                    <Textarea rows={3} value={countForm.reason} onChange={(event) => setCountForm({ ...countForm, reason: event.target.value })} />
                  </div>
                  <Button type="submit" className="w-full">Save Stock Count</Button>
                </form>
              </div>

              <div className="bg-white p-6 rounded-lg border border-secondary/30">
                <h3 className="font-heading text-2xl text-gray-900 mb-4">Current Clinic Batches</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicine</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clinicBatches.length > 0 ? clinicBatches.slice(0, 10).map((batch) => (
                      <TableRow key={batch._id}>
                        <TableCell>{batch.medicineSKU}</TableCell>
                        <TableCell>{batch.batchNumber}</TableCell>
                        <TableCell>{batch.quantityAvailable || 0}</TableCell>
                        <TableCell>{batch.stockStatus || 'Active'}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4}>No batches found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="suppliers">
            <div className="grid grid-cols-1 xl:grid-cols-[0.95fr,1.05fr] gap-6">
              <div className="bg-white p-6 rounded-lg border border-secondary/30">
                <h2 className="font-heading text-2xl text-gray-900 mb-2">Supplier Master</h2>
                <p className="font-paragraph text-sm text-gray-600 mb-6">Maintain supplier records directly inside the inventory tool.</p>
                <form onSubmit={handleSupplierCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Supplier Name</Label>
                    <Input value={supplierForm.supplierName} onChange={(event) => setSupplierForm({ ...supplierForm, supplierName: event.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contact Person</Label>
                      <Input value={supplierForm.contactPerson} onChange={(event) => setSupplierForm({ ...supplierForm, contactPerson: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={supplierForm.phoneNumber} onChange={(event) => setSupplierForm({ ...supplierForm, phoneNumber: event.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={supplierForm.email} onChange={(event) => setSupplierForm({ ...supplierForm, email: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Terms</Label>
                      <Input value={supplierForm.paymentTerms} onChange={(event) => setSupplierForm({ ...supplierForm, paymentTerms: event.target.value })} placeholder="Advance / 15 days / 30 days" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Textarea rows={3} value={supplierForm.address} onChange={(event) => setSupplierForm({ ...supplierForm, address: event.target.value })} />
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Save Supplier
                  </Button>
                </form>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border border-secondary/30">
                  <h3 className="font-heading text-2xl text-gray-900 mb-4">Supplier Insights</h3>
                  <div className="space-y-3">
                    {supplierInsights.length > 0 ? supplierInsights.map((supplier) => (
                      <div key={supplier.supplierName} className="rounded-lg border border-secondary/20 bg-background p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{supplier.supplierName}</p>
                          <p className="text-sm text-primary">Rs. {supplier.totalPurchaseValue.toFixed(0)}</p>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{supplier.recentPurchases} purchases • {supplier.suppliedMedicines} medicines</p>
                        <p className="text-xs text-gray-500 mt-1">Last purchase: {supplier.lastPurchaseDate ? new Date(supplier.lastPurchaseDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    )) : <p className="font-paragraph text-sm text-gray-600">Supplier insights will appear after purchase activity is recorded.</p>}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-secondary/30">
                  <h3 className="font-heading text-2xl text-gray-900 mb-4">Known Suppliers</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Terms</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers.length > 0 ? suppliers.map((supplier) => (
                        <TableRow key={supplier._id}>
                          <TableCell>{supplier.supplierName}</TableCell>
                          <TableCell>{supplier.contactPerson || supplier.phoneNumber || 'N/A'}</TableCell>
                          <TableCell>{supplier.paymentTerms || 'N/A'}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={3}>No suppliers available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {!isLoading && (
          <div className="mt-8 rounded-xl border border-secondary/30 bg-white p-6">
            <h3 className="font-heading text-2xl text-gray-900 mb-4">Operations Snapshot</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg bg-background p-4">
                <p className="font-paragraph text-sm text-gray-600">Recent purchase count</p>
                <p className="font-heading text-2xl text-gray-900 mt-2">{recentPurchases.length}</p>
              </div>
              <div className="rounded-lg bg-background p-4">
                <p className="font-paragraph text-sm text-gray-600">Suppliers used in {clinicLocation}</p>
                <p className="font-heading text-2xl text-gray-900 mt-2">{supplierInsights.length}</p>
              </div>
              <div className="rounded-lg bg-background p-4">
                <p className="font-paragraph text-sm text-gray-600">Transfers awaiting confirmation</p>
                <p className="font-heading text-2xl text-gray-900 mt-2">{pendingTransfers.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
