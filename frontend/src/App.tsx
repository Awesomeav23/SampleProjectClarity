import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './lib/auth';
import AppShell from './layouts/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SOWList from './pages/sows/SOWList';
import SOWWizard from './pages/sows/SOWWizard';
import SOWApprovals from './pages/sows/SOWApprovals';
import CapacityDashboard from './pages/capacity/CapacityDashboard';
import AssignmentList from './pages/assignments/AssignmentList';
import AssignmentForm from './pages/assignments/AssignmentForm';
import BurntReportDashboard from './pages/burntReports/BurntReportDashboard';
import ChangeOrderList from './pages/changeOrders/ChangeOrderList';
import ChangeOrderForm from './pages/changeOrders/ChangeOrderForm';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/sows" element={<SOWList />} />
        <Route path="/sows/new" element={<SOWWizard />} />
        <Route path="/sows/approvals" element={<SOWApprovals />} />
        <Route path="/capacity" element={<CapacityDashboard />} />
        <Route path="/assignments" element={<AssignmentList />} />
        <Route path="/assignments/new" element={<AssignmentForm />} />
        <Route path="/burnt-reports" element={<BurntReportDashboard />} />
        <Route path="/change-orders" element={<ChangeOrderList />} />
        <Route path="/change-orders/new" element={<ChangeOrderForm />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
