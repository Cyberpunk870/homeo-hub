import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, UserRound } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { Patients } from '@/entities';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RequiredLabel } from '@/components/ui/required-label';
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
import { useToast } from '@/hooks/use-toast';
import { CLINIC_LOCATIONS } from '@/lib/clinic';
import { useClinicLocation } from '@/hooks/use-clinic-location';
import { normalizeText, validatePatientDraft } from '@/lib/validators';
import { generatePatientIdentifier } from '@/lib/consultations';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patients[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patients | null>(null);
  const clinicLocation = useClinicLocation();
  const { toast } = useToast();

  const [newPatient, setNewPatient] = useState({
    patientId: '',
    patientName: '',
    phoneNumber: '',
    mobileNumber: '',
    email: '',
    address: '',
    dateOfBirth: '',
    ageYears: '',
    ageMonths: '',
    gender: '',
    maritalStatus: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    profession: '',
    medicalHistorySummary: '',
    clinicLocation: 'Noida'
  });

  useEffect(() => {
    setNewPatient((prev) => ({ ...prev, clinicLocation, patientId: prev.patientId || generatePatientIdentifier(clinicLocation) }));
  }, [clinicLocation]);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const results = await BaseCrudService.getAllItems<Patients>('patients');
      setPatients(results);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validatePatientDraft(newPatient, patients);
    if (validationError) {
      toast({ title: 'Patient Not Saved', description: validationError, variant: 'destructive' });
      return;
    }

    try {
      await BaseCrudService.create<Patients>('patients', {
        _id: crypto.randomUUID(),
        ...newPatient,
        patientId: normalizeText(newPatient.patientId) || generatePatientIdentifier(newPatient.clinicLocation),
        patientName: normalizeText(newPatient.patientName),
        phoneNumber: normalizeText(newPatient.phoneNumber),
        mobileNumber: normalizeText(newPatient.mobileNumber),
        email: normalizeText(newPatient.email),
        address: normalizeText(newPatient.address),
        ageYears: newPatient.ageYears ? Number(newPatient.ageYears) : undefined,
        ageMonths: newPatient.ageMonths ? Number(newPatient.ageMonths) : undefined,
        maritalStatus: normalizeText(newPatient.maritalStatus),
        city: normalizeText(newPatient.city),
        state: normalizeText(newPatient.state),
        country: normalizeText(newPatient.country),
        postalCode: normalizeText(newPatient.postalCode),
        profession: normalizeText(newPatient.profession),
        medicalHistorySummary: normalizeText(newPatient.medicalHistorySummary),
      });
      toast({ title: 'Patient Added', description: 'Patient profile created successfully' });
      setIsAddDialogOpen(false);
      setNewPatient({
        patientId: generatePatientIdentifier(clinicLocation),
        patientName: '',
        phoneNumber: '',
        mobileNumber: '',
        email: '',
        address: '',
        dateOfBirth: '',
        ageYears: '',
        ageMonths: '',
        gender: '',
        maritalStatus: '',
        city: '',
        state: '',
        country: 'India',
        postalCode: '',
        profession: '',
        medicalHistorySummary: '',
        clinicLocation,
      });
      await loadPatients();
    } catch {
      toast({ title: 'Error', description: 'Failed to add patient', variant: 'destructive' });
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const query = searchQuery.toLowerCase();
    const matchesClinic = (patient.clinicLocation || 'Noida') === clinicLocation;
    return matchesClinic && !patient.isArchived && (
      patient.patientName?.toLowerCase().includes(query) ||
      patient.phoneNumber?.toLowerCase().includes(query) ||
      patient.email?.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardShell
      title="Patients"
      description={`Patient registry for ${clinicLocation} clinic`}
      actions={(
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 px-6 text-base font-semibold text-white shadow-[0_18px_34px_rgba(72,187,120,0.24)] hover:from-emerald-600 hover:to-lime-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      )}
    >
        <div className="mb-8 rounded-[28px] border border-emerald-100 bg-white/90 p-6 shadow-sm">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search patient by name, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-2xl border-emerald-100 bg-white pl-10 text-slate-700 shadow-sm focus-visible:ring-emerald-200"
            />
          </div>
        </div>

        <div className="min-h-[400px]">
          {isLoading ? null : filteredPatients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPatients.map((patient, index) => (
                <motion.button
                  key={patient._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => setSelectedPatient(patient)}
                  className="text-left rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(126,156,130,0.14)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-lime-50 p-3 ring-1 ring-emerald-100">
                      <UserRound className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-heading text-xl text-slate-800">{patient.patientName}</h3>
                        <Badge variant="outline">{patient.gender || 'N/A'}</Badge>
                      </div>
                      <div className="space-y-1 font-paragraph text-sm text-slate-600">
                        <p><span className="font-medium text-slate-800">Patient ID:</span> {patient.patientId || 'Pending'}</p>
                        <p><span className="font-medium text-slate-800">Phone:</span> {patient.phoneNumber || 'N/A'}</p>
                        <p><span className="font-medium text-slate-800">Email:</span> {patient.email || 'N/A'}</p>
                        <p className="line-clamp-2"><span className="font-medium text-slate-800">History:</span> {patient.medicalHistorySummary || 'Not recorded'}</p>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <UserRound className="w-16 h-16 text-foreground/20 mb-4" />
              <p className="font-paragraph text-lg text-foreground/60">No patients found for {clinicLocation}</p>
            </div>
          )}
        </div>
      

      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Patient Details</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-600">Patient ID</p><p className="font-medium text-gray-900">{selectedPatient.patientId || 'Pending'}</p></div>
              <div><p className="text-gray-600">Name</p><p className="font-medium text-gray-900">{selectedPatient.patientName}</p></div>
              <div><p className="text-gray-600">Clinic</p><p className="font-medium text-gray-900">{selectedPatient.clinicLocation || 'Noida'}</p></div>
              <div><p className="text-gray-600">Phone</p><p className="font-medium text-gray-900">{selectedPatient.phoneNumber || 'N/A'}</p></div>
              <div><p className="text-gray-600">Mobile</p><p className="font-medium text-gray-900">{selectedPatient.mobileNumber || 'N/A'}</p></div>
              <div><p className="text-gray-600">Email</p><p className="font-medium text-gray-900">{selectedPatient.email || 'N/A'}</p></div>
              <div><p className="text-gray-600">DOB</p><p className="font-medium text-gray-900">{selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}</p></div>
              <div><p className="text-gray-600">Gender</p><p className="font-medium text-gray-900">{selectedPatient.gender || 'N/A'}</p></div>
              <div><p className="text-gray-600">Age</p><p className="font-medium text-gray-900">{selectedPatient.ageYears || 0} years {selectedPatient.ageMonths || 0} months</p></div>
              <div><p className="text-gray-600">Marital Status</p><p className="font-medium text-gray-900">{selectedPatient.maritalStatus || 'N/A'}</p></div>
              <div><p className="text-gray-600">City</p><p className="font-medium text-gray-900">{selectedPatient.city || 'N/A'}</p></div>
              <div><p className="text-gray-600">State</p><p className="font-medium text-gray-900">{selectedPatient.state || 'N/A'}</p></div>
              <div><p className="text-gray-600">Country</p><p className="font-medium text-gray-900">{selectedPatient.country || 'N/A'}</p></div>
              <div><p className="text-gray-600">Postal Code</p><p className="font-medium text-gray-900">{selectedPatient.postalCode || 'N/A'}</p></div>
              <div><p className="text-gray-600">Profession</p><p className="font-medium text-gray-900">{selectedPatient.profession || 'N/A'}</p></div>
              <div className="sm:col-span-2">
                <p className="text-gray-600 mb-1">Address</p>
                <p className="font-medium text-gray-900">{selectedPatient.address || 'N/A'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-gray-600 mb-1">Medical History Summary</p>
                <div className="bg-gray-50 rounded-lg border p-3 text-gray-900 whitespace-pre-wrap">
                  {selectedPatient.medicalHistorySummary || 'Not recorded'}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Add Patient</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPatient} className="space-y-4">
            <p className="text-sm font-medium text-slate-500">Fields marked <span className="text-rose-500">*</span> are required.</p>
            <div className="space-y-2">
              <Label htmlFor="patient-id">Patient ID</Label>
              <Input id="patient-id" value={newPatient.patientId} onChange={(e) => setNewPatient({ ...newPatient, patientId: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <RequiredLabel htmlFor="patient-name" required>Patient Name</RequiredLabel>
                <Input id="patient-name" value={newPatient.patientName} onChange={(e) => setNewPatient({ ...newPatient, patientName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="patient-phone" required>Phone Number</RequiredLabel>
                <Input id="patient-phone" value={newPatient.phoneNumber} onChange={(e) => setNewPatient({ ...newPatient, phoneNumber: e.target.value })} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient-mobile">Mobile Number</Label>
                <Input id="patient-mobile" value={newPatient.mobileNumber} onChange={(e) => setNewPatient({ ...newPatient, mobileNumber: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient-email">Email</Label>
                <Input id="patient-email" type="email" value={newPatient.email} onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-dob">Date of Birth</Label>
                <Input id="patient-dob" type="date" value={newPatient.dateOfBirth} onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Clinic</Label>
                <Select value={newPatient.clinicLocation} onValueChange={(value) => setNewPatient({ ...newPatient, clinicLocation: value })}>
                  <SelectTrigger>
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
                <Label>Gender</Label>
                <Select value={newPatient.gender} onValueChange={(value) => setNewPatient({ ...newPatient, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient-age-years">Age (Years)</Label>
                <Input id="patient-age-years" type="number" min="0" value={newPatient.ageYears} onChange={(e) => setNewPatient({ ...newPatient, ageYears: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-age-months">Age (Months)</Label>
                <Input id="patient-age-months" type="number" min="0" max="11" value={newPatient.ageMonths} onChange={(e) => setNewPatient({ ...newPatient, ageMonths: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Marital Status</Label>
                <Select value={newPatient.maritalStatus} onValueChange={(value) => setNewPatient({ ...newPatient, maritalStatus: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Widowed">Widowed</SelectItem>
                    <SelectItem value="Separated">Separated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient-address">Address</Label>
              <Textarea id="patient-address" value={newPatient.address} onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient-city">City</Label>
                <Input id="patient-city" value={newPatient.city} onChange={(e) => setNewPatient({ ...newPatient, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-state">State</Label>
                <Input id="patient-state" value={newPatient.state} onChange={(e) => setNewPatient({ ...newPatient, state: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-country">Country</Label>
                <Input id="patient-country" value={newPatient.country} onChange={(e) => setNewPatient({ ...newPatient, country: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-postal">Pin / Zip Code</Label>
                <Input id="patient-postal" value={newPatient.postalCode} onChange={(e) => setNewPatient({ ...newPatient, postalCode: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-profession">Profession</Label>
              <Input id="patient-profession" value={newPatient.profession} onChange={(e) => setNewPatient({ ...newPatient, profession: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-history">Medical History Summary</Label>
              <Textarea id="patient-history" value={newPatient.medicalHistorySummary} onChange={(e) => setNewPatient({ ...newPatient, medicalHistorySummary: e.target.value })} rows={4} />
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Save Patient</Button>
          </form>
        </DialogContent>
      </Dialog>

    </DashboardShell>
  );
}
