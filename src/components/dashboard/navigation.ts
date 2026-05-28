import {
  Activity,
  Archive,
  BarChart3,
  FileBadge2,
  FileStack,
  LayoutDashboard,
  Package2,
  ReceiptText,
  Settings,
  Stethoscope,
  Users,
} from 'lucide-react';

export const dashboardNavigationItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Consultations', path: '/prescriptions', icon: Stethoscope },
  { label: 'Reconciliation', path: '/reconciliation', icon: ReceiptText },
  { label: 'Alerts', path: '/alerts', icon: Activity },
  { label: 'Inventory', path: '/inventory', icon: Package2 },
  { label: 'Patients', path: '/patients', icon: Users },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Notes', path: '/notes', icon: FileStack },
  { label: 'Certificates', path: '/certificates', icon: FileBadge2 },
  { label: 'Archival', path: '/archival', icon: Archive },
  { label: 'Settings', path: '/settings', icon: Settings },
] as const;
