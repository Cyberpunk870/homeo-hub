import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  LayoutDashboard,
  MapPin,
  Package2,
  Settings,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useMember } from '@/integrations';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useClinicLocation } from '@/hooks/use-clinic-location';

const navigationItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Consultations', path: '/prescriptions', icon: Stethoscope },
  { label: 'Conditions', path: '/alerts', icon: Activity },
  { label: 'Inventory', path: '/inventory', icon: Package2 },
  { label: 'Patients', path: '/patients', icon: Users },
  { label: 'Orders', path: '/stock-management', icon: ShoppingBag },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Settings', path: '/about', icon: Settings },
];

type DashboardShellProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function DashboardShell({
  title,
  description,
  actions,
  children,
}: DashboardShellProps) {
  const location = useLocation();
  const clinicLocation = useClinicLocation();
  const { member } = useMember();

  const displayName = member?.displayName || 'Clinic Admin';
  const displayInitials = displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(134,239,172,0.24),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(125,211,252,0.18),_transparent_20%),linear-gradient(180deg,_#f9fdf8_0%,_#eef7f0_100%)] text-slate-700">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 p-4 sm:p-6 lg:flex-row">
        <aside className="w-full overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_18px_60px_rgba(111,145,114,0.12)] backdrop-blur lg:sticky lg:top-6 lg:min-h-[calc(100vh-3rem)] lg:w-[260px] lg:flex-shrink-0">
          <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-lime-50 to-white px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 text-white shadow-lg shadow-emerald-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-heading text-2xl text-emerald-700">HomeoHub</p>
                <p className="font-paragraph text-sm text-slate-500">Clinic workspace</p>
              </div>
            </div>
          </div>

          <nav className="grid gap-2 p-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-lime-400 text-white shadow-[0_14px_24px_rgba(72,187,120,0.24)]'
                      : 'text-slate-600 hover:bg-emerald-50/70'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span className="font-paragraph text-sm font-medium">{item.label}</span>
                  </span>
                  {item.label === 'Conditions' ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      6
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="hidden px-4 pb-4 lg:block">
            <div className="rounded-[24px] bg-gradient-to-br from-slate-900 via-emerald-900 to-lime-700 p-5 text-white shadow-xl">
              <p className="font-paragraph text-xs uppercase tracking-[0.22em] text-emerald-100/90">
                Active Clinic
              </p>
              <p className="mt-3 font-heading text-2xl">{clinicLocation}</p>
              <p className="mt-2 font-paragraph text-sm text-emerald-50/85">
                Unified dashboard for inventory, patients, and clinic operations.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 rounded-[32px] border border-white/70 bg-white/78 shadow-[0_20px_70px_rgba(126,156,130,0.12)] backdrop-blur">
          <div className="border-b border-emerald-100/80 bg-gradient-to-r from-white via-emerald-50/70 to-white px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="font-paragraph">
                  Working in <span className="font-semibold text-slate-700">{clinicLocation}</span>
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2 shadow-sm">
                <Avatar className="h-11 w-11 rounded-2xl bg-gradient-to-br from-sky-100 to-emerald-100 text-emerald-700">
                  <AvatarFallback className="rounded-2xl bg-transparent font-heading text-sm font-semibold text-emerald-700">
                    {displayInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-paragraph text-sm font-semibold text-slate-700">
                    {displayName}
                  </p>
                  <p className="font-paragraph text-xs text-slate-500">Homeopathy dashboard</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h1 className="font-heading text-4xl text-slate-800 sm:text-5xl">{title}</h1>
                <p className="mt-3 max-w-3xl font-paragraph text-base text-slate-500 sm:text-lg">
                  {description}
                </p>
              </div>
              {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
