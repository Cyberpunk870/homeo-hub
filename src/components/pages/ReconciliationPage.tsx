import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Search, Wallet } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import type { Prescriptions } from '@/entities';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useClinicLocation } from '@/hooks/use-clinic-location';
import { useToast } from '@/hooks/use-toast';
import { calculateBalanceAmount, derivePaymentStatus } from '@/lib/consultations';

export default function ReconciliationPage() {
  const clinicLocation = useClinicLocation();
  const { toast } = useToast();
  const [consultations, setConsultations] = useState<Prescriptions[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<Prescriptions | null>(null);
  const [cashAddition, setCashAddition] = useState('0');
  const [onlineAddition, setOnlineAddition] = useState('0');
  const [clearBalance, setClearBalance] = useState(false);

  useEffect(() => {
    void loadData();
  }, [clinicLocation]);

  const loadData = async () => {
    const results = await BaseCrudService.getAllItems<Prescriptions>('prescriptions');
    setConsultations(results);
  };

  const rows = useMemo(() => {
    return consultations.filter((consultation) => {
      const matchesClinic = (consultation.clinicLocation || 'Noida') === clinicLocation;
      const visible = !consultation.isArchived;
      const query = searchQuery.toLowerCase();
      return matchesClinic && visible && (
        consultation.patientName?.toLowerCase().includes(query) ||
        consultation.receiptNumber?.toLowerCase().includes(query) ||
        consultation.prescriptionId?.toLowerCase().includes(query)
      );
    });
  }, [consultations, clinicLocation, searchQuery]);

  const pendingRows = rows.filter((row) => Number(row.balanceAmount ?? 0) > 0);

  const handleOpen = (consultation: Prescriptions) => {
    setSelected(consultation);
    setCashAddition('0');
    setOnlineAddition('0');
    setClearBalance(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    const nextCash = Number(selected.amountPaidCash ?? 0) + Number(cashAddition || 0);
    const nextOnline = Number(selected.amountPaidOnline ?? 0) + Number(onlineAddition || 0);
    const totalAmount = Number(selected.totalAmount ?? 0);
    const nextBalance = clearBalance ? 0 : calculateBalanceAmount(totalAmount, nextCash, nextOnline);

    await BaseCrudService.update<Prescriptions>('prescriptions', {
      ...selected,
      _id: selected._id,
      amountPaidCash: nextCash,
      amountPaidOnline: nextOnline,
      balanceAmount: nextBalance,
      paymentStatus: derivePaymentStatus(nextBalance, totalAmount),
    });

    toast({
      title: 'Reconciliation Saved',
      description: `Updated receipt ${selected.receiptNumber || selected.prescriptionId}.`,
    });
    setSelected(null);
    await loadData();
  };

  return (
    <DashboardShell
      title="Reconciliation"
      description={`Clear balances, add cash or online receipts, and review pending collections for ${clinicLocation}.`}
    >
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className="rounded-[24px] border-emerald-100 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <Wallet className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Pending Receipts</p>
              <p className="font-heading text-2xl text-slate-800">{pendingRows.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[24px] border-emerald-100 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Outstanding</p>
              <p className="font-heading text-2xl text-slate-800">
                Rs. {pendingRows.reduce((sum, row) => sum + Number(row.balanceAmount ?? 0), 0).toFixed(0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <div className="rounded-[24px] border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search patient or receipt..." className="pl-9" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {rows.map((consultation) => (
          <button
            key={consultation._id}
            type="button"
            onClick={() => handleOpen(consultation)}
            className="w-full rounded-[24px] border border-emerald-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(126,156,130,0.14)]"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Receipt</p><p className="font-medium text-slate-800">{consultation.receiptNumber || consultation.prescriptionId}</p></div>
              <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Patient</p><p className="font-medium text-slate-800">{consultation.patientName}</p></div>
              <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Date</p><p className="font-medium text-slate-800">{consultation.prescriptionDate ? new Date(consultation.prescriptionDate).toLocaleDateString() : 'N/A'}</p></div>
              <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</p><p className="font-medium text-slate-800">Rs. {Number(consultation.totalAmount ?? 0).toFixed(0)}</p></div>
              <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Collected</p><p className="font-medium text-slate-800">Rs. {(Number(consultation.amountPaidCash ?? 0) + Number(consultation.amountPaidOnline ?? 0)).toFixed(0)}</p></div>
              <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Balance</p><p className="font-medium text-rose-600">Rs. {Number(consultation.balanceAmount ?? 0).toFixed(0)}</p></div>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Reconcile Receipt</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div><p className="text-sm text-slate-500">Receipt</p><p className="font-medium text-slate-900">{selected.receiptNumber || selected.prescriptionId}</p></div>
                <div><p className="text-sm text-slate-500">Patient</p><p className="font-medium text-slate-900">{selected.patientName}</p></div>
                <div><p className="text-sm text-slate-500">Current Cash</p><p className="font-medium text-slate-900">Rs. {Number(selected.amountPaidCash ?? 0).toFixed(0)}</p></div>
                <div><p className="text-sm text-slate-500">Current Online</p><p className="font-medium text-slate-900">Rs. {Number(selected.amountPaidOnline ?? 0).toFixed(0)}</p></div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cash-addition">Add Cash</Label>
                  <Input id="cash-addition" type="number" min="0" value={cashAddition} onChange={(event) => setCashAddition(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="online-addition">Add Online</Label>
                  <Input id="online-addition" type="number" min="0" value={onlineAddition} onChange={(event) => setOnlineAddition(event.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                <Checkbox id="clear-balance" checked={clearBalance} onCheckedChange={(checked) => setClearBalance(Boolean(checked))} />
                <Label htmlFor="clear-balance" className="text-sm font-medium text-slate-700">Clear all remaining balance manually</Label>
              </div>

              <Button onClick={handleSave} className="w-full">Save Reconciliation</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
