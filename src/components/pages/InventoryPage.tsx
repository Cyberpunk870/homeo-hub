import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Package, Plus, Search, Settings2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useClinicLocation } from '@/hooks/use-clinic-location';
import { getBatchesForMedicine, getBatchStatus, getInventoryValuation, getTotalStockForMedicine } from '@/lib/inventory';
import { normalizeText } from '@/lib/validators';
import { useToast } from '@/hooks/use-toast';

type MedicineDraft = {
  medicineName: string;
  potency: string;
  formType: string;
  manufacturer: string;
  packSize: string;
  reorderLevel: string;
  storageRequirements: string;
  targetCoverageDays: string;
  notes: string;
  isActive: string;
};

const emptyMedicineDraft: MedicineDraft = {
  medicineName: '',
  potency: '',
  formType: '',
  manufacturer: '',
  packSize: '',
  reorderLevel: '',
  storageRequirements: '',
  targetCoverageDays: '',
  notes: '',
  isActive: 'true',
};

export default function InventoryPage() {
  const [medicines, setMedicines] = useState<HomeopathicMedicines[]>([]);
  const [batches, setBatches] = useState<InventoryBatches[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPotency, setFilterPotency] = useState<string>('all');
  const [filterForm, setFilterForm] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [selectedMedicine, setSelectedMedicine] = useState<HomeopathicMedicines | null>(null);
  const [selectedBatches, setSelectedBatches] = useState<InventoryBatches[]>([]);
  const [isMedicineDialogOpen, setIsMedicineDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<HomeopathicMedicines | null>(null);
  const [medicineDraft, setMedicineDraft] = useState<MedicineDraft>(emptyMedicineDraft);
  const clinicLocation = useClinicLocation();
  const { toast } = useToast();

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [medicinesResult, batchesResult] = await Promise.all([
        BaseCrudService.getAllItems<HomeopathicMedicines>('homeopathicmedicines'),
        BaseCrudService.getAllItems<InventoryBatches>('inventorybatches'),
      ]);
      setMedicines(medicinesResult);
      setBatches(batchesResult);
    } catch (error) {
      console.error('Error loading inventory catalog:', error);
      toast({ title: 'Load Failed', description: 'Could not load inventory catalog', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const inventoryValue = useMemo(() => getInventoryValuation(batches, clinicLocation), [batches, clinicLocation]);
  const clinicBatchCount = useMemo(() => batches.filter((batch) => batch.clinicLocation === clinicLocation).length, [batches, clinicLocation]);

  const uniquePotencies = useMemo(() => Array.from(new Set(medicines.map((medicine) => medicine.potency).filter(Boolean))), [medicines]);
  const uniqueForms = useMemo(() => Array.from(new Set(medicines.map((medicine) => medicine.formType).filter(Boolean))), [medicines]);
  const uniqueSuppliers = useMemo(
    () => Array.from(new Set(batches.filter((batch) => batch.clinicLocation === clinicLocation).map((batch) => batch.supplierName).filter(Boolean))),
    [batches, clinicLocation]
  );

  const filteredMedicines = useMemo(() => {
    const normalizedSearch = searchQuery.toLowerCase();
    return medicines.filter((medicine) => {
      const medicineName = medicine.medicineName || '';
      const relatedBatches = getBatchesForMedicine(batches, medicineName, clinicLocation, { includeExpired: true });
      const matchesSearch =
        medicineName.toLowerCase().includes(normalizedSearch) ||
        (medicine.manufacturer || '').toLowerCase().includes(normalizedSearch) ||
        relatedBatches.some((batch) =>
          [batch.batchNumber, batch.supplierName, batch.medicineSKU].some((value) => (value || '').toLowerCase().includes(normalizedSearch))
        );
      const matchesPotency = filterPotency === 'all' || medicine.potency === filterPotency;
      const matchesForm = filterForm === 'all' || medicine.formType === filterForm;
      const matchesSupplier = filterSupplier === 'all' || relatedBatches.some((batch) => batch.supplierName === filterSupplier);
      const matchesStatus =
        filterStatus === 'all' ||
        relatedBatches.some((batch) => {
          const status = getBatchStatus(batch);
          return filterStatus === 'expired' ? status === 'Expired' : filterStatus === 'expiring' ? status === 'Expiring' : status === 'Active';
        });

      return matchesSearch && matchesPotency && matchesForm && matchesSupplier && matchesStatus;
    });
  }, [medicines, batches, clinicLocation, filterForm, filterPotency, filterStatus, filterSupplier, searchQuery]);

  const handleViewDetails = (medicine: HomeopathicMedicines) => {
    setSelectedMedicine(medicine);
    setSelectedBatches(getBatchesForMedicine(batches, medicine.medicineName || '', clinicLocation, { includeExpired: true }));
  };

  const openCreateDialog = () => {
    setEditingMedicine(null);
    setMedicineDraft(emptyMedicineDraft);
    setIsMedicineDialogOpen(true);
  };

  const openEditDialog = (medicine: HomeopathicMedicines) => {
    setEditingMedicine(medicine);
    setMedicineDraft({
      medicineName: medicine.medicineName || '',
      potency: medicine.potency || '',
      formType: medicine.formType || '',
      manufacturer: medicine.manufacturer || '',
      packSize: medicine.packSize || '',
      reorderLevel: String(medicine.reorderLevel || ''),
      storageRequirements: medicine.storageRequirements || '',
      targetCoverageDays: String(medicine.targetCoverageDays || ''),
      notes: medicine.notes || '',
      isActive: medicine.isActive === false ? 'false' : 'true',
    });
    setIsMedicineDialogOpen(true);
  };

  const saveMedicine = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!normalizeText(medicineDraft.medicineName) || !normalizeText(medicineDraft.potency) || !normalizeText(medicineDraft.formType)) {
      toast({ title: 'Medicine Not Saved', description: 'Medicine name, potency, and form are required', variant: 'destructive' });
      return;
    }

    const payload = {
      medicineName: normalizeText(medicineDraft.medicineName),
      potency: normalizeText(medicineDraft.potency),
      formType: normalizeText(medicineDraft.formType),
      manufacturer: normalizeText(medicineDraft.manufacturer),
      packSize: normalizeText(medicineDraft.packSize),
      reorderLevel: Number(medicineDraft.reorderLevel || 0),
      storageRequirements: normalizeText(medicineDraft.storageRequirements),
      targetCoverageDays: Number(medicineDraft.targetCoverageDays || 0),
      notes: normalizeText(medicineDraft.notes),
      isActive: medicineDraft.isActive !== 'false',
    } satisfies Partial<HomeopathicMedicines>;

    try {
      if (editingMedicine) {
        await BaseCrudService.update<HomeopathicMedicines>('homeopathicmedicines', {
          _id: editingMedicine._id,
          ...payload,
        });
      } else {
        await BaseCrudService.create<HomeopathicMedicines>('homeopathicmedicines', {
          _id: crypto.randomUUID(),
          ...payload,
        });
      }
      toast({ title: 'Medicine Saved', description: `${payload.medicineName} is now available in the medicine master` });
      setIsMedicineDialogOpen(false);
      await loadData();
    } catch (error) {
      toast({ title: 'Medicine Not Saved', description: error instanceof Error ? error.message : 'Could not save medicine', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="w-full max-w-[110rem] mx-auto px-4 sm:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-heading text-4xl sm:text-5xl text-foreground mb-4">Medicine Inventory</h1>
            <p className="font-paragraph text-base sm:text-lg text-foreground/80">
              Master catalog, batch visibility, and smart filtering for {clinicLocation} clinic
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Medicine
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-secondary/30 bg-white p-5">
            <p className="font-paragraph text-sm text-gray-600">Clinic Inventory Value</p>
            <p className="font-heading text-3xl text-gray-900 mt-2">Rs. {inventoryValue.toFixed(0)}</p>
          </div>
          <div className="rounded-xl border border-secondary/30 bg-white p-5">
            <p className="font-paragraph text-sm text-gray-600">Tracked Medicines</p>
            <p className="font-heading text-3xl text-gray-900 mt-2">{medicines.length}</p>
          </div>
          <div className="rounded-xl border border-secondary/30 bg-white p-5">
            <p className="font-paragraph text-sm text-gray-600">Batches in {clinicLocation}</p>
            <p className="font-heading text-3xl text-gray-900 mt-2">{clinicBatchCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-secondary/30 mb-8 space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
            <div className="xl:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search medicine, batch, or supplier..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-10 text-gray-900"
                />
              </div>
            </div>

            <Select value={filterPotency} onValueChange={setFilterPotency}>
              <SelectTrigger><SelectValue placeholder="Potency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Potencies</SelectItem>
                {uniquePotencies.map((potency) => <SelectItem key={potency} value={potency!}>{potency}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterForm} onValueChange={setFilterForm}>
              <SelectTrigger><SelectValue placeholder="Form" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                {uniqueForms.map((form) => <SelectItem key={form} value={form!}>{form}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterSupplier} onValueChange={setFilterSupplier}>
              <SelectTrigger><SelectValue placeholder="Supplier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {uniqueSuppliers.map((supplier) => <SelectItem key={supplier} value={supplier!}>{supplier}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="Batch Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={() => {
              setSearchQuery('');
              setFilterPotency('all');
              setFilterForm('all');
              setFilterStatus('all');
              setFilterSupplier('all');
            }}>
              <Settings2 className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        </div>

        <div className="min-h-[600px]">
          {isLoading ? null : filteredMedicines.length > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMedicines.map((medicine, index) => {
                const totalStock = getTotalStockForMedicine(batches, medicine.medicineName || '', clinicLocation, { includeExpired: false });
                const totalBatches = getBatchesForMedicine(batches, medicine.medicineName || '', clinicLocation, { includeExpired: true }).length;
                const lowStock = totalStock <= (medicine.reorderLevel || 0);

                return (
                  <motion.div
                    key={medicine._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.04 }}
                    className="bg-white p-6 rounded-lg border border-secondary/30 hover:border-primary/50 transition-all"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-heading text-lg text-gray-900 mb-2">{medicine.medicineName}</h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="text-xs bg-primary/10 text-primary border border-primary/30">{medicine.potency}</Badge>
                            <Badge className="text-xs bg-secondary/10 text-secondary border border-secondary/30">{medicine.formType}</Badge>
                            <Badge variant="outline" className="text-xs">{medicine.isActive === false ? 'Inactive' : 'Active'}</Badge>
                          </div>
                        </div>
                        {lowStock && <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />}
                      </div>

                      <div className="space-y-2 text-sm text-gray-700">
                        <p><span className="font-medium text-gray-900">Manufacturer:</span> {medicine.manufacturer || 'N/A'}</p>
                        <p><span className="font-medium text-gray-900">Pack Size:</span> {medicine.packSize || 'N/A'}</p>
                        <p><span className="font-medium text-gray-900">Stock:</span> <span className="text-primary font-bold">{totalStock} units</span></p>
                        <p><span className="font-medium text-gray-900">Batches:</span> {totalBatches}</p>
                        <p><span className="font-medium text-gray-900">Coverage Goal:</span> {medicine.targetCoverageDays || 0} days</p>
                        {lowStock && <p className="text-destructive font-medium">Below reorder level of {medicine.reorderLevel || 0}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button onClick={() => handleViewDetails(medicine)} className="w-full">
                          View Details
                        </Button>
                        <Button variant="outline" onClick={() => openEditDialog(medicine)} className="w-full">
                          Edit Master
                        </Button>
                      </div>
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

      <Dialog open={!!selectedMedicine} onOpenChange={() => setSelectedMedicine(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">{selectedMedicine?.medicineName}</DialogTitle>
          </DialogHeader>

          {selectedMedicine && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-foreground/60 mb-1">Potency</p><p className="font-medium text-foreground">{selectedMedicine.potency}</p></div>
                <div><p className="text-foreground/60 mb-1">Form Type</p><p className="font-medium text-foreground">{selectedMedicine.formType}</p></div>
                <div><p className="text-foreground/60 mb-1">Manufacturer</p><p className="font-medium text-foreground">{selectedMedicine.manufacturer || 'N/A'}</p></div>
                <div><p className="text-foreground/60 mb-1">Pack Size</p><p className="font-medium text-foreground">{selectedMedicine.packSize || 'N/A'}</p></div>
                <div><p className="text-foreground/60 mb-1">Reorder Level</p><p className="font-medium text-foreground">{selectedMedicine.reorderLevel || 0}</p></div>
                <div><p className="text-foreground/60 mb-1">Coverage Goal</p><p className="font-medium text-foreground">{selectedMedicine.targetCoverageDays || 0} days</p></div>
              </div>

              <div>
                <h4 className="font-heading text-lg mb-4">Batch Information ({clinicLocation})</h4>
                {selectedBatches.length > 0 ? (
                  <div className="space-y-3">
                    {selectedBatches.map((batch) => (
                      <div key={batch._id} className="bg-background p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><p className="text-foreground/60">Batch</p><p className="font-medium">{batch.batchNumber}</p></div>
                          <div><p className="text-foreground/60">Quantity</p><p className="font-medium">{batch.quantityAvailable || 0} units</p></div>
                          <div><p className="text-foreground/60">Expiry</p><p className="font-medium">{batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}</p></div>
                          <div><p className="text-foreground/60">Supplier</p><p className="font-medium">{batch.supplierName || 'N/A'}</p></div>
                          <div><p className="text-foreground/60">Unit Cost</p><p className="font-medium">Rs. {(batch.unitCost || 0).toFixed(2)}</p></div>
                          <div><p className="text-foreground/60">Status</p><p className="font-medium">{getBatchStatus(batch)}</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-paragraph text-sm text-foreground/60">No batch information available for this clinic.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isMedicineDialogOpen} onOpenChange={setIsMedicineDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">{editingMedicine ? 'Edit Medicine Master' : 'Add Medicine'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveMedicine} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Medicine Name</Label>
                <Input value={medicineDraft.medicineName} onChange={(event) => setMedicineDraft({ ...medicineDraft, medicineName: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Potency</Label>
                <Input value={medicineDraft.potency} onChange={(event) => setMedicineDraft({ ...medicineDraft, potency: event.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Form Type</Label>
                <Input value={medicineDraft.formType} onChange={(event) => setMedicineDraft({ ...medicineDraft, formType: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Manufacturer</Label>
                <Input value={medicineDraft.manufacturer} onChange={(event) => setMedicineDraft({ ...medicineDraft, manufacturer: event.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Pack Size</Label>
                <Input value={medicineDraft.packSize} onChange={(event) => setMedicineDraft({ ...medicineDraft, packSize: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Reorder Level</Label>
                <Input type="number" min="0" value={medicineDraft.reorderLevel} onChange={(event) => setMedicineDraft({ ...medicineDraft, reorderLevel: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Coverage Days</Label>
                <Input type="number" min="0" value={medicineDraft.targetCoverageDays} onChange={(event) => setMedicineDraft({ ...medicineDraft, targetCoverageDays: event.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Storage Requirements</Label>
              <Input value={medicineDraft.storageRequirements} onChange={(event) => setMedicineDraft({ ...medicineDraft, storageRequirements: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={medicineDraft.isActive} onValueChange={(value) => setMedicineDraft({ ...medicineDraft, isActive: value })}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea rows={4} value={medicineDraft.notes} onChange={(event) => setMedicineDraft({ ...medicineDraft, notes: event.target.value })} />
            </div>
            <Button type="submit" className="w-full">{editingMedicine ? 'Save Changes' : 'Create Medicine'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
