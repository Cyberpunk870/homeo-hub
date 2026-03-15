import type { Patients, Prescriptions } from '@/entities';
import { normalizeClinicLocation } from '@/lib/clinic';

export function normalizeText(value?: string | null) {
  return (value ?? '').trim();
}

export function isValidPhoneNumber(value: string) {
  return /^[0-9+\-\s]{8,15}$/.test(value);
}

export function validatePatientDraft(
  draft: {
    patientName: string;
    phoneNumber: string;
    clinicLocation: string;
  },
  existingPatients: Patients[]
) {
  const patientName = normalizeText(draft.patientName);
  const phoneNumber = normalizeText(draft.phoneNumber);
  const clinicLocation = normalizeClinicLocation(draft.clinicLocation);

  if (!patientName) return 'Enter patient name';
  if (!phoneNumber) return 'Enter phone number';
  if (!isValidPhoneNumber(phoneNumber)) return 'Enter a valid phone number';

  const duplicate = existingPatients.find(
    (patient) =>
      normalizeClinicLocation(patient.clinicLocation) === clinicLocation &&
      normalizeText(patient.phoneNumber) === phoneNumber
  );

  if (duplicate) {
    return 'A patient with this phone number already exists in this clinic';
  }

  return null;
}

export function validatePrescriptionDraft(
  draft: {
    prescriptionId: string;
    patientName: string;
    doctorName: string;
    prescriptionDate: string;
    medicinesAndDosages: string;
    clinicLocation: string;
  },
  existingPrescriptions: Prescriptions[]
) {
  const prescriptionId = normalizeText(draft.prescriptionId);
  const patientName = normalizeText(draft.patientName);
  const doctorName = normalizeText(draft.doctorName);
  const prescriptionDate = normalizeText(draft.prescriptionDate);
  const medicinesAndDosages = normalizeText(draft.medicinesAndDosages);

  if (!prescriptionId) return 'Enter prescription ID';
  if (!patientName) return 'Select a patient';
  if (!doctorName) return 'Select doctor name';
  if (!prescriptionDate) return 'Select prescription date';
  if (!medicinesAndDosages) return 'Enter medicines and dosages';

  const duplicatePrescription = existingPrescriptions.find(
    (prescription) => normalizeText(prescription.prescriptionId).toLowerCase() === prescriptionId.toLowerCase()
  );

  if (duplicatePrescription) {
    return 'Use a unique prescription ID';
  }

  return null;
}

export function validateStockDraft(
  draft: {
    clinicLocation: string;
    medicineSKU: string;
    batchNumber: string;
    quantity: string;
  },
  mode: 'in' | 'out'
) {
  const clinicLocation = normalizeClinicLocation(draft.clinicLocation);
  const medicineSKU = normalizeText(draft.medicineSKU);
  const batchNumber = normalizeText(draft.batchNumber);
  const quantity = Number(draft.quantity);

  if (!clinicLocation) return 'Select a clinic';
  if (!medicineSKU) return 'Select a medicine';
  if (!batchNumber) return 'Enter a batch number';
  if (!Number.isFinite(quantity) || quantity <= 0) return 'Enter a quantity greater than 0';
  if (mode === 'out' && batchNumber.length < 3) return 'Enter the existing batch number to dispense from';

  return null;
}
