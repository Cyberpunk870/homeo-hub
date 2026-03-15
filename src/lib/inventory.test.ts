import { describe, expect, it } from 'vitest';
import { buildCsv, getLowStockSuggestions, getUsageTrends } from '@/lib/inventory';

describe('inventory helpers', () => {
  it('builds reorder suggestions from recent stock usage', () => {
    const suggestions = getLowStockSuggestions(
      [
        {
          _id: 'med-1',
          medicineName: 'Arnica Montana',
          reorderLevel: 20,
          isActive: true,
        },
      ],
      [
        {
          _id: 'batch-1',
          clinicLocation: 'Noida',
          medicineSKU: 'Arnica Montana',
          batchNumber: 'ARN-01',
          quantityAvailable: 5,
        },
      ],
      [
        {
          _id: 'tx-1',
          clinicLocation: 'Noida',
          medicineSku: 'Arnica Montana',
          transactionType: 'Stock Out',
          quantityChange: -18,
          transactionDateTime: new Date().toISOString(),
        },
      ],
      'Noida'
    );

    expect(suggestions[0]?.medicineName).toBe('Arnica Montana');
    expect(suggestions[0]?.recommendedOrderQuantity).toBeGreaterThan(0);
  });

  it('aggregates usage trends by month', () => {
    const now = new Date();
    const trends = getUsageTrends(
      [
        {
          _id: 'tx-1',
          clinicLocation: 'Delhi',
          medicineSku: 'Belladonna',
          transactionType: 'Stock Out',
          quantityChange: -3,
          transactionDateTime: now.toISOString(),
        },
      ],
      'Delhi',
      1
    );

    expect(trends).toHaveLength(1);
    expect(trends[0]?.quantityUsed).toBe(3);
  });

  it('creates csv output with headers', () => {
    const csv = buildCsv([
      { clinic: 'Noida', medicine: 'Arnica Montana', totalStock: 12 },
      { clinic: 'Delhi', medicine: 'Belladonna', totalStock: 8 },
    ]);

    expect(csv.split('\n')[0]).toBe('clinic,medicine,totalStock');
    expect(csv).toContain('Arnica Montana');
  });
});
