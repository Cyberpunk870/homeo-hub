import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, FileText, IndianRupee, Plus, Search } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import type { ClinicSettings, Doctors, Patients, Prescriptions } from '@/entities';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RequiredLabel } from '@/components/ui/required-label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useClinicLocation } from '@/hooks/use-clinic-location';
import { normalizeText, validatePrescriptionDraft } from '@/lib/validators';
import {
  calculateBalanceAmount,
  calculateNextConsultationDate,
  calculateTotalAmount,
  derivePaymentStatus,
  flattenMedicineLineItems,
  generateReceiptNumber,
  parseMedicineLineItems,
  serializeMedicineLineItems,
  toIsoDateInput,
  type ConsultationLineItem,
  type FollowUpUnit,
} from '@/lib/consultations';
import { buildDefaultClinicSettings, resolveClinicSettings } from '@/lib/clinic-settings';

const EMPTY_LINE_ITEMS: ConsultationLineItem[] = Array.from({ length: 5 }, () => ({
  medicineName: '',
  dosageManagement: '',
}));

type ConsultationDraft = {
  prescriptionId: string;
  receiptNumber: string;
  clinicLocation: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  prescriptionDate: string;
  symptomsSummary: string;
  nature: string;
  craving: string;
  treatmentSummary: string;
  externalMedicines: string;
  investigations: string;
  treatmentForDays: string;
  consultationCount: string;
  followUpIntervalValue: string;
  followUpIntervalUnit: FollowUpUnit;
  nextConsultationDate: string;
  consultationCharge: string;
  medicineCharge: string;
  amountPaidCash: string;
  amountPaidOnline: string;
  totalAmount: string;
  balanceAmount: string;
  billRequired: string;
  prescriptionRequired: string;
  notes: string;
  remarks: string;
  medicinesAndDosages: string;
};

function buildDraft(clinicLocation: string, settings?: ClinicSettings): ConsultationDraft {
  const activeSettings = settings || buildDefaultClinicSettings(clinicLocation);
  const prescriptionDate = toIsoDateInput(new Date());
  const followUpIntervalValue = String(activeSettings.defaultFollowUpDays ?? 28);
  const totalAmount = calculateTotalAmount(
    Number(activeSettings.consultationFee ?? 0),
    Number(activeSettings.medicineFee ?? 0)
  );

  return {
    prescriptionId: `RX-${Date.now().toString().slice(-6)}`,
    receiptNumber: generateReceiptNumber(clinicLocation),
    clinicLocation,
    patientId: '',
    patientName: '',
    doctorName: '',
    prescriptionDate,
    symptomsSummary: '',
    nature: 'Chilly',
    craving: 'Salt',
    treatmentSummary: '',
    externalMedicines: '',
    investigations: '',
    treatmentForDays: String(activeSettings.defaultFollowUpDays ?? 28),
    consultationCount: '1',
    followUpIntervalValue,
    followUpIntervalUnit: 'days',
    nextConsultationDate: calculateNextConsultationDate(prescriptionDate, Number(followUpIntervalValue), 'days'),
    consultationCharge: String(activeSettings.consultationFee ?? 0),
    medicineCharge: String(activeSettings.medicineFee ?? 0),
    amountPaidCash: '0',
    amountPaidOnline: '0',
    totalAmount: String(totalAmount),
    balanceAmount: String(totalAmount),
    billRequired: 'yes',
    prescriptionRequired: 'yes',
    notes: '',
    remarks: '',
    medicinesAndDosages: '',
  };
}

export default function PrescriptionsPage() {
  const [consultations, setConsultations] = useState<Prescriptions[]>([]);
  const [patients, setPatients] = useState<Patients[]>([]);
  const [doctors, setDoctors] = useState<Doctors[]>([]);
  const [settings, setSettings] = useState<ClinicSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState<Prescriptions | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [lineItems, setLineItems] = useState<ConsultationLineItem[]>(EMPTY_LINE_ITEMS);
  const clinicLocation = useClinicLocation();
  const { toast } = useToast();

  const activeSettings = useMemo(
    () => resolveClinicSettings(clinicLocation, settings),
    [clinicLocation, settings]
  );
  const [draft, setDraft] = useState<ConsultationDraft>(() => buildDraft('Noida'));

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    setDraft(buildDraft(clinicLocation, activeSettings));
    setLineItems(EMPTY_LINE_ITEMS);
  }, [clinicLocation, activeSettings._id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prescriptionsResult, patientsResult, doctorsResult, settingsResult] = await Promise.all([
        BaseCrudService.getAllItems<Prescriptions>('prescriptions'),
        BaseCrudService.getAllItems<Patients>('patients'),
        BaseCrudService.getAllItems<Doctors>('doctors'),
        BaseCrudService.getAllItems<ClinicSettings>('clinicsettings'),
      ]);
      setConsultations(prescriptionsResult);
      setPatients(patientsResult);
      setDoctors(doctorsResult);
      setSettings(settingsResult);
    } catch (error) {
      toast({
        title: 'Consultations Load Failed',
        description: error instanceof Error ? error.message : 'Unable to load consultation records',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatients = patients.filter((patient) => (patient.clinicLocation || 'Noida') === clinicLocation);
  const filteredDoctors = doctors.filter((doctor) => (doctor.clinicLocation || clinicLocation) === clinicLocation);

  const filteredConsultations = consultations.filter((consultation) => {
    const matchesClinic = (consultation.clinicLocation || 'Noida') === clinicLocation;
    const query = searchQuery.toLowerCase();
    return matchesClinic && !consultation.isArchived && (
      consultation.patientName?.toLowerCase().includes(query) ||
      consultation.doctorName?.toLowerCase().includes(query) ||
      consultation.prescriptionId?.toLowerCase().includes(query) ||
      consultation.receiptNumber?.toLowerCase().includes(query)
    );
  });

  const consultationSummary = useMemo(() => {
    return filteredConsultations.reduce(
      (summary, consultation) => {
        summary.totalConsultations += 1;
        summary.totalBilled += Number(consultation.totalAmount ?? 0);
        summary.totalCollected += Number(consultation.amountPaidCash ?? 0) + Number(consultation.amountPaidOnline ?? 0);
        summary.outstanding += Number(consultation.balanceAmount ?? 0);
        return summary;
      },
      { totalConsultations: 0, totalBilled: 0, totalCollected: 0, outstanding: 0 }
    );
  }, [filteredConsultations]);

  const recalculateFinancials = (nextDraft: ConsultationDraft) => {
    const totalAmount = calculateTotalAmount(
      Number(nextDraft.consultationCharge || 0),
      Number(nextDraft.medicineCharge || 0)
    );
    const balanceAmount = calculateBalanceAmount(
      totalAmount,
      Number(nextDraft.amountPaidCash || 0),
      Number(nextDraft.amountPaidOnline || 0)
    );

    return {
      ...nextDraft,
      totalAmount: String(totalAmount),
      balanceAmount: String(balanceAmount),
    };
  };

  const updateDraft = (patch: Partial<ConsultationDraft>) => {
    setDraft((current) => {
      const nextDraft = { ...current, ...patch };
      if (
        patch.prescriptionDate !== undefined ||
        patch.followUpIntervalValue !== undefined ||
        patch.followUpIntervalUnit !== undefined
      ) {
        nextDraft.nextConsultationDate = calculateNextConsultationDate(
          nextDraft.prescriptionDate,
          Number(nextDraft.followUpIntervalValue || 28),
          nextDraft.followUpIntervalUnit
        );
      }

      if (
        patch.consultationCharge !== undefined ||
        patch.medicineCharge !== undefined ||
        patch.amountPaidCash !== undefined ||
        patch.amountPaidOnline !== undefined
      ) {
        return recalculateFinancials(nextDraft);
      }

      return nextDraft;
    });
  };

  const handlePatientSelect = (patientId: string) => {
    const patient = filteredPatients.find((entry) => entry._id === patientId);
    updateDraft({
      patientId: patient?.patientId || '',
      patientName: patient?.patientName || '',
    });
  };

  const handleLineItemChange = (index: number, field: keyof ConsultationLineItem, value: string) => {
    setLineItems((current) => {
      const next = current.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      ));
      updateDraft({
        medicinesAndDosages: flattenMedicineLineItems(next),
      });
      return next;
    });
  };

  const handleAddConsultation = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validatePrescriptionDraft(
      {
        prescriptionId: draft.prescriptionId,
        patientName: draft.patientName,
        doctorName: draft.doctorName,
        prescriptionDate: draft.prescriptionDate,
        medicinesAndDosages: draft.medicinesAndDosages,
        clinicLocation: draft.clinicLocation,
        receiptNumber: draft.receiptNumber,
      },
      consultations
    );

    if (validationError) {
      toast({
        title: 'Consultation Not Saved',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    try {
      const paymentStatus = derivePaymentStatus(Number(draft.balanceAmount), Number(draft.totalAmount));
      await BaseCrudService.create<Prescriptions>('prescriptions', {
        _id: crypto.randomUUID(),
        prescriptionId: normalizeText(draft.prescriptionId),
        receiptNumber: normalizeText(draft.receiptNumber),
        clinicLocation: draft.clinicLocation,
        patientId: normalizeText(draft.patientId),
        patientName: normalizeText(draft.patientName),
        doctorName: normalizeText(draft.doctorName),
        prescriptionDate: draft.prescriptionDate,
        medicinesAndDosages: normalizeText(draft.medicinesAndDosages),
        medicineLineItems: serializeMedicineLineItems(lineItems),
        symptomsSummary: normalizeText(draft.symptomsSummary),
        nature: draft.nature,
        craving: draft.craving,
        treatmentSummary: normalizeText(draft.treatmentSummary),
        externalMedicines: normalizeText(draft.externalMedicines),
        investigations: normalizeText(draft.investigations),
        treatmentForDays: Number(draft.treatmentForDays),
        consultationCount: Number(draft.consultationCount),
        followUpIntervalValue: Number(draft.followUpIntervalValue),
        followUpIntervalUnit: draft.followUpIntervalUnit,
        nextConsultationDate: draft.nextConsultationDate,
        consultationCharge: Number(draft.consultationCharge),
        medicineCharge: Number(draft.medicineCharge),
        totalAmount: Number(draft.totalAmount),
        amountPaidCash: Number(draft.amountPaidCash),
        amountPaidOnline: Number(draft.amountPaidOnline),
        balanceAmount: Number(draft.balanceAmount),
        billRequired: draft.billRequired === 'yes',
        prescriptionRequired: draft.prescriptionRequired === 'yes',
        paymentStatus,
        notes: normalizeText(draft.notes),
        remarks: normalizeText(draft.remarks),
      });

      toast({
        title: 'Consultation Saved',
        description: 'Treatment, fees, and next follow-up have been recorded.',
      });

      setIsAddDialogOpen(false);
      setDraft(buildDraft(clinicLocation, activeSettings));
      setLineItems(EMPTY_LINE_ITEMS);
      await loadData();
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to add consultation',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardShell
      title="Consultations"
      description={`Treatment desk for ${clinicLocation}: prescriptions, fees, receipts, and next-visit planning.`}
      actions={(
        <Button
          onClick={() => {
            setDraft(buildDraft(clinicLocation, activeSettings));
            setLineItems(EMPTY_LINE_ITEMS);
            setIsAddDialogOpen(true);
          }}
          className="h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 px-6 text-base font-semibold text-white shadow-[0_18px_34px_rgba(72,187,120,0.24)] hover:from-emerald-600 hover:to-lime-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Consultation
        </Button>
      )}
    >
      <div className="mb-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-emerald-100 bg-white/90 p-6 shadow-sm">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by patient, doctor, receipt, or consultation ID..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-12 rounded-2xl border-emerald-100 bg-white pl-10 font-paragraph text-slate-700 shadow-sm focus-visible:ring-emerald-200"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Visits', value: consultationSummary.totalConsultations, icon: FileText },
            { label: 'Billed', value: `Rs. ${consultationSummary.totalBilled.toFixed(0)}`, icon: IndianRupee },
            { label: 'Collected', value: `Rs. ${consultationSummary.totalCollected.toFixed(0)}`, icon: IndianRupee },
            { label: 'Outstanding', value: `Rs. ${consultationSummary.outstanding.toFixed(0)}`, icon: CalendarClock },
          ].map((item) => (
            <Card key={item.label} className="rounded-[24px] border-emerald-100 shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-lime-50 p-3 ring-1 ring-emerald-100">
                  <item.icon className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                  <p className="font-heading text-2xl text-slate-800">{item.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="min-h-[520px]">
        {isLoading ? null : filteredConsultations.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {filteredConsultations
              .slice()
              .sort((a, b) => new Date(String(b.prescriptionDate || '')).getTime() - new Date(String(a.prescriptionDate || '')).getTime())
              .map((consultation, index) => (
                <motion.button
                  key={consultation._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="w-full rounded-[28px] border border-emerald-100 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(126,156,130,0.14)]"
                  onClick={() => setSelectedConsultation(consultation)}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex gap-4">
                      <div className="h-fit rounded-2xl bg-gradient-to-br from-emerald-100 to-lime-50 p-3 ring-1 ring-emerald-100">
                        <FileText className="h-6 w-6 text-emerald-700" />
                      </div>
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <h3 className="font-heading text-xl text-slate-800">{consultation.patientName}</h3>
                          <Badge variant="outline">{consultation.prescriptionId}</Badge>
                          <Badge variant="outline">{consultation.receiptNumber || 'Receipt pending'}</Badge>
                        </div>
                        <div className="grid gap-4 font-paragraph text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <p className="font-medium text-slate-800">Doctor</p>
                            <p>{consultation.doctorName}</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">Consultation Date</p>
                            <p>{consultation.prescriptionDate ? new Date(consultation.prescriptionDate).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">Next Consultation</p>
                            <p>{consultation.nextConsultationDate ? new Date(consultation.nextConsultationDate).toLocaleDateString() : 'Not planned'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">Balance</p>
                            <p>Rs. {Number(consultation.balanceAmount ?? 0).toFixed(0)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge className="w-fit bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                      {consultation.paymentStatus || derivePaymentStatus(Number(consultation.balanceAmount), Number(consultation.totalAmount))}
                    </Badge>
                  </div>
                </motion.button>
              ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="mb-4 h-16 w-16 text-foreground/20" />
            <p className="font-paragraph text-lg text-foreground/60">No consultations found</p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedConsultation} onOpenChange={() => setSelectedConsultation(null)}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Consultation Details</DialogTitle>
          </DialogHeader>

          {selectedConsultation && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div><p className="text-sm text-slate-500">Consultation ID</p><p className="font-medium text-slate-900">{selectedConsultation.prescriptionId}</p></div>
                <div><p className="text-sm text-slate-500">Receipt</p><p className="font-medium text-slate-900">{selectedConsultation.receiptNumber || 'N/A'}</p></div>
                <div><p className="text-sm text-slate-500">Patient</p><p className="font-medium text-slate-900">{selectedConsultation.patientName}</p></div>
                <div><p className="text-sm text-slate-500">Doctor</p><p className="font-medium text-slate-900">{selectedConsultation.doctorName}</p></div>
                <div><p className="text-sm text-slate-500">Consultation Date</p><p className="font-medium text-slate-900">{selectedConsultation.prescriptionDate ? new Date(selectedConsultation.prescriptionDate).toLocaleDateString() : 'N/A'}</p></div>
                <div><p className="text-sm text-slate-500">Next Consultation</p><p className="font-medium text-slate-900">{selectedConsultation.nextConsultationDate ? new Date(selectedConsultation.nextConsultationDate).toLocaleDateString() : 'N/A'}</p></div>
                <div><p className="text-sm text-slate-500">Nature / Craving</p><p className="font-medium text-slate-900">{selectedConsultation.nature || 'N/A'} / {selectedConsultation.craving || 'N/A'}</p></div>
                <div><p className="text-sm text-slate-500">Payment Status</p><p className="font-medium text-slate-900">{selectedConsultation.paymentStatus || 'Pending'}</p></div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-500">Symptoms / Diagnosis</p>
                    <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-900 whitespace-pre-wrap">{selectedConsultation.symptomsSummary || 'Not recorded'}</div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-500">Treatment Summary</p>
                    <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-900 whitespace-pre-wrap">{selectedConsultation.treatmentSummary || 'Not recorded'}</div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-500">Medicine Plan</p>
                    <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-900 whitespace-pre-wrap">
                      {flattenMedicineLineItems(parseMedicineLineItems(selectedConsultation.medicineLineItems, selectedConsultation.medicinesAndDosages)) || 'Not recorded'}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><p className="text-sm text-slate-500">Consultation Fee</p><p className="font-medium text-slate-900">Rs. {Number(selectedConsultation.consultationCharge ?? 0).toFixed(0)}</p></div>
                    <div><p className="text-sm text-slate-500">Medicine Fee</p><p className="font-medium text-slate-900">Rs. {Number(selectedConsultation.medicineCharge ?? 0).toFixed(0)}</p></div>
                    <div><p className="text-sm text-slate-500">Cash Received</p><p className="font-medium text-slate-900">Rs. {Number(selectedConsultation.amountPaidCash ?? 0).toFixed(0)}</p></div>
                    <div><p className="text-sm text-slate-500">Online Received</p><p className="font-medium text-slate-900">Rs. {Number(selectedConsultation.amountPaidOnline ?? 0).toFixed(0)}</p></div>
                    <div><p className="text-sm text-slate-500">Total Amount</p><p className="font-medium text-slate-900">Rs. {Number(selectedConsultation.totalAmount ?? 0).toFixed(0)}</p></div>
                    <div><p className="text-sm text-slate-500">Balance</p><p className="font-medium text-rose-600">Rs. {Number(selectedConsultation.balanceAmount ?? 0).toFixed(0)}</p></div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-500">External Medicines / Investigations</p>
                    <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-900 whitespace-pre-wrap">
                      External Medicines: {selectedConsultation.externalMedicines || 'Not recorded'}{'\n'}
                      Investigations: {selectedConsultation.investigations || 'Not recorded'}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-500">Notes / Remarks</p>
                    <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-900 whitespace-pre-wrap">
                      Notes: {selectedConsultation.notes || 'Not recorded'}{'\n'}
                      Remarks: {selectedConsultation.remarks || 'Not recorded'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">New Consultation</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddConsultation} className="space-y-8">
            <p className="text-sm font-medium text-slate-500">Fields marked <span className="text-rose-500">*</span> are required.</p>

            <div className="grid gap-8 xl:grid-cols-2">
              <Card className="rounded-[24px] border-emerald-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-xl">Patient & Visit</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <RequiredLabel required>Patient</RequiredLabel>
                      <Select value={filteredPatients.find((patient) => patient.patientId === draft.patientId)?._id || ''} onValueChange={handlePatientSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredPatients.map((patient) => (
                            <SelectItem key={patient._id} value={patient._id}>
                              {patient.patientName} ({patient.patientId || patient.phoneNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <RequiredLabel htmlFor="doctor-name" required>Doctor</RequiredLabel>
                      <Select value={draft.doctorName} onValueChange={(value) => updateDraft({ doctorName: value })}>
                        <SelectTrigger id="doctor-name">
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredDoctors.map((doctor) => (
                            <SelectItem key={doctor._id} value={doctor.doctorName || doctor._id}>
                              {doctor.doctorName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <RequiredLabel htmlFor="consultation-id" required>Consultation ID</RequiredLabel>
                      <Input id="consultation-id" value={draft.prescriptionId} onChange={(event) => updateDraft({ prescriptionId: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <RequiredLabel htmlFor="receipt-number" required>Receipt Number</RequiredLabel>
                      <Input id="receipt-number" value={draft.receiptNumber} onChange={(event) => updateDraft({ receiptNumber: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <RequiredLabel htmlFor="consultation-date" required>Consultation Date</RequiredLabel>
                      <Input id="consultation-date" type="date" value={draft.prescriptionDate} onChange={(event) => updateDraft({ prescriptionDate: event.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="symptoms-summary">Symptoms / Diagnosis</Label>
                    <Textarea id="symptoms-summary" rows={4} value={draft.symptomsSummary} onChange={(event) => updateDraft({ symptomsSummary: event.target.value })} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nature</Label>
                      <Select value={draft.nature} onValueChange={(value) => updateDraft({ nature: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Chilly">Chilly</SelectItem>
                          <SelectItem value="Hot">Hot</SelectItem>
                          <SelectItem value="Ambithermal">Ambithermal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Craving</Label>
                      <Select value={draft.craving} onValueChange={(value) => updateDraft({ craving: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Salt">Salt</SelectItem>
                          <SelectItem value="Sweet">Sweet</SelectItem>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="Spicy">Spicy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[24px] border-emerald-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-xl">Treatment & Follow-Up</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="treatment-summary">Treatment Summary</Label>
                    <Textarea id="treatment-summary" rows={4} value={draft.treatmentSummary} onChange={(event) => updateDraft({ treatmentSummary: event.target.value })} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="external-medicines">External Medicines</Label>
                      <Textarea id="external-medicines" rows={3} value={draft.externalMedicines} onChange={(event) => updateDraft({ externalMedicines: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="investigations">Investigations</Label>
                      <Textarea id="investigations" rows={3} value={draft.investigations} onChange={(event) => updateDraft({ investigations: event.target.value })} />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="treatment-days">Treatment For (days)</Label>
                      <Input id="treatment-days" type="number" min="1" value={draft.treatmentForDays} onChange={(event) => updateDraft({ treatmentForDays: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="consultation-count">No. of Consultation(s)</Label>
                      <Input id="consultation-count" type="number" min="1" value={draft.consultationCount} onChange={(event) => updateDraft({ consultationCount: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="follow-up-value">Next Consultation After</Label>
                      <Input id="follow-up-value" type="number" min="1" value={draft.followUpIntervalValue} onChange={(event) => updateDraft({ followUpIntervalValue: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Select value={draft.followUpIntervalUnit} onValueChange={(value) => updateDraft({ followUpIntervalUnit: value as FollowUpUnit })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="next-consultation-date">Next Consultation Date</Label>
                    <Input id="next-consultation-date" type="date" value={draft.nextConsultationDate} readOnly />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-[24px] border-emerald-100 shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-xl">Medicine Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {lineItems.map((item, index) => (
                  <div key={`medicine-line-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr]">
                    <Input
                      placeholder={`Medicine ${index + 1}`}
                      value={item.medicineName}
                      onChange={(event) => handleLineItemChange(index, 'medicineName', event.target.value)}
                    />
                    <Input
                      placeholder="Dose / management"
                      value={item.dosageManagement}
                      onChange={(event) => handleLineItemChange(index, 'dosageManagement', event.target.value)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-8 xl:grid-cols-2">
              <Card className="rounded-[24px] border-emerald-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-xl">Billing</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="consultation-charge">Consultation Fee</Label>
                      <Input id="consultation-charge" type="number" min="0" value={draft.consultationCharge} onChange={(event) => updateDraft({ consultationCharge: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="medicine-charge">Medicine Fee</Label>
                      <Input id="medicine-charge" type="number" min="0" value={draft.medicineCharge} onChange={(event) => updateDraft({ medicineCharge: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total-amount">Total Amount</Label>
                      <Input id="total-amount" value={draft.totalAmount} readOnly />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="paid-cash">Paid In Cash</Label>
                      <Input id="paid-cash" type="number" min="0" value={draft.amountPaidCash} onChange={(event) => updateDraft({ amountPaidCash: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paid-online">Paid Online</Label>
                      <Input id="paid-online" type="number" min="0" value={draft.amountPaidOnline} onChange={(event) => updateDraft({ amountPaidOnline: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="balance-amount">Balance Amount</Label>
                      <Input id="balance-amount" value={draft.balanceAmount} readOnly />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Bill Required</Label>
                      <Select value={draft.billRequired} onValueChange={(value) => updateDraft({ billRequired: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prescription Required</Label>
                      <Select value={draft.prescriptionRequired} onValueChange={(value) => updateDraft({ prescriptionRequired: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[24px] border-emerald-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-xl">Notes</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="consultation-notes">Clinical Notes</Label>
                    <Textarea id="consultation-notes" rows={4} value={draft.notes} onChange={(event) => updateDraft({ notes: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consultation-remarks">Remarks</Label>
                    <Textarea id="consultation-remarks" rows={4} value={draft.remarks} onChange={(event) => updateDraft({ remarks: event.target.value })} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Save Consultation
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
