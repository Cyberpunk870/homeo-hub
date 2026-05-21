// @ts-nocheck
/** @jsxImportSource react */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Package2,
  PencilLine,
  Pill,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { BaseCrudService, useMember } from '@/integrations';
import { HomeopathicMedicines, InventoryBatches } from '@/entities';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RequiredLabel } from '@/components/ui/required-label';
import { useClinicLocation } from '@/hooks/use-clinic-location';
import {
  getBatchesForMedicine,
  getInventoryValuation,
  getTotalStockForMedicine,
} from '@/lib/inventory';
import { normalizeText } from '@/lib/validators';
import { useToast } from '@/hooks/use-toast';
import { dashboardNavigationItems } from '@/components/dashboard/navigation';

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

const ITEMS_PER_PAGE = 8;

function getStockState(totalStock: number, reorderLevel: number) {
  if (totalStock <= 0) {
    return {
      label: 'Out of Stock',
      className: 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-sm',
    };
  }

  if (totalStock <= reorderLevel) {
    return {
      label: 'Low Stock',
      className: 'bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-700 ring-1 ring-amber-200',
    };
  }

  return {
    label: 'In Stock',
    className: 'bg-gradient-to-r from-emerald-100 to-lime-50 text-emerald-700 ring-1 ring-emerald-200',
  };
}

function getMedicineTint(name: string) {
  const palette = [
    'from-emerald-200 via-lime-100 to-white',
    'from-sky-200 via-cyan-100 to-white',
    'from-amber-200 via-orange-100 to-white',
    'from-rose-200 via-pink-100 to-white',
  ];

  const hash = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

export default function InventoryPage() {
  const [medicines, setMedicines] = useState<HomeopathicMedicines[]>([]);
  const [batches, setBatches] = useState<InventoryBatches[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMedicine, setSelectedMedicine] = useState<HomeopathicMedicines | null>(null);
  const [selectedBatches, setSelectedBatches] = useState<InventoryBatches[]>([]);
  const [isMedicineDialogOpen, setIsMedicineDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<HomeopathicMedicines | null>(null);
  const [medicineDraft, setMedicineDraft] = useState<MedicineDraft>(emptyMedicineDraft);
  const clinicLocation = useClinicLocation();
  const location = useLocation();
  const { member } = useMember();
  const { toast } = useToast();

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterStatus]);

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

  const inventoryValue = useMemo(
    () => getInventoryValuation(batches, clinicLocation),
    [batches, clinicLocation]
  );

  const uniqueCategories = useMemo(
    () => Array.from(new Set(medicines.map((medicine) => medicine.formType).filter(Boolean))),
    [medicines]
  );

  const filteredMedicines = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return medicines.filter((medicine) => {
      const medicineName = medicine.medicineName || '';
      const relatedBatches = getBatchesForMedicine(batches, medicineName, clinicLocation, {
        includeExpired: true,
      });
      const totalStock = getTotalStockForMedicine(batches, medicineName, clinicLocation, {
        includeExpired: false,
      });
      const stockState = getStockState(totalStock, medicine.reorderLevel || 0);

      const matchesSearch =
        !normalizedSearch ||
        medicineName.toLowerCase().includes(normalizedSearch) ||
        (medicine.manufacturer || '').toLowerCase().includes(normalizedSearch) ||
        (medicine.potency || '').toLowerCase().includes(normalizedSearch) ||
        relatedBatches.some((batch) =>
          [batch.batchNumber, batch.supplierName, batch.medicineSKU].some((value) =>
            (value || '').toLowerCase().includes(normalizedSearch)
          )
        );

      const matchesCategory =
        filterCategory === 'all' || medicine.formType === filterCategory;
      const matchesStatus =
        filterStatus === 'all' ||
        stockState.label.toLowerCase().replace(/\s+/g, '-') === filterStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [batches, clinicLocation, filterCategory, filterStatus, medicines, searchQuery]);

  const paginatedMedicines = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMedicines.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredMedicines]);

  const totalPages = Math.max(1, Math.ceil(filteredMedicines.length / ITEMS_PER_PAGE));

  const handleViewDetails = (medicine: HomeopathicMedicines) => {
    setSelectedMedicine(medicine);
    setSelectedBatches(
      getBatchesForMedicine(batches, medicine.medicineName || '', clinicLocation, {
        includeExpired: true,
      })
    );
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

  const handleDeleteMedicine = async (medicine: HomeopathicMedicines) => {
    if (!medicine._id) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${medicine.medicineName || 'this medicine'} from the inventory master?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await BaseCrudService.delete<HomeopathicMedicines>('homeopathicmedicines', medicine._id);
      toast({
        title: 'Medicine Deleted',
        description: `${medicine.medicineName} was removed from the inventory master`,
      });

      if (selectedMedicine?._id === medicine._id) {
        setSelectedMedicine(null);
        setSelectedBatches([]);
      }

      await loadData();
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Could not delete medicine',
        variant: 'destructive',
      });
    }
  };

  const saveMedicine = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !normalizeText(medicineDraft.medicineName) ||
      !normalizeText(medicineDraft.potency) ||
      !normalizeText(medicineDraft.formType)
    ) {
      toast({
        title: 'Medicine Not Saved',
        description: 'Medicine name, potency, and form are required',
        variant: 'destructive',
      });
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

      toast({
        title: 'Medicine Saved',
        description: `${payload.medicineName} is now available in the medicine master`,
      });
      setIsMedicineDialogOpen(false);
      await loadData();
    } catch (error) {
      toast({
        title: 'Medicine Not Saved',
        description: error instanceof Error ? error.message : 'Could not save medicine',
        variant: 'destructive',
      });
    }
  };

  const displayName = member?.displayName || 'Clinic Admin';
  const displayInitials = displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(134,239,172,0.24),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(125,211,252,0.18),_transparent_20%),linear-gradient(180deg,_#f9fdf8_0%,_#eef7f0_100%)] text-slate-700">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 p-4 sm:p-6 lg:flex-row">
        <aside className="w-full overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_18px_60px_rgba(111,145,114,0.12)] backdrop-blur lg:sticky lg:top-6 lg:min-h-[calc(100vh-3rem)] lg:w-[260px] lg:flex-shrink-0">
          <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-lime-50 to-white px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 text-white shadow-lg shadow-emerald-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-heading text-2xl text-emerald-700">HomeoHub</p>
                <p className="font-paragraph text-sm text-slate-500">Clinic workspace</p>
              </div>
            </div>
          </div>

          <nav className="grid gap-2 p-4">
            {dashboardNavigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/inventory'
                ? location.pathname === '/inventory' || location.pathname === '/stock-management'
                : location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-lime-400 text-white shadow-[0_14px_24px_rgba(72,187,120,0.24)]'
                      : 'text-slate-600 hover:bg-emerald-50/70'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span className="font-paragraph text-sm font-medium">{item.label}</span>
                  </span>
                  {item.label === 'Alerts' ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      Live
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="hidden px-4 pb-4 lg:block">
            <div className="rounded-[24px] bg-gradient-to-br from-slate-900 via-emerald-900 to-lime-700 p-5 text-white shadow-xl">
              <p className="font-paragraph text-xs uppercase tracking-[0.22em] text-emerald-100/90">
                Active Clinic
              </p>
              <p className="mt-3 font-heading text-2xl">{clinicLocation}</p>
              <p className="mt-2 font-paragraph text-sm text-emerald-50/85">
                Inventory value Rs. {inventoryValue.toFixed(0)}
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 rounded-[32px] border border-white/70 bg-white/78 shadow-[0_20px_70px_rgba(126,156,130,0.12)] backdrop-blur">
          <div className="border-b border-emerald-100/80 bg-gradient-to-r from-white via-emerald-50/70 to-white px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="font-paragraph">
                  Managing stock for <span className="font-semibold text-slate-700">{clinicLocation}</span>
                </span>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 sm:w-[320px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search inventory..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-12 rounded-2xl border-emerald-100 bg-white/90 pl-11 text-slate-700 shadow-sm focus-visible:ring-emerald-200"
                  />
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2 shadow-sm">
                  <Avatar className="h-11 w-11 rounded-2xl bg-gradient-to-br from-sky-100 to-emerald-100 text-emerald-700">
                    <AvatarFallback className="rounded-2xl bg-transparent font-heading text-sm font-semibold text-emerald-700">
                      {displayInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-paragraph text-sm font-semibold text-slate-700">
                      {displayName}
                    </p>
                    <p className="font-paragraph text-xs text-slate-500">Inventory manager</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between"
            >
              <div>
                <h1 className="font-heading text-4xl text-slate-800 sm:text-5xl">
                  Inventory
                </h1>
                <p className="mt-3 max-w-2xl font-paragraph text-base text-slate-500 sm:text-lg">
                  Manage your homeopathic remedies, monitor stock health, and keep each clinic shelf ready.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-50 px-5 py-4 shadow-sm">
                  <p className="font-paragraph text-xs uppercase tracking-[0.18em] text-emerald-700">
                    Medicines
                  </p>
                  <p className="mt-2 font-heading text-3xl text-slate-800">{medicines.length}</p>
                </div>
                <Button
                  onClick={openCreateDialog}
                  className="h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 px-6 text-base font-semibold text-white shadow-[0_18px_34px_rgba(72,187,120,0.24)] hover:from-emerald-600 hover:to-lime-500"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Item
                </Button>
              </div>
            </motion.div>

            <div className="mb-6 rounded-[28px] border border-emerald-100 bg-white/90 p-4 shadow-sm">
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Purchases', path: '/stock-management#stock-in' },
                  { label: 'Dispense', path: '/stock-management#stock-out' },
                  { label: 'Transfers', path: '/stock-management#transfer' },
                  { label: 'Stock Count', path: '/stock-management#count' },
                  { label: 'Suppliers', path: '/stock-management#suppliers' },
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-lime-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-200 hover:from-emerald-100 hover:to-lime-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-500">
                Inventory and stock operations now sit under the Inventory module for quicker access.
              </p>
            </div>

            <div className="mb-6 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_220px_220px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-14 rounded-2xl border-emerald-100 bg-white pl-11 text-base shadow-sm focus-visible:ring-emerald-200"
                />
              </div>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-14 rounded-2xl border-emerald-100 bg-white text-slate-700 shadow-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category!}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-14 rounded-2xl border-emerald-100 bg-white text-slate-700 shadow-sm">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setFilterCategory('all');
                  setFilterStatus('all');
                }}
                className="h-14 rounded-2xl border-emerald-100 bg-white px-6 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Clear
              </Button>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_24px_60px_rgba(126,156,130,0.10)]">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-slate-50 via-emerald-50/70 to-lime-50/60">
                    <tr className="border-b border-emerald-100">
                      <th className="px-6 py-5 text-left font-paragraph text-sm font-semibold text-slate-500">
                        Name
                      </th>
                      <th className="px-6 py-5 text-left font-paragraph text-sm font-semibold text-slate-500">
                        Category
                      </th>
                      <th className="px-6 py-5 text-left font-paragraph text-sm font-semibold text-slate-500">
                        Stock
                      </th>
                      <th className="px-6 py-5 text-left font-paragraph text-sm font-semibold text-slate-500">
                        Status
                      </th>
                      <th className="px-6 py-5 text-left font-paragraph text-sm font-semibold text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center">
                          <div className="inline-flex items-center gap-3 rounded-full bg-emerald-50 px-5 py-3 text-sm text-emerald-700">
                            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                            Loading inventory...
                          </div>
                        </td>
                      </tr>
                    ) : paginatedMedicines.length > 0 ? (
                      paginatedMedicines.map((medicine) => {
                        const totalStock = getTotalStockForMedicine(
                          batches,
                          medicine.medicineName || '',
                          clinicLocation,
                          { includeExpired: false }
                        );
                        const totalBatches = getBatchesForMedicine(
                          batches,
                          medicine.medicineName || '',
                          clinicLocation,
                          { includeExpired: true }
                        ).length;
                        const stockState = getStockState(totalStock, medicine.reorderLevel || 0);

                        return (
                          <tr
                            key={medicine._id}
                            className="transition-colors hover:bg-gradient-to-r hover:from-emerald-50/70 hover:to-lime-50/30"
                          >
                            <td className="px-6 py-5">
                              <button
                                type="button"
                                onClick={() => handleViewDetails(medicine)}
                                className="flex items-center gap-4 text-left"
                              >
                                <div
                                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${getMedicineTint(
                                    medicine.medicineName || ''
                                  )} ring-1 ring-emerald-100`}
                                >
                                  <Pill className="h-6 w-6 text-emerald-700" />
                                </div>
                                <div>
                                  <p className="font-paragraph text-base font-semibold text-slate-800">
                                    {medicine.medicineName}
                                  </p>
                                  <p className="mt-1 font-paragraph text-sm text-slate-500">
                                    {medicine.potency || 'Standard potency'}
                                  </p>
                                </div>
                              </button>
                            </td>
                            <td className="px-6 py-5">
                              <div>
                                <p className="font-paragraph text-base font-medium text-slate-700">
                                  {medicine.formType || 'General'}
                                </p>
                                <p className="mt-1 font-paragraph text-sm text-slate-500">
                                  {medicine.manufacturer || 'Unspecified manufacturer'}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <p className="font-heading text-2xl text-slate-800">{totalStock}</p>
                              <p className="font-paragraph text-sm text-slate-500">
                                {totalBatches} batch{totalBatches === 1 ? '' : 'es'}
                              </p>
                            </td>
                            <td className="px-6 py-5">
                              <span
                                className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${stockState.className}`}
                              >
                                {stockState.label}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  onClick={() => openEditDialog(medicine)}
                                  className="h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-400 px-4 text-white hover:from-emerald-600 hover:to-lime-500"
                                >
                                  <PencilLine className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => void handleDeleteMedicine(medicine)}
                                  className="h-10 rounded-xl border-rose-200 bg-white px-4 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-24 text-center">
                          <div className="mx-auto max-w-md">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-emerald-100 to-lime-50 text-emerald-700">
                              <Package2 className="h-9 w-9" />
                            </div>
                            <p className="mt-6 font-heading text-2xl text-slate-800">
                              No medicines found
                            </p>
                            <p className="mt-2 font-paragraph text-slate-500">
                              Adjust the filters or add a new medicine to start building the inventory table.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-4 border-t border-emerald-100 bg-gradient-to-r from-white via-emerald-50/40 to-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-paragraph text-sm text-slate-500">
                  Showing{' '}
                  {filteredMedicines.length === 0
                    ? '0'
                    : `${(currentPage - 1) * ITEMS_PER_PAGE + 1} to ${Math.min(
                        currentPage * ITEMS_PER_PAGE,
                        filteredMedicines.length
                      )}`}{' '}
                  of {filteredMedicines.length} entries
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="h-10 w-10 rounded-xl border-emerald-100 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <Button
                      key={page}
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentPage(page)}
                      className={`h-10 w-10 rounded-xl p-0 ${
                        currentPage === page
                          ? 'border-emerald-200 bg-gradient-to-r from-emerald-500 to-lime-400 text-white'
                          : 'border-emerald-100 bg-white text-slate-600'
                      }`}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="h-10 w-10 rounded-xl border-emerald-100 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Dialog
        open={!!selectedMedicine}
        onOpenChange={() => {
          setSelectedMedicine(null);
          setSelectedBatches([]);
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto rounded-[28px] border-0 bg-white p-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-300 px-8 py-7 text-left">
            <DialogTitle className="font-heading text-3xl text-white">
              {selectedMedicine?.medicineName}
            </DialogTitle>
            <p className="mt-2 font-paragraph text-sm text-emerald-50">
              Batch breakdown and master details for {clinicLocation}
            </p>
          </DialogHeader>

          {selectedMedicine && (
            <div className="space-y-8 px-8 py-7">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-lime-50 p-5">
                  <p className="font-paragraph text-xs uppercase tracking-[0.16em] text-emerald-700">
                    Potency
                  </p>
                  <p className="mt-3 font-heading text-2xl text-slate-800">
                    {selectedMedicine.potency || 'N/A'}
                  </p>
                </div>
                <div className="rounded-3xl bg-gradient-to-br from-sky-50 to-cyan-50 p-5">
                  <p className="font-paragraph text-xs uppercase tracking-[0.16em] text-sky-700">
                    Form Type
                  </p>
                  <p className="mt-3 font-heading text-2xl text-slate-800">
                    {selectedMedicine.formType || 'N/A'}
                  </p>
                </div>
                <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 p-5">
                  <p className="font-paragraph text-xs uppercase tracking-[0.16em] text-amber-700">
                    Manufacturer
                  </p>
                  <p className="mt-3 font-heading text-2xl text-slate-800">
                    {selectedMedicine.manufacturer || 'N/A'}
                  </p>
                </div>
                <div className="rounded-3xl bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5">
                  <p className="font-paragraph text-xs uppercase tracking-[0.16em] text-violet-700">
                    Pack Size
                  </p>
                  <p className="mt-3 font-heading text-2xl text-slate-800">
                    {selectedMedicine.packSize || 'N/A'}
                  </p>
                </div>
                <div className="rounded-3xl bg-gradient-to-br from-rose-50 to-pink-50 p-5">
                  <p className="font-paragraph text-xs uppercase tracking-[0.16em] text-rose-700">
                    Reorder Level
                  </p>
                  <p className="mt-3 font-heading text-2xl text-slate-800">
                    {selectedMedicine.reorderLevel || 0}
                  </p>
                </div>
                <div className="rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 p-5">
                  <p className="font-paragraph text-xs uppercase tracking-[0.16em] text-slate-600">
                    Coverage Goal
                  </p>
                  <p className="mt-3 font-heading text-2xl text-slate-800">
                    {selectedMedicine.targetCoverageDays || 0} days
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-heading text-2xl text-slate-800">
                  Batch Information
                </h4>
                <p className="mt-1 font-paragraph text-sm text-slate-500">
                  {selectedBatches.length} active and historical batch record(s) for this clinic.
                </p>

                {selectedBatches.length > 0 ? (
                  <div className="mt-5 space-y-3">
                    {selectedBatches.map((batch) => (
                      <div
                        key={batch._id}
                        className="rounded-[24px] border border-emerald-100 bg-gradient-to-r from-white to-emerald-50/50 p-5"
                      >
                        <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <p className="font-paragraph text-xs uppercase tracking-[0.14em] text-slate-500">
                              Batch
                            </p>
                            <p className="mt-2 font-paragraph font-semibold text-slate-800">
                              {batch.batchNumber || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="font-paragraph text-xs uppercase tracking-[0.14em] text-slate-500">
                              Quantity
                            </p>
                            <p className="mt-2 font-paragraph font-semibold text-slate-800">
                              {batch.quantityAvailable || 0} units
                            </p>
                          </div>
                          <div>
                            <p className="font-paragraph text-xs uppercase tracking-[0.14em] text-slate-500">
                              Expiry
                            </p>
                            <p className="mt-2 font-paragraph font-semibold text-slate-800">
                              {batch.expiryDate
                                ? new Date(batch.expiryDate).toLocaleDateString()
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="font-paragraph text-xs uppercase tracking-[0.14em] text-slate-500">
                              Supplier
                            </p>
                            <p className="mt-2 font-paragraph font-semibold text-slate-800">
                              {batch.supplierName || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="font-paragraph text-xs uppercase tracking-[0.14em] text-slate-500">
                              Unit Cost
                            </p>
                            <p className="mt-2 font-paragraph font-semibold text-slate-800">
                              Rs. {(batch.unitCost || 0).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="font-paragraph text-xs uppercase tracking-[0.14em] text-slate-500">
                              SKU
                            </p>
                            <p className="mt-2 font-paragraph font-semibold text-slate-800">
                              {batch.medicineSKU || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[24px] border border-dashed border-emerald-200 bg-emerald-50/60 p-6 font-paragraph text-sm text-slate-500">
                    No batch information is available for this clinic yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isMedicineDialogOpen} onOpenChange={setIsMedicineDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-[28px] border-0 bg-white p-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-slate-900 via-emerald-900 to-lime-700 px-8 py-7">
            <DialogTitle className="font-heading text-3xl text-white">
              {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
            </DialogTitle>
            <p className="mt-2 font-paragraph text-sm text-emerald-100">
              Maintain the medicine master used across the inventory table.
            </p>
          </DialogHeader>

          <form onSubmit={saveMedicine} className="space-y-5 px-8 py-7">
            <p className="text-sm font-medium text-slate-500">Fields marked <span className="text-rose-500">*</span> are required.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <RequiredLabel required className="font-paragraph text-sm font-semibold text-slate-700">Medicine Name</RequiredLabel>
                <Input
                  value={medicineDraft.medicineName}
                  onChange={(event) =>
                    setMedicineDraft({ ...medicineDraft, medicineName: event.target.value })
                  }
                  className="h-12 rounded-2xl border-emerald-100 focus-visible:ring-emerald-200"
                />
              </div>
              <div className="space-y-2">
                <RequiredLabel required className="font-paragraph text-sm font-semibold text-slate-700">Potency</RequiredLabel>
                <Input
                  value={medicineDraft.potency}
                  onChange={(event) =>
                    setMedicineDraft({ ...medicineDraft, potency: event.target.value })
                  }
                  className="h-12 rounded-2xl border-emerald-100 focus-visible:ring-emerald-200"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <RequiredLabel required className="font-paragraph text-sm font-semibold text-slate-700">Form Type</RequiredLabel>
                <Input
                  value={medicineDraft.formType}
                  onChange={(event) =>
                    setMedicineDraft({ ...medicineDraft, formType: event.target.value })
                  }
                  className="h-12 rounded-2xl border-emerald-100 focus-visible:ring-emerald-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-paragraph text-sm font-semibold text-slate-700">
                  Manufacturer
                </Label>
                <Input
                  value={medicineDraft.manufacturer}
                  onChange={(event) =>
                    setMedicineDraft({ ...medicineDraft, manufacturer: event.target.value })
                  }
                  className="h-12 rounded-2xl border-emerald-100 focus-visible:ring-emerald-200"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="font-paragraph text-sm font-semibold text-slate-700">
                  Pack Size
                </Label>
                <Input
                  value={medicineDraft.packSize}
                  onChange={(event) =>
                    setMedicineDraft({ ...medicineDraft, packSize: event.target.value })
                  }
                  className="h-12 rounded-2xl border-emerald-100 focus-visible:ring-emerald-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-paragraph text-sm font-semibold text-slate-700">
                  Reorder Level
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={medicineDraft.reorderLevel}
                  onChange={(event) =>
                    setMedicineDraft({ ...medicineDraft, reorderLevel: event.target.value })
                  }
                  className="h-12 rounded-2xl border-emerald-100 focus-visible:ring-emerald-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-paragraph text-sm font-semibold text-slate-700">
                  Coverage Days
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={medicineDraft.targetCoverageDays}
                  onChange={(event) =>
                    setMedicineDraft({
                      ...medicineDraft,
                      targetCoverageDays: event.target.value,
                    })
                  }
                  className="h-12 rounded-2xl border-emerald-100 focus-visible:ring-emerald-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-paragraph text-sm font-semibold text-slate-700">
                Storage Requirements
              </Label>
              <Input
                value={medicineDraft.storageRequirements}
                onChange={(event) =>
                  setMedicineDraft({
                    ...medicineDraft,
                    storageRequirements: event.target.value,
                  })
                }
                className="h-12 rounded-2xl border-emerald-100 focus-visible:ring-emerald-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-paragraph text-sm font-semibold text-slate-700">
                Status
              </Label>
              <Select
                value={medicineDraft.isActive}
                onValueChange={(value) => setMedicineDraft({ ...medicineDraft, isActive: value })}
              >
                <SelectTrigger className="h-12 rounded-2xl border-emerald-100 focus:ring-emerald-200">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-paragraph text-sm font-semibold text-slate-700">
                Notes
              </Label>
              <Textarea
                rows={4}
                value={medicineDraft.notes}
                onChange={(event) =>
                  setMedicineDraft({ ...medicineDraft, notes: event.target.value })
                }
                className="rounded-2xl border-emerald-100 focus-visible:ring-emerald-200"
              />
            </div>

            <Button
              type="submit"
              className="h-14 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 text-base font-semibold text-white shadow-[0_18px_34px_rgba(72,187,120,0.24)] hover:from-emerald-600 hover:to-lime-500"
            >
              {editingMedicine ? 'Save Changes' : 'Create Medicine'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
