import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './functions/login';
import SuperadminDashboard from './component/Dashboard/superadminDash';
import AdminDashboard from './component/Dashboard/adminDash';
import ResidentDashboard from './component/Dashboard/residentDash';
import SecurityDashboard from './component/Dashboard/securityDash';
import Profile from './component/Profiles/profile';
import RouteGuard from './functions/routeguard';
import ForgotPassword from './functions/forgotpassword';
import AdminStripeSetup from './component/Payments/adminSetup';
import Infoblog from './component/InfoBlog/infoblog';
import BlogDetail from './component/InfoBlog/blogDetail';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Infoblog />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/admin-dashboard/stripe-setup" element={<AdminStripeSetup />} />

        {/* Guarded Routes */}
        <Route
          path="/superadmin-dashboard"
          element={
            <RouteGuard allowedRoles={['superadmin']}>
              <SuperadminDashboard />
            </RouteGuard>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <RouteGuard allowedRoles={['admin']}>
              <AdminDashboard />
            </RouteGuard>
          }
        />
        <Route
          path="/resident-dashboard"
          element={
            <RouteGuard allowedRoles={['resident']}>
              <ResidentDashboard />
            </RouteGuard>
          }
        />
        <Route
          path="/security-dashboard"
          element={
            <RouteGuard allowedRoles={['security']}>
              <SecurityDashboard />
            </RouteGuard>
          }
        />
        <Route
          path="/profile-section"
          element={
            <RouteGuard allowedRoles={null}>
              <Profile />
            </RouteGuard>
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;




