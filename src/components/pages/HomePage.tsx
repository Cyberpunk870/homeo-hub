import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarClock,
  LayoutDashboard,
  MapPin,
  Package2,
  Pill,
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

const overviewCards = [
  {
    title: 'Medicine Inventory',
    description: 'Master database of medicines, potencies, forms, and supplier-ready stock visibility.',
    path: '/inventory',
    stat: '2,400+ records',
    icon: Pill,
    tint: 'from-emerald-500 to-lime-400',
    surface: 'from-emerald-50 to-lime-50',
  },
  {
    title: 'Stock Management',
    description: 'Track batches, stock-in activity, and dispensing movement across clinic shelves.',
    path: '/stock-management',
    stat: 'Live movement',
    icon: ShoppingBag,
    tint: 'from-sky-500 to-cyan-400',
    surface: 'from-sky-50 to-cyan-50',
  },
  {
    title: 'Stock Alerts',
    description: 'Watch low-stock items, expiry windows, and critical replenishment priorities.',
    path: '/alerts',
    stat: '3 critical flags',
    icon: Activity,
    tint: 'from-amber-500 to-orange-400',
    surface: 'from-amber-50 to-orange-50',
  },
  {
    title: 'Patients',
    description: 'Access patient records, contact history, and clinic-specific treatment details.',
    path: '/patients',
    stat: 'OPD registry',
    icon: Users,
    tint: 'from-violet-500 to-fuchsia-400',
    surface: 'from-violet-50 to-fuchsia-50',
  },
  {
    title: 'Prescriptions',
    description: 'Create digital prescriptions and maintain longitudinal treatment documentation.',
    path: '/prescriptions',
    stat: 'Treatment history',
    icon: Stethoscope,
    tint: 'from-rose-500 to-pink-400',
    surface: 'from-rose-50 to-pink-50',
  },
  {
    title: 'Reports',
    description: 'Review consumption trends, valuation summaries, and multi-clinic performance.',
    path: '/reports',
    stat: 'Monthly insights',
    icon: BarChart3,
    tint: 'from-slate-700 to-slate-500',
    surface: 'from-slate-50 to-slate-100',
  },
];

const clinicLocations = [
  {
    name: 'Clinic-1 (Noida)',
    address: '102, Jaipuria Plaza, Sec-26, Noida',
    phones: ['0120-4295211', '8010877211'],
  },
  {
    name: 'Clinic-2 (Delhi)',
    address: 'G-16, Vardhman Sun-Rise Plaza, Vasundhara Enclave, Delhi-96',
    phones: ['011-47520627', '9205664653'],
  },
];

export default function HomePage() {
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
                Unified dashboard for inventory, patients, and operations.
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
                  Dashboard connected to <span className="font-semibold text-slate-700">{clinicLocation}</span>
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
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-emerald-900 to-lime-700 p-8 text-white shadow-[0_24px_80px_rgba(84,140,98,0.24)]"
            >
              <div className="grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_360px] xl:items-end">
                <div>
                  <p className="font-paragraph text-sm uppercase tracking-[0.24em] text-emerald-100/90">
                    Clinic Ecosystem
                  </p>
                  <h1 className="mt-4 font-heading text-4xl sm:text-5xl xl:text-6xl">
                    Unified Homeopathy Operations
                  </h1>
                  <p className="mt-5 max-w-3xl font-paragraph text-base text-emerald-50/85 sm:text-lg">
                    Manage inventory, patients, prescriptions, and multi-clinic workflows from one green dashboard surface instead of the earlier brochure-style interface.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="rounded-[24px] bg-white/10 p-5 backdrop-blur">
                    <p className="font-paragraph text-xs uppercase tracking-[0.18em] text-emerald-100/90">
                      Medicines
                    </p>
                    <p className="mt-3 font-heading text-3xl">2,400+</p>
                  </div>
                  <div className="rounded-[24px] bg-white/10 p-5 backdrop-blur">
                    <p className="font-paragraph text-xs uppercase tracking-[0.18em] text-emerald-100/90">
                      Active Patients
                    </p>
                    <p className="mt-3 font-heading text-3xl">1,280</p>
                  </div>
                  <div className="rounded-[24px] bg-white/10 p-5 backdrop-blur">
                    <p className="font-paragraph text-xs uppercase tracking-[0.18em] text-emerald-100/90">
                      Today
                    </p>
                    <div className="mt-3 flex items-center gap-2 font-heading text-2xl">
                      <CalendarClock className="h-5 w-5" />
                      Ready
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            <section className="mb-8">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-heading text-3xl text-slate-800">Core Modules</h2>
                  <p className="mt-2 font-paragraph text-slate-500">
                    Direct entry points for the daily clinic workflow.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {overviewCards.map((card, index) => {
                  const Icon = card.icon;

                  return (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={card.path}
                        className="group block h-full rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(126,156,130,0.14)]"
                      >
                        <div className={`mb-5 inline-flex rounded-2xl bg-gradient-to-br ${card.surface} p-4 ring-1 ring-emerald-100`}>
                          <div className={`rounded-xl bg-gradient-to-r ${card.tint} p-3 text-white shadow-lg`}>
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                        <h3 className="font-heading text-2xl text-slate-800">{card.title}</h3>
                        <p className="mt-3 font-paragraph leading-7 text-slate-500">
                          {card.description}
                        </p>
                        <div className="mt-8 flex items-center justify-between border-t border-emerald-50 pt-5">
                          <span className="font-paragraph text-sm font-semibold text-emerald-700">
                            {card.stat}
                          </span>
                          <span className="flex items-center gap-2 font-paragraph text-sm font-semibold text-slate-700 transition-transform group-hover:translate-x-1">
                            Open
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
              <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
                <h2 className="font-heading text-3xl text-slate-800">Specialized Treatment Areas</h2>
                <p className="mt-2 font-paragraph text-slate-500">
                  Key categories handled by the clinic across both operating locations.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    'Migraine',
                    'Respiratory Diseases',
                    'Bone & Joint Disorders',
                    'Gynecological Concerns',
                    'Skin & Cosmetic Care',
                    "Children's Health",
                    'Thyroid Support',
                    'Digestive Disorders',
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl bg-gradient-to-r from-emerald-50 to-lime-50 px-4 py-4 font-paragraph text-sm font-medium text-slate-700 ring-1 ring-emerald-100"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/60 p-6 shadow-sm">
                <h2 className="font-heading text-3xl text-slate-800">Clinic Locations</h2>
                <div className="mt-6 space-y-4">
                  {clinicLocations.map((clinic) => (
                    <div key={clinic.name} className="rounded-2xl bg-white/80 p-5 ring-1 ring-emerald-100">
                      <h3 className="font-heading text-xl text-slate-800">{clinic.name}</h3>
                      <p className="mt-2 font-paragraph text-sm leading-6 text-slate-500">
                        {clinic.address}
                      </p>
                      <div className="mt-4 space-y-1">
                        {clinic.phones.map((phone) => (
                          <p key={phone} className="font-paragraph text-sm font-semibold text-emerald-700">
                            {phone}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
