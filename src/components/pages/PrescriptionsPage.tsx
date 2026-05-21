import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Plus } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { Prescriptions, Patients, Doctors } from '@/entities';
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
import { useToast } from '@/hooks/use-toast';
import { CLINIC_LOCATIONS, getStoredClinicLocation } from '@/lib/clinic';
import { useClinicLocation } from '@/hooks/use-clinic-location';
import { normalizeText, validatePrescriptionDraft } from '@/lib/validators';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescriptions[]>([]);
  const [patients, setPatients] = useState<Patients[]>([]);
  const [doctors, setDoctors] = useState<Doctors[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescriptions | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const clinicLocation = useClinicLocation();

  const [newPrescription, setNewPrescription] = useState({
    prescriptionId: '',
    clinicLocation: 'Noida',
    patientName: '',
    doctorName: '',
    prescriptionDate: '',
    medicinesAndDosages: '',
    notes: ''
  });

  useEffect(() => {
    const activeClinic = getStoredClinicLocation();
    setNewPrescription((prev) => ({ ...prev, clinicLocation: activeClinic }));
  }, []);

  useEffect(() => {
    setNewPrescription((prev) => ({ ...prev, clinicLocation }));
  }, [clinicLocation]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prescriptionsResult, patientsResult, doctorsResult] = await Promise.all([
        BaseCrudService.getAllItems<Prescriptions>('prescriptions'),
        BaseCrudService.getAllItems<Patients>('patients'),
        BaseCrudService.getAllItems<Doctors>('doctors')
      ]);
      setPrescriptions(prescriptionsResult);
      setPatients(patientsResult);
      // Filter doctors to only include Dr. R.C. Upadhayay and Dr. Priya Upadhyay
      const filteredDoctors = doctorsResult.filter(doc => {
        const name = (doc.doctorName || '').toLowerCase();
        return name.includes('upadhya') || name.includes('upadhyay');
      });
      setDoctors(
        filteredDoctors.length > 0 ? filteredDoctors : doctorsResult
      );
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validatePrescriptionDraft(newPrescription, prescriptions);
    if (validationError) {
      toast({
        title: 'Prescription Not Saved',
        description: validationError,
        variant: 'destructive'
      });
      return;
    }

    try {
      await BaseCrudService.create<Prescriptions>('prescriptions', {
        _id: crypto.randomUUID(),
        ...newPrescription,
        prescriptionId: normalizeText(newPrescription.prescriptionId),
        patientName: normalizeText(newPrescription.patientName),
        doctorName: normalizeText(newPrescription.doctorName),
        medicinesAndDosages: normalizeText(newPrescription.medicinesAndDosages),
        notes: normalizeText(newPrescription.notes),
      });

      toast({
        title: 'Prescription Added',
        description: 'New prescription has been created successfully'
      });

      setIsAddDialogOpen(false);
      setNewPrescription({
        prescriptionId: '',
        clinicLocation: newPrescription.clinicLocation,
        patientName: '',
        doctorName: '',
        prescriptionDate: '',
        medicinesAndDosages: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add prescription',
        variant: 'destructive'
      });
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesClinic = (prescription.clinicLocation || 'Noida') === clinicLocation;
    const query = searchQuery.toLowerCase();
    return matchesClinic && (
           prescription.patientName?.toLowerCase().includes(query) ||
           prescription.doctorName?.toLowerCase().includes(query) ||
           prescription.prescriptionId?.toLowerCase().includes(query) ||
           prescription.clinicLocation?.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardShell
      title="Prescriptions"
      description={`Manage patient prescriptions and medical records for ${clinicLocation} clinic`}
      actions={(
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 px-6 text-base font-semibold text-white shadow-[0_18px_34px_rgba(72,187,120,0.24)] hover:from-emerald-600 hover:to-lime-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Prescription
        </Button>
      )}
    >

        {/* Search */}
        <div className="mb-8 rounded-[28px] border border-emerald-100 bg-white/90 p-6 shadow-sm">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by patient, doctor, or prescription ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-2xl border-emerald-100 bg-white pl-10 font-paragraph text-slate-700 shadow-sm focus-visible:ring-emerald-200"
            />
          </div>
        </div>

        {/* Prescriptions List */}
        <div className="min-h-[600px]">
          {isLoading ? null : filteredPrescriptions.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {filteredPrescriptions.map((prescription, index) => (
                <motion.div
                  key={prescription._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="cursor-pointer rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(126,156,130,0.14)]"
                  onClick={() => setSelectedPrescription(prescription)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      <div className="h-fit rounded-2xl bg-gradient-to-br from-emerald-100 to-lime-50 p-3 ring-1 ring-emerald-100">
                        <FileText className="w-6 h-6 text-emerald-700" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading text-xl text-slate-800">
                            {prescription.patientName}
                          </h3>
                          <Badge variant="outline" className="font-paragraph text-xs">
                            {prescription.prescriptionId}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 font-paragraph text-sm">
                          <div>
                            <p className="text-slate-500 font-medium">Doctor</p>
                            <p className="font-medium text-slate-800">{prescription.doctorName}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 font-medium">Date</p>
                            <p className="font-medium text-slate-800">
                              {prescription.prescriptionDate ? new Date(prescription.prescriptionDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 font-medium">Clinic</p>
                            <p className="font-medium text-slate-800">{prescription.clinicLocation || 'Noida'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 font-medium">Medicines</p>
                            <p className="font-medium line-clamp-1 text-slate-800">{prescription.medicinesAndDosages}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <FileText className="w-16 h-16 text-foreground/20 mb-4" />
              <p className="font-paragraph text-lg text-foreground/60">No prescriptions found</p>
            </div>
          )}
        </div>

      {/* Prescription Details Dialog */}
      <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              Prescription Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedPrescription && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 font-paragraph text-sm">
                <div>
                  <p className="text-gray-600 mb-1 font-medium">Prescription ID</p>
                  <p className="font-medium text-gray-900">{selectedPrescription.prescriptionId}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1 font-medium">Date</p>
                  <p className="font-medium text-gray-900">
                    {selectedPrescription.prescriptionDate ? new Date(selectedPrescription.prescriptionDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1 font-medium">Patient Name</p>
                  <p className="font-medium text-gray-900">{selectedPrescription.patientName}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1 font-medium">Clinic</p>
                  <p className="font-medium text-gray-900">{selectedPrescription.clinicLocation || 'Noida'}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1 font-medium">Doctor Name</p>
                  <p className="font-medium text-gray-900">{selectedPrescription.doctorName}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-600 mb-2 font-paragraph text-sm font-medium">Medicines & Dosages</p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="font-paragraph text-sm whitespace-pre-wrap text-gray-900">{selectedPrescription.medicinesAndDosages}</p>
                </div>
              </div>

              {selectedPrescription.notes && (
                <div>
                  <p className="text-gray-600 mb-2 font-paragraph text-sm font-medium">Notes</p>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="font-paragraph text-sm whitespace-pre-wrap text-gray-900">{selectedPrescription.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Prescription Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              Add New Prescription
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddPrescription} className="space-y-6">
            <p className="text-sm font-medium text-slate-500">Fields marked <span className="text-rose-500">*</span> are required.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <RequiredLabel htmlFor="prescription-id" required className="font-paragraph">Prescription ID</RequiredLabel>
                <Input
                  id="prescription-id"
                  value={newPrescription.prescriptionId}
                  onChange={(e) => setNewPrescription({ ...newPrescription, prescriptionId: e.target.value })}
                  placeholder="e.g., RX001"
                  required
                />
              </div>

              <div className="space-y-2">
                <RequiredLabel htmlFor="prescription-date" required className="font-paragraph">Date</RequiredLabel>
                <Input
                  id="prescription-date"
                  type="date"
                  value={newPrescription.prescriptionDate}
                  onChange={(e) => setNewPrescription({ ...newPrescription, prescriptionDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <RequiredLabel htmlFor="clinic" required className="font-paragraph">Clinic</RequiredLabel>
              <Select
                value={newPrescription.clinicLocation}
                onValueChange={(value) => setNewPrescription({ ...newPrescription, clinicLocation: value })}
                required
              >
                <SelectTrigger id="clinic">
                  <SelectValue placeholder="Select clinic" />
                </SelectTrigger>
                <SelectContent>
                  {CLINIC_LOCATIONS.map((clinic) => (
                    <SelectItem key={clinic} value={clinic}>{clinic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <RequiredLabel htmlFor="patient" required className="font-paragraph">Patient</RequiredLabel>
              <Select
                value={newPrescription.patientName}
                onValueChange={(value) => setNewPrescription({ ...newPrescription, patientName: value })}
                required
              >
                <SelectTrigger id="patient">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients
                    .filter((patient) => !!patient.patientName)
                    .filter((patient) => (patient.clinicLocation || 'Noida') === newPrescription.clinicLocation)
                    .map(patient => (
                    <SelectItem key={patient._id} value={patient.patientName!}>
                      {patient.patientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <RequiredLabel htmlFor="doctor" required className="font-paragraph">Doctor</RequiredLabel>
              <Select
                value={newPrescription.doctorName}
                onValueChange={(value) => setNewPrescription({ ...newPrescription, doctorName: value })}
                required
              >
                <SelectTrigger id="doctor">
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors
                    .filter((doctor) => !!doctor.doctorName)
                    .filter((doctor) => !doctor.clinicLocation || doctor.clinicLocation === newPrescription.clinicLocation)
                    .map(doctor => (
                    <SelectItem key={doctor._id} value={doctor.doctorName!}>
                      {doctor.doctorName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicines" className="font-paragraph">Medicines & Dosages</Label>
              <Textarea
                id="medicines"
                value={newPrescription.medicinesAndDosages}
                onChange={(e) => setNewPrescription({ ...newPrescription, medicinesAndDosages: e.target.value })}
                placeholder="Enter medicines and dosages..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="font-paragraph">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={newPrescription.notes}
                onChange={(e) => setNewPrescription({ ...newPrescription, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Add Prescription
            </Button>
          </form>
        </DialogContent>
      </Dialog>

    </DashboardShell>
  );
}
