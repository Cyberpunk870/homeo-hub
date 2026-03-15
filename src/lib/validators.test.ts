import { describe, expect, it } from 'vitest';
import { validatePatientDraft, validatePrescriptionDraft, validateStockDraft } from '@/lib/validators';

describe('validators', () => {
  it('rejects duplicate patient phone number within the same clinic', () => {
    const result = validatePatientDraft(
      {
        patientName: 'Rohan Mehta',
        phoneNumber: '9810012345',
        clinicLocation: 'Noida',
      },
      [
        {
          _id: 'pat-1',
          patientName: 'Existing',
          phoneNumber: '9810012345',
          clinicLocation: 'Noida',
        },
      ]
    );

    expect(result).toBe('A patient with this phone number already exists in this clinic');
  });

  it('rejects duplicate prescription ids', () => {
    const result = validatePrescriptionDraft(
      {
        prescriptionId: 'RX001',
        patientName: 'Rohan Mehta',
        doctorName: 'Dr. R.C. Upadhyaya',
        prescriptionDate: '2026-03-14',
        medicinesAndDosages: 'Arnica 30C',
        clinicLocation: 'Noida',
      },
      [{ _id: 'rx-1', prescriptionId: 'RX001' }]
    );

    expect(result).toBe('Use a unique prescription ID');
  });

  it('rejects invalid stock quantities', () => {
    expect(
      validateStockDraft(
        {
          clinicLocation: 'Delhi',
          medicineSKU: 'Belladonna',
          batchNumber: 'B-1',
          quantity: '0',
        },
        'in'
      )
    ).toBe('Enter a quantity greater than 0');
  });
});
