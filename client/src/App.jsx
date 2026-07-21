import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import ClientPortal from './pages/ClientPortal';
import Loader from './components/shared/Loader';

/**
 * ProtectedRoute — redirects to /login if the user is not authenticated.
 * While the initial token validation is in-flight, shows a full-page loader.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, token, refreshUser } = useAuth();
  const [checking, setChecking] = useState(!!token); // Only check if a token exists

  useEffect(() => {
    if (!token) return;
    // Re-validate the stored token against /api/auth/me on every full page load
    refreshUser().finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  if (checking) return <Loader fullPage />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

/**
 * PublicOnlyRoute — redirects authenticated users away from /login
 */
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

/**
 * AppRoutes — all application routes
 */
const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route
      path="/login"
      element={
        <PublicOnlyRoute>
          <Login />
        </PublicOnlyRoute>
      }
    />

    {/* Public — client portal (no JWT, token-authenticated) */}
    <Route path="/portal/:token" element={<ClientPortal />} />

    {/* Protected — freelancer */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/projects/:id"
      element={
        <ProtectedRoute>
          <ProjectDetail />
        </ProtectedRoute>
      }
    />

    {/* Default redirects */}
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

/**
 * App — wraps the entire app in AuthProvider + BrowserRouter
 */
const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
