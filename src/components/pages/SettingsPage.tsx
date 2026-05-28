import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import type { ClinicLocations, ClinicSettings, Doctors } from '@/entities';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useClinicLocation } from '@/hooks/use-clinic-location';
import {
  buildDefaultClinicSettings,
  DEFAULT_BACKUP_LOCATION,
  DEFAULT_CONSULTATION_FEE,
  DEFAULT_FOLLOW_UP_DAYS,
  DEFAULT_MEDICINE_FEE,
  resolveClinicSettings,
} from '@/lib/clinic-settings';

export default function SettingsPage() {
  const clinicLocation = useClinicLocation();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctors[]>([]);
  const [locations, setLocations] = useState<ClinicLocations[]>([]);
  const [settingsRecord, setSettingsRecord] = useState<ClinicSettings | null>(null);
  const [form, setForm] = useState({
    consultationFee: DEFAULT_CONSULTATION_FEE,
    medicineFee: DEFAULT_MEDICINE_FEE,
    defaultFollowUpDays: DEFAULT_FOLLOW_UP_DAYS,
    backupLocation: DEFAULT_BACKUP_LOCATION,
    billingNotes: '',
  });

  useEffect(() => {
    void loadPage();
  }, [clinicLocation]);

  const loadPage = async () => {
    try {
      const [settings, doctorsResult, locationsResult] = await Promise.all([
        BaseCrudService.getAllItems<ClinicSettings>('clinicsettings'),
        BaseCrudService.getAllItems<Doctors>('doctors'),
        BaseCrudService.getAllItems<ClinicLocations>('cliniclocations'),
      ]);

      const resolved = resolveClinicSettings(clinicLocation, settings);
      setSettingsRecord(settings.find((entry) => entry._id === resolved._id) || resolved);
      setForm({
        consultationFee: resolved.consultationFee ?? DEFAULT_CONSULTATION_FEE,
        medicineFee: resolved.medicineFee ?? DEFAULT_MEDICINE_FEE,
        defaultFollowUpDays: resolved.defaultFollowUpDays ?? DEFAULT_FOLLOW_UP_DAYS,
        backupLocation: resolved.backupLocation || DEFAULT_BACKUP_LOCATION,
        billingNotes: resolved.billingNotes || '',
      });
      setDoctors(doctorsResult.filter((doctor) => (doctor.clinicLocation || clinicLocation) === clinicLocation));
      setLocations(locationsResult);
    } catch (error) {
      toast({
        title: 'Settings Load Failed',
        description: error instanceof Error ? error.message : 'Unable to load clinic settings',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    try {
      const baseRecord = settingsRecord || buildDefaultClinicSettings(clinicLocation);
      const payload: ClinicSettings = {
        ...baseRecord,
        clinicLocation,
        consultationFee: Number(form.consultationFee),
        medicineFee: Number(form.medicineFee),
        defaultFollowUpDays: Number(form.defaultFollowUpDays),
        backupLocation: form.backupLocation.trim(),
        billingNotes: form.billingNotes.trim(),
      };

      const allSettings = await BaseCrudService.getAllItems<ClinicSettings>('clinicsettings');
      const existing = allSettings.find((entry) => (entry.clinicLocation || '').toLowerCase() === clinicLocation.toLowerCase());
      if (existing?._id) {
        await BaseCrudService.update<ClinicSettings>('clinicsettings', { ...payload, _id: existing._id });
      } else {
        await BaseCrudService.create<ClinicSettings>('clinicsettings', { ...payload, _id: payload._id || crypto.randomUUID() });
      }

      toast({
        title: 'Clinic Settings Saved',
        description: `Default charges and follow-up settings updated for ${clinicLocation}.`,
      });
      await loadPage();
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Unable to save clinic settings',
        variant: 'destructive',
      });
    }
  };

  const activeLocation = locations.find((location) => location.locationName === clinicLocation);

  return (
    <DashboardShell
      title="Clinic Settings"
      description={`Control clinic charges, default follow-up cadence, and desktop backup preferences for ${clinicLocation}.`}
      actions={(
        <Button
          onClick={handleSave}
          className="h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 px-6 text-base font-semibold text-white shadow-[0_18px_34px_rgba(72,187,120,0.24)] hover:from-emerald-600 hover:to-lime-500"
        >
          Save Settings
        </Button>
      )}
    >
      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[28px] border-emerald-100 shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Charges & Follow-Up</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="consultation-fee">Consultation Fee (Rs.)</Label>
                  <Input
                    id="consultation-fee"
                    type="number"
                    min="0"
                    value={form.consultationFee}
                    onChange={(event) => setForm((prev) => ({ ...prev, consultationFee: Number(event.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicine-fee">Medicine Fee (Rs.)</Label>
                  <Input
                    id="medicine-fee"
                    type="number"
                    min="0"
                    value={form.medicineFee}
                    onChange={(event) => setForm((prev) => ({ ...prev, medicineFee: Number(event.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="follow-up-days">Default Next Consultation Gap (days)</Label>
                  <Input
                    id="follow-up-days"
                    type="number"
                    min="1"
                    value={form.defaultFollowUpDays}
                    onChange={(event) => setForm((prev) => ({ ...prev, defaultFollowUpDays: Number(event.target.value) }))}
                  />
                  <p className="text-sm text-slate-500">Legacy workflow uses 28 days by default. Doctors can still choose months during each consultation.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-location">Desktop Backup Location</Label>
                  <Input
                    id="backup-location"
                    value={form.backupLocation}
                    onChange={(event) => setForm((prev) => ({ ...prev, backupLocation: event.target.value }))}
                  />
                  <p className="text-sm text-slate-500">Stored as an operational preference for the desktop rollout.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing-notes">Billing Notes</Label>
                <Textarea
                  id="billing-notes"
                  rows={4}
                  value={form.billingNotes}
                  onChange={(event) => setForm((prev) => ({ ...prev, billingNotes: event.target.value }))}
                  placeholder="Add clinic billing notes, receipt instructions, or operator reminders."
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="rounded-[28px] border-emerald-100 shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">Clinic Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-800">Location</p>
                  <p>{clinicLocation}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Address</p>
                  <p>{activeLocation?.address || 'Address not configured'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Contact</p>
                  <p>{activeLocation?.contactNumber || 'Contact not configured'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Operating Hours</p>
                  <p>{activeLocation?.operatingHours || 'Hours not configured'}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="rounded-[28px] border-emerald-100 shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">Doctors Assigned</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {doctors.length > 0 ? doctors.map((doctor) => (
                  <div key={doctor._id} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                    <p className="font-semibold text-slate-800">{doctor.doctorName}</p>
                    <p className="text-sm text-slate-600">{doctor.qualifications || doctor.specialization || 'Homeopathic consultant'}</p>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">No doctors assigned to this clinic yet.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardShell>
  );
}

