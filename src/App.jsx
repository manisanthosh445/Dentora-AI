import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetails from './pages/PatientDetails';
import Appointments from './pages/Appointments';
import AIReceptionist from './pages/AIReceptionist';
import QueueManagement from './pages/QueueManagement';
import AIConsultation from './pages/AIConsultation';
import Treatments from './pages/Treatments';
import Prescriptions from './pages/Prescriptions';
import Billing from './pages/Billing';
import Notifications from './pages/Notifications';
import ClinicAnalytics from './pages/ClinicAnalytics';
import XRayAI from './pages/XRayAI';
import AdminSettings from './pages/AdminSettings';

// Protected Route Gateway Wrapper
function ProtectedRouteGateway() {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

// Role Authorization Wrapper for Specific Links
function RoleGuard({ allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Redirect unauthorized users to root dashboard
  }
  return <Outlet />;
}

// Simple logout component
function Logout() {
  const { logout } = useAuth();
  React.useEffect(() => {
    logout();
    localStorage.removeItem('chaitanya_dental_api_key');
  }, [logout]);
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />

          {/* Protected Routes Block */}
          <Route element={<ProtectedRouteGateway />}>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="patients" element={<Patients />} />
              <Route path="patients/:id" element={<PatientDetails />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="queue" element={<QueueManagement />} />
              
              {/* Doctor / Chief Access Gates */}
              <Route element={<RoleGuard allowedRoles={['Chief Doctor', 'Doctor']} />}>
                <Route path="treatments" element={<Treatments />} />
                <Route path="prescriptions" element={<Prescriptions />} />
                <Route path="consultation" element={<AIConsultation />} />
                <Route path="xray-ai" element={<XRayAI />} />
                <Route path="analytics" element={<ClinicAnalytics />} />
              </Route>

              {/* Receptionist / Chief Access Gates */}
              <Route element={<RoleGuard allowedRoles={['Chief Doctor', 'Receptionist']} />}>
                <Route path="billing" element={<Billing />} />
              </Route>

              {/* Chief Doctor Exclusive Gates */}
              <Route element={<RoleGuard allowedRoles={['Chief Doctor']} />}>
                <Route path="receptionist" element={<AIReceptionist />} />
                <Route path="admin-settings" element={<AdminSettings />} />
              </Route>

              <Route path="notifications" element={<Notifications />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
