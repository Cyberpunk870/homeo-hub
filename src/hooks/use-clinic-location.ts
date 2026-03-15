import { useEffect, useState } from 'react';
import { CLINIC_CHANGE_EVENT, getStoredClinicLocation, type ClinicLocation } from '@/lib/clinic';

export function useClinicLocation() {
  const [clinicLocation, setClinicLocation] = useState<ClinicLocation>('Noida');

  useEffect(() => {
    setClinicLocation(getStoredClinicLocation());

    const onChange = () => setClinicLocation(getStoredClinicLocation());
    window.addEventListener(CLINIC_CHANGE_EVENT, onChange as EventListener);
    window.addEventListener('storage', onChange);

    return () => {
      window.removeEventListener(CLINIC_CHANGE_EVENT, onChange as EventListener);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return clinicLocation;
}
