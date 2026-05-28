import type { ClinicSettings } from '@/entities';

export const DEFAULT_CONSULTATION_FEE = 1400;
export const DEFAULT_MEDICINE_FEE = 400;
export const DEFAULT_FOLLOW_UP_DAYS = 28;
export const DEFAULT_BACKUP_LOCATION = 'E:\\HCMS Backup_RC';

export function buildDefaultClinicSettings(clinicLocation: string): ClinicSettings {
  return {
    _id: `settings-${clinicLocation.toLowerCase()}`,
    clinicLocation,
    consultationFee: DEFAULT_CONSULTATION_FEE,
    medicineFee: DEFAULT_MEDICINE_FEE,
    defaultFollowUpDays: DEFAULT_FOLLOW_UP_DAYS,
    backupLocation: DEFAULT_BACKUP_LOCATION,
    billingNotes: 'Default clinic charges and follow-up settings.',
  };
}

export function resolveClinicSettings(
  clinicLocation: string,
  settings: ClinicSettings[] | undefined
): ClinicSettings {
  return (
    settings?.find((entry) => (entry.clinicLocation || '').toLowerCase() === clinicLocation.toLowerCase()) ||
    buildDefaultClinicSettings(clinicLocation)
  );
}

