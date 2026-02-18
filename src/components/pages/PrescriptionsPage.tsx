import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Plus } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { Prescriptions, Patients, Doctors } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescriptions[]>([]);
  const [patients, setPatients] = useState<Patients[]>([]);
  const [doctors, setDoctors] = useState<Doctors[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescriptions | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newPrescription, setNewPrescription] = useState({
    prescriptionId: '',
    patientName: '',
    doctorName: '',
    prescriptionDate: '',
    medicinesAndDosages: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prescriptionsResult, patientsResult, doctorsResult] = await Promise.all([
        BaseCrudService.getAll<Prescriptions>('prescriptions'),
        BaseCrudService.getAll<Patients>('patients'),
        BaseCrudService.getAll<Doctors>('doctors')
      ]);
      setPrescriptions(prescriptionsResult.items);
      setPatients(patientsResult.items);
      // Filter doctors to only include Dr. R.C. Upadhayay and Dr. Priya Upadhyay
      const filteredDoctors = doctorsResult.items.filter(doc => 
        doc.doctorName === 'Dr. R.C. Upadhayay' || doc.doctorName === 'Dr. Priya Upadhyay'
      );
      setDoctors(filteredDoctors);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await BaseCrudService.create<Prescriptions>('prescriptions', {
        _id: crypto.randomUUID(),
        ...newPrescription
      });

      toast({
        title: 'Prescription Added',
        description: 'New prescription has been created successfully'
      });

      setIsAddDialogOpen(false);
      setNewPrescription({
        prescriptionId: '',
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
    const query = searchQuery.toLowerCase();
    return prescription.patientName?.toLowerCase().includes(query) ||
           prescription.doctorName?.toLowerCase().includes(query) ||
           prescription.prescriptionId?.toLowerCase().includes(query);
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="w-full max-w-[100rem] mx-auto px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex items-end justify-between"
        >
          <div>
            <h1 className="font-heading text-5xl text-foreground mb-4">Prescriptions</h1>
            <p className="font-paragraph text-lg text-foreground/70">
              Manage patient prescriptions and medical records
            </p>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Prescription
          </Button>
        </motion.div>

        {/* Search */}
        <div className="bg-white p-6 rounded-lg border border-secondary/30 mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <Input
              placeholder="Search by patient, doctor, or prescription ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 font-paragraph"
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
                  className="bg-white p-6 rounded-lg border border-secondary/30 hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => setSelectedPrescription(prescription)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      <div className="p-3 bg-primary/10 rounded-lg h-fit">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading text-xl text-foreground">
                            {prescription.patientName}
                          </h3>
                          <Badge variant="outline" className="font-paragraph text-xs">
                            {prescription.prescriptionId}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-paragraph text-sm">
                          <div>
                            <p className="text-foreground/60">Doctor</p>
                            <p className="font-medium">{prescription.doctorName}</p>
                          </div>
                          <div>
                            <p className="text-foreground/60">Date</p>
                            <p className="font-medium">
                              {prescription.prescriptionDate ? new Date(prescription.prescriptionDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-foreground/60">Medicines</p>
                            <p className="font-medium line-clamp-1">{prescription.medicinesAndDosages}</p>
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
                  <p className="text-foreground/60 mb-1">Prescription ID</p>
                  <p className="font-medium text-foreground">{selectedPrescription.prescriptionId}</p>
                </div>
                <div>
                  <p className="text-foreground/60 mb-1">Date</p>
                  <p className="font-medium text-foreground">
                    {selectedPrescription.prescriptionDate ? new Date(selectedPrescription.prescriptionDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-foreground/60 mb-1">Patient Name</p>
                  <p className="font-medium text-foreground">{selectedPrescription.patientName}</p>
                </div>
                <div>
                  <p className="text-foreground/60 mb-1">Doctor Name</p>
                  <p className="font-medium text-foreground">{selectedPrescription.doctorName}</p>
                </div>
              </div>

              <div>
                <p className="text-foreground/60 mb-2 font-paragraph text-sm">Medicines & Dosages</p>
                <div className="bg-background p-4 rounded-lg">
                  <p className="font-paragraph text-sm whitespace-pre-wrap">{selectedPrescription.medicinesAndDosages}</p>
                </div>
              </div>

              {selectedPrescription.notes && (
                <div>
                  <p className="text-foreground/60 mb-2 font-paragraph text-sm">Notes</p>
                  <div className="bg-background p-4 rounded-lg">
                    <p className="font-paragraph text-sm whitespace-pre-wrap">{selectedPrescription.notes}</p>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prescription-id" className="font-paragraph">Prescription ID</Label>
                <Input
                  id="prescription-id"
                  value={newPrescription.prescriptionId}
                  onChange={(e) => setNewPrescription({ ...newPrescription, prescriptionId: e.target.value })}
                  placeholder="e.g., RX001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prescription-date" className="font-paragraph">Date</Label>
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
              <Label htmlFor="patient" className="font-paragraph">Patient</Label>
              <Select
                value={newPrescription.patientName}
                onValueChange={(value) => setNewPrescription({ ...newPrescription, patientName: value })}
                required
              >
                <SelectTrigger id="patient">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(patient => (
                    <SelectItem key={patient._id} value={patient.patientName || ''}>
                      {patient.patientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctor" className="font-paragraph">Doctor</Label>
              <Select
                value={newPrescription.doctorName}
                onValueChange={(value) => setNewPrescription({ ...newPrescription, doctorName: value })}
                required
              >
                <SelectTrigger id="doctor">
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map(doctor => (
                    <SelectItem key={doctor._id} value={doctor.doctorName || ''}>
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

      <Footer />
    </div>
  );
}
