import { useEffect, useMemo, useState } from 'react';
import { FileCheck2, Plus, Search } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import type { Doctors, MedicalCertificates, Patients } from '@/entities';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClinicLocation } from '@/hooks/use-clinic-location';
import { useToast } from '@/hooks/use-toast';
import { generateCertificateNumber, toIsoDateInput } from '@/lib/consultations';

export default function MedicalCertificatesPage() {
  const clinicLocation = useClinicLocation();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<MedicalCertificates[]>([]);
  const [patients, setPatients] = useState<Patients[]>([]);
  const [doctors, setDoctors] = useState<Doctors[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState({
    certificateNumber: generateCertificateNumber(clinicLocation),
    patientId: '',
    patientName: '',
    doctorName: '',
    issueDate: toIsoDateInput(new Date()),
    diagnosisSummary: '',
    restDays: '3',
    notes: '',
  });

  useEffect(() => {
    void loadData();
  }, [clinicLocation]);

  const loadData = async () => {
    const [certificatesResult, patientsResult, doctorsResult] = await Promise.all([
      BaseCrudService.getAllItems<MedicalCertificates>('medicalcertificates'),
      BaseCrudService.getAllItems<Patients>('patients'),
      BaseCrudService.getAllItems<Doctors>('doctors'),
    ]);
    setCertificates(certificatesResult);
    setPatients(patientsResult);
    setDoctors(doctorsResult);
  };

  const visibleCertificates = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return certificates.filter((certificate) =>
      (certificate.clinicLocation || 'Noida') === clinicLocation &&
      !certificate.isArchived &&
      (
        certificate.certificateNumber?.toLowerCase().includes(query) ||
        certificate.patientName?.toLowerCase().includes(query) ||
        certificate.doctorName?.toLowerCase().includes(query)
      )
    );
  }, [certificates, clinicLocation, searchQuery]);

  const activePatients = patients.filter((patient) => (patient.clinicLocation || 'Noida') === clinicLocation && !patient.isArchived);
  const activeDoctors = doctors.filter((doctor) => (doctor.clinicLocation || clinicLocation) === clinicLocation);

  const handlePatientChange = (id: string) => {
    const patient = activePatients.find((entry) => entry._id === id);
    setDraft((prev) => ({
      ...prev,
      patientId: patient?.patientId || '',
      patientName: patient?.patientName || '',
    }));
  };

  const handleSave = async () => {
    await BaseCrudService.create<MedicalCertificates>('medicalcertificates', {
      _id: crypto.randomUUID(),
      clinicLocation,
      certificateNumber: draft.certificateNumber,
      patientId: draft.patientId,
      patientName: draft.patientName,
      doctorName: draft.doctorName,
      issueDate: draft.issueDate,
      diagnosisSummary: draft.diagnosisSummary.trim(),
      restDays: Number(draft.restDays),
      notes: draft.notes.trim(),
      isArchived: false,
    });
    toast({ title: 'Certificate Created', description: 'Medical certificate has been saved.' });
    setDraft({
      certificateNumber: generateCertificateNumber(clinicLocation),
      patientId: '',
      patientName: '',
      doctorName: '',
      issueDate: toIsoDateInput(new Date()),
      diagnosisSummary: '',
      restDays: '3',
      notes: '',
    });
    setIsOpen(false);
    await loadData();
  };

  return (
    <DashboardShell
      title="Medical Certificates"
      description={`Issue and review medical certificates for ${clinicLocation}.`}
      actions={(
        <Button onClick={() => setIsOpen(true)} className="h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 px-6 text-base font-semibold text-white">
          <Plus className="mr-2 h-4 w-4" />
          New Certificate
        </Button>
      )}
    >
      <div className="mb-8 rounded-[24px] border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search certificate, patient, or doctor..." className="pl-9" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {visibleCertificates.map((certificate) => (
          <div key={certificate._id} className="rounded-[24px] border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-lime-50 p-3">
                <FileCheck2 className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-heading text-xl text-slate-800">{certificate.certificateNumber}</h3>
                <p className="text-sm text-slate-500">{certificate.patientName}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              <p><span className="font-medium">Doctor:</span> {certificate.doctorName}</p>
              <p><span className="font-medium">Date:</span> {certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : 'N/A'}</p>
              <p><span className="font-medium">Rest Days:</span> {certificate.restDays || 0}</p>
            </div>
            <div className="mt-4 rounded-2xl border bg-slate-50 p-4 text-sm text-slate-800 whitespace-pre-wrap">
              {certificate.diagnosisSummary || 'No diagnosis summary'}
              {certificate.notes ? `\n\n${certificate.notes}` : ''}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Create Medical Certificate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Patient</Label>
                <Select value={activePatients.find((patient) => patient.patientId === draft.patientId)?._id || ''} onValueChange={handlePatientChange}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {activePatients.map((patient) => (
                      <SelectItem key={patient._id} value={patient._id}>{patient.patientName} ({patient.patientId || patient.phoneNumber})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Doctor</Label>
                <Select value={draft.doctorName} onValueChange={(value) => setDraft((prev) => ({ ...prev, doctorName: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                  <SelectContent>
                    {activeDoctors.map((doctor) => (
                      <SelectItem key={doctor._id} value={doctor.doctorName || doctor._id}>{doctor.doctorName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="certificate-number">Certificate Number</Label>
                <Input id="certificate-number" value={draft.certificateNumber} onChange={(event) => setDraft((prev) => ({ ...prev, certificateNumber: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue-date">Issue Date</Label>
                <Input id="issue-date" type="date" value={draft.issueDate} onChange={(event) => setDraft((prev) => ({ ...prev, issueDate: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rest-days">Rest Days</Label>
                <Input id="rest-days" type="number" min="0" value={draft.restDays} onChange={(event) => setDraft((prev) => ({ ...prev, restDays: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnosis-summary">Diagnosis Summary</Label>
              <Textarea id="diagnosis-summary" rows={4} value={draft.diagnosisSummary} onChange={(event) => setDraft((prev) => ({ ...prev, diagnosisSummary: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certificate-notes">Notes</Label>
              <Textarea id="certificate-notes" rows={5} value={draft.notes} onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))} />
            </div>
            <Button onClick={handleSave} className="w-full">Save Certificate</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

