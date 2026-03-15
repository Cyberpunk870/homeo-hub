import { beforeEach, describe, expect, it } from 'vitest';
import { BaseCrudService } from '@/integrations/cms/service';

describe('BaseCrudService local mode', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('creates and retrieves patient records', async () => {
    const created = await BaseCrudService.create('patients', {
      _id: 'patient-test',
      patientName: 'Test Patient',
      phoneNumber: '9999999999',
      clinicLocation: 'Noida',
    });

    const patient = await BaseCrudService.getById('patients', created._id);

    expect(patient).toMatchObject({
      _id: 'patient-test',
      patientName: 'Test Patient',
      clinicLocation: 'Noida',
    });
  });

  it('updates inventory batch quantities safely', async () => {
    const created = await BaseCrudService.create('inventorybatches', {
      _id: 'batch-test',
      clinicLocation: 'Delhi',
      medicineSKU: 'Belladonna',
      batchNumber: 'BEL-001',
      quantityAvailable: 10,
    });

    const updated = await BaseCrudService.update<Record<string, unknown> & { _id: string; quantityAvailable?: number; _updatedDate?: string }>('inventorybatches', {
      _id: created._id,
      quantityAvailable: 15,
    });

    expect(updated.quantityAvailable).toBe(15);
    expect(updated._updatedDate).toBeTruthy();
  });
});
