const DAY_MS = 1000 * 60 * 60 * 24;

export type FollowUpUnit = 'days' | 'months';

export type ConsultationLineItem = {
  medicineName: string;
  dosageManagement: string;
};

export function toIsoDateInput(value?: string | Date | null) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export function addDaysToDate(baseDate: string, days: number) {
  const timestamp = new Date(baseDate).getTime();
  return toIsoDateInput(new Date(timestamp + days * DAY_MS));
}

export function addMonthsToDate(baseDate: string, months: number) {
  const next = new Date(baseDate);
  next.setMonth(next.getMonth() + months);
  return toIsoDateInput(next);
}

export function calculateNextConsultationDate(
  consultationDate: string,
  intervalValue: number,
  intervalUnit: FollowUpUnit
) {
  if (!consultationDate) return '';
  if (intervalUnit === 'months') {
    return addMonthsToDate(consultationDate, intervalValue);
  }
  return addDaysToDate(consultationDate, intervalValue);
}

export function calculateTotalAmount(consultationCharge: number, medicineCharge: number) {
  return Number((consultationCharge + medicineCharge).toFixed(2));
}

export function calculateBalanceAmount(totalAmount: number, amountPaidCash: number, amountPaidOnline: number) {
  return Number(Math.max(totalAmount - amountPaidCash - amountPaidOnline, 0).toFixed(2));
}

export function derivePaymentStatus(balanceAmount: number, totalAmount: number) {
  if (totalAmount <= 0) return 'Pending';
  if (balanceAmount <= 0) return 'Paid';
  if (balanceAmount >= totalAmount) return 'Unpaid';
  return 'Partial';
}

export function serializeMedicineLineItems(items: ConsultationLineItem[]) {
  return JSON.stringify(
    items
      .map((item) => ({
        medicineName: item.medicineName.trim(),
        dosageManagement: item.dosageManagement.trim(),
      }))
      .filter((item) => item.medicineName || item.dosageManagement)
  );
}

export function parseMedicineLineItems(serialized?: string | null, fallback?: string | null): ConsultationLineItem[] {
  if (serialized) {
    try {
      const parsed = JSON.parse(serialized) as ConsultationLineItem[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fall through to fallback
    }
  }

  if (fallback?.trim()) {
    return fallback
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [medicineName, dosageManagement = ''] = line.split(' - ');
        return {
          medicineName: medicineName || '',
          dosageManagement,
        };
      });
  }

  return [];
}

export function flattenMedicineLineItems(items: ConsultationLineItem[]) {
  return items
    .filter((item) => item.medicineName.trim() || item.dosageManagement.trim())
    .map((item) => `${item.medicineName.trim()}${item.dosageManagement.trim() ? ` - ${item.dosageManagement.trim()}` : ''}`)
    .join('\n');
}

export function generateReceiptNumber(clinicLocation: string) {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14);
  return `RCT-${clinicLocation.slice(0, 3).toUpperCase()}-${stamp}`;
}

export function generatePatientIdentifier(clinicLocation: string) {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 12);
  return `PT${clinicLocation.slice(0, 3).toUpperCase()}${stamp}`;
}

export function generateCertificateNumber(clinicLocation: string) {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 12);
  return `MC-${clinicLocation.slice(0, 3).toUpperCase()}-${stamp}`;
}
