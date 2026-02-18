import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Package, AlertCircle } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { HomeopathicMedicines, InventoryBatches } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function InventoryPage() {
  const [medicines, setMedicines] = useState<HomeopathicMedicines[]>([]);
  const [batches, setBatches] = useState<InventoryBatches[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPotency, setFilterPotency] = useState<string>('all');
  const [filterForm, setFilterForm] = useState<string>('all');
  const [selectedMedicine, setSelectedMedicine] = useState<HomeopathicMedicines | null>(null);
  const [selectedBatches, setSelectedBatches] = useState<InventoryBatches[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [medicinesResult, batchesResult] = await Promise.all([
        BaseCrudService.getAll<HomeopathicMedicines>('homeopathicmedicines'),
        BaseCrudService.getAll<InventoryBatches>('inventorybatches')
      ]);
      setMedicines(medicinesResult.items);
      setBatches(batchesResult.items);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (medicine: HomeopathicMedicines) => {
    setSelectedMedicine(medicine);
    const medicineBatches = batches.filter(b => b.medicineSKU === medicine.medicineName);
    setSelectedBatches(medicineBatches);
  };

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.medicineName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         medicine.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPotency = filterPotency === 'all' || medicine.potency === filterPotency;
    const matchesForm = filterForm === 'all' || medicine.formType === filterForm;
    return matchesSearch && matchesPotency && matchesForm;
  });

  const uniquePotencies = Array.from(new Set(medicines.map(m => m.potency).filter(Boolean)));
  const uniqueForms = Array.from(new Set(medicines.map(m => m.formType).filter(Boolean)));

  const getTotalStock = (medicineName: string) => {
    return batches
      .filter(b => b.medicineSKU === medicineName)
      .reduce((sum, b) => sum + (b.quantityAvailable || 0), 0);
  };

  const isLowStock = (medicineName: string, reorderLevel: number) => {
    const totalStock = getTotalStock(medicineName);
    return totalStock <= reorderLevel;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="w-full max-w-[100rem] mx-auto px-4 sm:px-8 py-16">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="font-heading text-4xl sm:text-5xl text-foreground mb-4">Medicine Inventory</h1>
          <p className="font-paragraph text-base sm:text-lg text-foreground/80">
            Browse and manage your homeopathic medicine catalog
          </p>
        </motion.div>

        {/* Search and Filters */}
        <div className="bg-white p-8 rounded-lg border border-secondary/30 mb-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <Input
                  placeholder="Search medicines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 font-paragraph"
                />
              </div>
            </div>
            
            <Select value={filterPotency} onValueChange={setFilterPotency}>
              <SelectTrigger className="font-paragraph">
                <SelectValue placeholder="Filter by Potency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Potencies</SelectItem>
                {uniquePotencies.map(potency => (
                  <SelectItem key={potency} value={potency!}>{potency}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterForm} onValueChange={setFilterForm}>
              <SelectTrigger className="font-paragraph">
                <SelectValue placeholder="Filter by Form" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                {uniqueForms.map(form => (
                  <SelectItem key={form} value={form!}>{form}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Medicines Grid */}
        <div className="min-h-[600px]">
          {isLoading ? null : filteredMedicines.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredMedicines.map((medicine, index) => {
                const totalStock = getTotalStock(medicine.medicineName || '');
                const lowStock = isLowStock(medicine.medicineName || '', medicine.reorderLevel || 0);

                return (
                  <motion.div
                    key={medicine._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="bg-white p-6 rounded-lg border border-secondary/30 hover:border-primary/50 transition-all"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-heading text-xl text-foreground mb-2">
                            {medicine.medicineName}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="font-paragraph text-xs">
                              {medicine.potency}
                            </Badge>
                            <Badge variant="outline" className="font-paragraph text-xs">
                              {medicine.formType}
                            </Badge>
                          </div>
                        </div>
                        {lowStock && (
                          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                        )}
                      </div>

                      <div className="space-y-2 font-paragraph text-sm text-foreground/70">
                        <p><span className="font-medium">Manufacturer:</span> {medicine.manufacturer}</p>
                        <p><span className="font-medium">Pack Size:</span> {medicine.packSize}</p>
                        <p><span className="font-medium">Total Stock:</span> {totalStock} units</p>
                        {lowStock && (
                          <p className="text-destructive font-medium">
                            Low Stock (Reorder at {medicine.reorderLevel})
                          </p>
                        )}
                      </div>

                      <Button
                        onClick={() => handleViewDetails(medicine)}
                        variant="outline"
                        className="w-full border-primary text-primary hover:bg-primary/10"
                      >
                        View Details
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <Package className="w-16 h-16 text-foreground/60 mb-4" />
              <p className="font-paragraph text-lg text-foreground/60">No medicines found</p>
            </div>
          )}
        </div>
      </div>

      {/* Medicine Details Dialog */}
      <Dialog open={!!selectedMedicine} onOpenChange={() => setSelectedMedicine(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {selectedMedicine?.medicineName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMedicine && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 font-paragraph text-sm">
                <div>
                  <p className="text-foreground/60 mb-1">Potency</p>
                  <p className="font-medium text-foreground">{selectedMedicine.potency}</p>
                </div>
                <div>
                  <p className="text-foreground/60 mb-1">Form Type</p>
                  <p className="font-medium text-foreground">{selectedMedicine.formType}</p>
                </div>
                <div>
                  <p className="text-foreground/60 mb-1">Manufacturer</p>
                  <p className="font-medium text-foreground">{selectedMedicine.manufacturer}</p>
                </div>
                <div>
                  <p className="text-foreground/60 mb-1">Pack Size</p>
                  <p className="font-medium text-foreground">{selectedMedicine.packSize}</p>
                </div>
                <div>
                  <p className="text-foreground/60 mb-1">Reorder Level</p>
                  <p className="font-medium text-foreground">{selectedMedicine.reorderLevel}</p>
                </div>
                <div>
                  <p className="text-foreground/60 mb-1">Storage</p>
                  <p className="font-medium text-foreground">{selectedMedicine.storageRequirements}</p>
                </div>
              </div>

              <div>
                <h4 className="font-heading text-lg mb-4">Batch Information</h4>
                {selectedBatches.length > 0 ? (
                  <div className="space-y-3">
                    {selectedBatches.map(batch => (
                      <div key={batch._id} className="bg-background p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-3 font-paragraph text-sm">
                          <div>
                            <p className="text-foreground/60">Batch Number</p>
                            <p className="font-medium">{batch.batchNumber}</p>
                          </div>
                          <div>
                            <p className="text-foreground/60">Quantity</p>
                            <p className="font-medium">{batch.quantityAvailable} units</p>
                          </div>
                          <div>
                            <p className="text-foreground/60">Expiry Date</p>
                            <p className="font-medium">
                              {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-foreground/60">Supplier</p>
                            <p className="font-medium">{batch.supplierName}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-paragraph text-sm text-foreground/60">No batch information available</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
