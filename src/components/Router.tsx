import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import HomePage from '@/components/pages/HomePage';
import InventoryPage from '@/components/pages/InventoryPage';
import StockManagementPage from '@/components/pages/StockManagementPage';
import AlertsPage from '@/components/pages/AlertsPage';
import PrescriptionsPage from '@/components/pages/PrescriptionsPage';
import PatientsPage from '@/components/pages/PatientsPage';
import ReportsPage from '@/components/pages/ReportsPage';
import SettingsPage from '@/components/pages/SettingsPage';
import ReconciliationPage from '@/components/pages/ReconciliationPage';
import NotesPage from '@/components/pages/NotesPage';
import MedicalCertificatesPage from '@/components/pages/MedicalCertificatesPage';
import ArchivalPage from '@/components/pages/ArchivalPage';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';

// Layout component that includes ScrollToTop
function Layout() {
  return (
    <>
      <ScrollToTop />
      <MemberProtectedRoute
        signInTitle="HomeoHub Desktop Sign In"
        messageToSignIn="Enter the clinic username and password to open the application workspace."
      >
        <Outlet />
      </MemberProtectedRoute>
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
        routeMetadata: {
          pageIdentifier: 'home',
        },
      },
      {
        path: "inventory",
        element: <InventoryPage />,
        routeMetadata: {
          pageIdentifier: 'inventory',
        },
      },
      {
        path: "stock-management",
        element: <StockManagementPage />,
        routeMetadata: {
          pageIdentifier: 'stock-management',
        },
      },
      {
        path: "alerts",
        element: <AlertsPage />,
        routeMetadata: {
          pageIdentifier: 'alerts',
        },
      },
      {
        path: "patients",
        element: <PatientsPage />,
        routeMetadata: {
          pageIdentifier: 'patients',
        },
      },
      {
        path: "prescriptions",
        element: <PrescriptionsPage />,
        routeMetadata: {
          pageIdentifier: 'prescriptions',
        },
      },
      {
        path: "reconciliation",
        element: <ReconciliationPage />,
        routeMetadata: {
          pageIdentifier: 'reconciliation',
        },
      },
      {
        path: "reports",
        element: <ReportsPage />,
        routeMetadata: {
          pageIdentifier: 'reports',
        },
      },
      {
        path: "notes",
        element: <NotesPage />,
        routeMetadata: {
          pageIdentifier: 'notes',
        },
      },
      {
        path: "certificates",
        element: <MedicalCertificatesPage />,
        routeMetadata: {
          pageIdentifier: 'certificates',
        },
      },
      {
        path: "archival",
        element: <ArchivalPage />,
        routeMetadata: {
          pageIdentifier: 'archival',
        },
      },
      {
        path: "about",
        element: <Navigate to="/settings" replace />,
        routeMetadata: {
          pageIdentifier: 'about',
        },
      },
      {
        path: "settings",
        element: <SettingsPage />,
        routeMetadata: {
          pageIdentifier: 'settings',
        },
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
], {
  basename: import.meta.env.BASE_NAME,
});

export default function AppRouter() {
  return (
    <MemberProvider>
      <RouterProvider router={router} />
    </MemberProvider>
  );
}
