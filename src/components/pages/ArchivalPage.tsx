import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ArchiveRestore, ArchiveX, RefreshCw } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import type { MedicalCertificates, Patients, Prescriptions } from '@/entities';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClinicLocation } from '@/hooks/use-clinic-location';
import { useToast } from '@/hooks/use-toast';

type ArchiveSection = 'patients' | 'consultations' | 'certificates';

export default function ArchivalPage() {
  const clinicLocation = useClinicLocation();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patients[]>([]);
  const [consultations, setConsultations] = useState<Prescriptions[]>([]);
  const [certificates, setCertificates] = useState<MedicalCertificates[]>([]);
  const [activeSection, setActiveSection] = useState<ArchiveSection>('consultations');

  useEffect(() => {
    void loadData();
  }, [clinicLocation]);

  const loadData = async () => {
    const [patientsResult, consultationsResult, certificatesResult] = await Promise.all([
      BaseCrudService.getAllItems<Patients>('patients'),
      BaseCrudService.getAllItems<Prescriptions>('prescriptions'),
      BaseCrudService.getAllItems<MedicalCertificates>('medicalcertificates'),
    ]);
    setPatients(patientsResult);
    setConsultations(consultationsResult);
    setCertificates(certificatesResult);
  };

  const patientRows = useMemo(() => patients.filter((row) => (row.clinicLocation || 'Noida') === clinicLocation), [patients, clinicLocation]);
  const consultationRows = useMemo(() => consultations.filter((row) => (row.clinicLocation || 'Noida') === clinicLocation), [consultations, clinicLocation]);
  const certificateRows = useMemo(() => certificates.filter((row) => (row.clinicLocation || 'Noida') === clinicLocation), [certificates, clinicLocation]);

  const archivePatient = async (patient: Patients, archived: boolean) => {
    await BaseCrudService.update<Patients>('patients', {
      ...patient,
      _id: patient._id,
      isArchived: archived,
      archivedAt: archived ? new Date().toISOString() : null as unknown as string,
    });
    toast({ title: archived ? 'Patient Archived' : 'Patient Restored', description: patient.patientName || 'Record updated' });
    await loadData();
  };

  const archiveConsultation = async (consultation: Prescriptions, archived: boolean) => {
    await BaseCrudService.update<Prescriptions>('prescriptions', {
      ...consultation,
      _id: consultation._id,
      isArchived: archived,
      archivedAt: archived ? new Date().toISOString() : null as unknown as string,
    });
    toast({ title: archived ? 'Consultation Archived' : 'Consultation Restored', description: consultation.prescriptionId || 'Record updated' });
    await loadData();
  };

  const archiveCertificate = async (certificate: MedicalCertificates, archived: boolean) => {
    await BaseCrudService.update<MedicalCertificates>('medicalcertificates', {
      ...certificate,
      _id: certificate._id,
      isArchived: archived,
    });
    toast({ title: archived ? 'Certificate Archived' : 'Certificate Restored', description: certificate.certificateNumber || 'Record updated' });
    await loadData();
  };

  return (
    <DashboardShell
      title="Archival"
      description={`Archive or restore patients, consultations, and certificates for ${clinicLocation}.`}
      actions={(
        <div className="flex gap-3">
          {(['consultations', 'patients', 'certificates'] as ArchiveSection[]).map((section) => (
            <Button key={section} variant={activeSection === section ? 'default' : 'outline'} onClick={() => setActiveSection(section)}>
              {section === 'consultations' ? 'Consultations' : section === 'patients' ? 'Patients' : 'Certificates'}
            </Button>
          ))}
        </div>
      )}
    >
      {activeSection === 'consultations' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ArchivePanel
            title="Active Consultations"
            items={consultationRows.filter((row) => !row.isArchived)}
            renderLabel={(row) => `${row.prescriptionId || row.receiptNumber} · ${row.patientName}`}
            actionLabel="Archive"
            actionIcon={<ArchiveX className="h-4 w-4" />}
            onAction={(row) => archiveConsultation(row, true)}
          />
          <ArchivePanel
            title="Archived Consultations"
            items={consultationRows.filter((row) => row.isArchived)}
            renderLabel={(row) => `${row.prescriptionId || row.receiptNumber} · ${row.patientName}`}
            actionLabel="Restore"
            actionIcon={<ArchiveRestore className="h-4 w-4" />}
            onAction={(row) => archiveConsultation(row, false)}
          />
        </div>
      ) : null}

      {activeSection === 'patients' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ArchivePanel
            title="Active Patients"
            items={patientRows.filter((row) => !row.isArchived)}
            renderLabel={(row) => `${row.patientName} · ${row.patientId || row.phoneNumber}`}
            actionLabel="Archive"
            actionIcon={<ArchiveX className="h-4 w-4" />}
            onAction={(row) => archivePatient(row, true)}
          />
          <ArchivePanel
            title="Archived Patients"
            items={patientRows.filter((row) => row.isArchived)}
            renderLabel={(row) => `${row.patientName} · ${row.patientId || row.phoneNumber}`}
            actionLabel="Restore"
            actionIcon={<ArchiveRestore className="h-4 w-4" />}
            onAction={(row) => archivePatient(row, false)}
          />
        </div>
      ) : null}

      {activeSection === 'certificates' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ArchivePanel
            title="Active Certificates"
            items={certificateRows.filter((row) => !row.isArchived)}
            renderLabel={(row) => `${row.certificateNumber} · ${row.patientName}`}
            actionLabel="Archive"
            actionIcon={<ArchiveX className="h-4 w-4" />}
            onAction={(row) => archiveCertificate(row, true)}
          />
          <ArchivePanel
            title="Archived Certificates"
            items={certificateRows.filter((row) => row.isArchived)}
            renderLabel={(row) => `${row.certificateNumber} · ${row.patientName}`}
            actionLabel="Restore"
            actionIcon={<ArchiveRestore className="h-4 w-4" />}
            onAction={(row) => archiveCertificate(row, false)}
          />
        </div>
      ) : null}
    </DashboardShell>
  );
}

function ArchivePanel<T>({
  title,
  items,
  renderLabel,
  actionLabel,
  actionIcon,
  onAction,
}: {
  title: string;
  items: T[];
  renderLabel: (item: T) => string;
  actionLabel: string;
  actionIcon: ReactNode;
  onAction: (item: T) => void;
}) {
  return (
    <Card className="rounded-[24px] border-emerald-100 shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length > 0 ? items.map((item, index) => (
          <div key={index} className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white p-4">
            <p className="text-sm font-medium text-slate-800">{renderLabel(item)}</p>
            <Button variant="outline" onClick={() => onAction(item)}>
              {actionIcon}
              <span className="ml-2">{actionLabel}</span>
            </Button>
          </div>
        )) : (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-emerald-100 bg-emerald-50/40 p-4 text-sm text-slate-500">
            <RefreshCw className="h-4 w-4" />
            No records in this section.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
