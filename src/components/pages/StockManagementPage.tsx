import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Package } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { HomeopathicMedicines, InventoryBatches, StockTransactionLedger, Suppliers } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function StockManagementPage() {
  const [medicines, setMedicines] = useState<HomeopathicMedicines[]>([]);
  const [suppliers, setSuppliers] = useState<Suppliers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Stock In Form State
  const [stockInForm, setStockInForm] = useState({
    medicineSKU: '',
    batchNumber: '',
    expiryDate: '',
    quantity: '',
    supplierName: ''
  });

  // Stock Out Form State
  const [stockOutForm, setStockOutForm] = useState({
    medicineSKU: '',
    batchNumber: '',
    quantity: '',
    referenceId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [medicinesResult, suppliersResult] = await Promise.all([
        BaseCrudService.getAll<HomeopathicMedicines>('homeopathicmedicines'),
        BaseCrudService.getAll<Suppliers>('suppliers')
      ]);
      setMedicines(medicinesResult.items);
      setSuppliers(suppliersResult.items);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create inventory batch
      await BaseCrudService.create<InventoryBatches>('inventorybatches', {
        _id: crypto.randomUUID(),
        medicineSKU: stockInForm.medicineSKU,
        batchNumber: stockInForm.batchNumber,
        expiryDate: stockInForm.expiryDate,
        quantityAvailable: Number(stockInForm.quantity),
        supplierName: stockInForm.supplierName
      });

      // Create transaction ledger entry
      await BaseCrudService.create<StockTransactionLedger>('stocktransactionledger', {
        _id: crypto.randomUUID(),
        transactionType: 'Stock In',
        medicineSku: stockInForm.medicineSKU,
        quantityChange: Number(stockInForm.quantity),
        transactionDateTime: new Date().toISOString(),
        referenceIdentifier: stockInForm.batchNumber,
        auditReason: 'Purchase Entry'
      });

      toast({
        title: 'Stock Added Successfully',
        description: `Added ${stockInForm.quantity} units to inventory`
      });

      setStockInForm({
        medicineSKU: '',
        batchNumber: '',
        expiryDate: '',
        quantity: '',
        supplierName: ''
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add stock entry',
        variant: 'destructive'
      });
    }
  };

  const handleStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get batch to update
      const batchesResult = await BaseCrudService.getAll<InventoryBatches>('inventorybatches');
      const batch = batchesResult.items.find(
        b => b.medicineSKU === stockOutForm.medicineSKU && b.batchNumber === stockOutForm.batchNumber
      );

      if (!batch) {
        toast({
          title: 'Error',
          description: 'Batch not found',
          variant: 'destructive'
        });
        return;
      }

      const newQuantity = (batch.quantityAvailable || 0) - Number(stockOutForm.quantity);
      
      if (newQuantity < 0) {
        toast({
          title: 'Error',
          description: 'Insufficient stock available',
          variant: 'destructive'
        });
        return;
      }

      // Update batch quantity
      await BaseCrudService.update<InventoryBatches>('inventorybatches', {
        _id: batch._id,
        quantityAvailable: newQuantity
      });

      // Create transaction ledger entry
      await BaseCrudService.create<StockTransactionLedger>('stocktransactionledger', {
        _id: crypto.randomUUID(),
        transactionType: 'Stock Out',
        medicineSku: stockOutForm.medicineSKU,
        quantityChange: -Number(stockOutForm.quantity),
        transactionDateTime: new Date().toISOString(),
        referenceIdentifier: stockOutForm.referenceId,
        auditReason: 'Dispensed to Patient'
      });

      toast({
        title: 'Stock Dispensed Successfully',
        description: `Dispensed ${stockOutForm.quantity} units`
      });

      setStockOutForm({
        medicineSKU: '',
        batchNumber: '',
        quantity: '',
        referenceId: ''
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to dispense stock',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="w-full max-w-[100rem] mx-auto px-4 sm:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="font-heading text-4xl sm:text-5xl text-foreground mb-4">Stock Management</h1>
          <p className="font-paragraph text-base sm:text-lg text-foreground/70">
            Add stock or dispense medicines with just a few clicks
          </p>
        </motion.div>

        <Tabs defaultValue="stock-in" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="stock-in" className="font-paragraph">
              <Plus className="w-4 h-4 mr-2" />
              Stock In
            </TabsTrigger>
            <TabsTrigger value="stock-out" className="font-paragraph">
              <Minus className="w-4 h-4 mr-2" />
              Stock Out
            </TabsTrigger>
          </TabsList>

          {/* Stock In Form */}
          <TabsContent value="stock-in">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-lg border border-secondary/30 max-w-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl text-gray-900">Add Stock</h2>
                  <p className="font-paragraph text-sm text-gray-600">
                    Record new medicine purchases
                  </p>
                </div>
              </div>

              <form onSubmit={handleStockIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="medicine-in" className="font-paragraph text-gray-900">Medicine</Label>
                  <Select
                    value={stockInForm.medicineSKU}
                    onValueChange={(value) => setStockInForm({ ...stockInForm, medicineSKU: value })}
                    required
                  >
                    <SelectTrigger id="medicine-in" className="text-gray-900">
                      <SelectValue placeholder="Select medicine" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicines.map(medicine => (
                        <SelectItem key={medicine._id} value={medicine.medicineName || ''}>
                          {medicine.medicineName} - {medicine.potency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="batch-in" className="font-paragraph text-gray-900">Batch Number</Label>
                    <Input
                      id="batch-in"
                      value={stockInForm.batchNumber}
                      onChange={(e) => setStockInForm({ ...stockInForm, batchNumber: e.target.value })}
                      placeholder="e.g., BATCH001"
                      className="text-gray-900"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry-in" className="font-paragraph text-gray-900">Expiry Date</Label>
                    <Input
                      id="expiry-in"
                      type="date"
                      value={stockInForm.expiryDate}
                      onChange={(e) => setStockInForm({ ...stockInForm, expiryDate: e.target.value })}
                      className="text-gray-900"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity-in" className="font-paragraph text-gray-900">Quantity</Label>
                  <Input
                    id="quantity-in"
                    type="number"
                    min="1"
                    value={stockInForm.quantity}
                    onChange={(e) => setStockInForm({ ...stockInForm, quantity: e.target.value })}
                    placeholder="Enter quantity"
                    className="text-gray-900"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier-in" className="font-paragraph text-gray-900">Supplier</Label>
                  <Select
                    value={stockInForm.supplierName}
                    onValueChange={(value) => setStockInForm({ ...stockInForm, supplierName: value })}
                    required
                  >
                    <SelectTrigger id="supplier-in" className="text-gray-900">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier._id} value={supplier.supplierName || ''}>
                          {supplier.supplierName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full bg-primary text-white hover:bg-primary/90 font-paragraph">
                  Add Stock Entry
                </Button>
              </form>
            </motion.div>
          </TabsContent>

          {/* Stock Out Form */}
          <TabsContent value="stock-out">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-lg border border-secondary/30 max-w-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <Minus className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl text-gray-900">Dispense Stock</h2>
                  <p className="font-paragraph text-sm text-gray-600">
                    Record medicine dispensed to patients
                  </p>
                </div>
              </div>

              <form onSubmit={handleStockOut} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="medicine-out" className="font-paragraph text-gray-900">Medicine</Label>
                  <Select
                    value={stockOutForm.medicineSKU}
                    onValueChange={(value) => setStockOutForm({ ...stockOutForm, medicineSKU: value })}
                    required
                  >
                    <SelectTrigger id="medicine-out" className="text-gray-900">
                      <SelectValue placeholder="Select medicine" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicines.map(medicine => (
                        <SelectItem key={medicine._id} value={medicine.medicineName || ''}>
                          {medicine.medicineName} - {medicine.potency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch-out" className="font-paragraph text-gray-900">Batch Number</Label>
                  <Input
                    id="batch-out"
                    value={stockOutForm.batchNumber}
                    onChange={(e) => setStockOutForm({ ...stockOutForm, batchNumber: e.target.value })}
                    placeholder="e.g., BATCH001"
                    className="text-gray-900"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity-out" className="font-paragraph text-gray-900">Quantity to Dispense</Label>
                  <Input
                    id="quantity-out"
                    type="number"
                    min="1"
                    value={stockOutForm.quantity}
                    onChange={(e) => setStockOutForm({ ...stockOutForm, quantity: e.target.value })}
                    placeholder="Enter quantity"
                    className="text-gray-900"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference-out" className="font-paragraph text-gray-900">Reference ID (Optional)</Label>
                  <Input
                    id="reference-out"
                    value={stockOutForm.referenceId}
                    onChange={(e) => setStockOutForm({ ...stockOutForm, referenceId: e.target.value })}
                    placeholder="e.g., Patient ID or Prescription ID"
                    className="text-gray-900"
                  />
                </div>

                <Button type="submit" className="w-full bg-destructive text-white hover:bg-destructive/90 font-paragraph">
                  Dispense Stock
                </Button>
              </form>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
