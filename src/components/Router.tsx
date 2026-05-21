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
import AboutPage from '@/components/pages/AboutPage';

// Layout component that includes ScrollToTop
function Layout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
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
        path: "reports",
        element: <ReportsPage />,
        routeMetadata: {
          pageIdentifier: 'reports',
        },
      },
      {
        path: "about",
        element: <AboutPage />,
        routeMetadata: {
          pageIdentifier: 'about',
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
