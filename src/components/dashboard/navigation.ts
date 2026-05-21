import {
  Activity,
  BarChart3,
  LayoutDashboard,
  Package2,
  Settings,
  Stethoscope,
  Users,
} from 'lucide-react';

export const dashboardNavigationItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Consultations', path: '/prescriptions', icon: Stethoscope },
  { label: 'Alerts', path: '/alerts', icon: Activity },
  { label: 'Inventory', path: '/inventory', icon: Package2 },
  { label: 'Patients', path: '/patients', icon: Users },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Settings', path: '/about', icon: Settings },
] as const;
