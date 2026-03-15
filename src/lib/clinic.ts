export const CLINIC_LOCATIONS = ['Noida', 'Delhi'] as const;
export type ClinicLocation = (typeof CLINIC_LOCATIONS)[number];

const STORAGE_KEY = 'homeo-hub:selected-clinic';
export const CLINIC_CHANGE_EVENT = 'homeo-hub:clinic-changed';

export function normalizeClinicLocation(value?: string | null): ClinicLocation {
  const normalized = (value ?? '').trim().toLowerCase();
  return normalized === 'delhi' ? 'Delhi' : 'Noida';
}

export function getStoredClinicLocation(): ClinicLocation {
  if (typeof window === 'undefined') return 'Noida';
  return normalizeClinicLocation(window.localStorage.getItem(STORAGE_KEY));
}

export function setStoredClinicLocation(value: string): ClinicLocation {
  const normalized = normalizeClinicLocation(value);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, normalized);
    window.dispatchEvent(new CustomEvent(CLINIC_CHANGE_EVENT, { detail: normalized }));
  }

  return normalized;
}
