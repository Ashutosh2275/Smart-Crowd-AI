import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CrowdProvider } from './context/CrowdContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/Toast';
import { MaintenanceMode } from './components/MaintenanceMode';
import appConfig from './config/appConfig';

// ── Code-split routes ────────────────────────────────────────────────────────
const Dashboard  = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Admin      = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const Navigation = lazy(() => import('./pages/Navigation').then(m => ({ default: m.Navigation })));
const AdminLogin = lazy(() => import('./pages/AdminLogin').then(m => ({ default: m.AdminLogin })));
const Welcome    = lazy(() => import('./pages/Welcome').then(m => ({ default: m.Welcome })));

// ── Shared Suspense spinner ───────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
          style={{ animation: 'spin 1.2s linear infinite' }}
        />
      </div>
    </div>
  );
}

function App() {
  if (appConfig.maintenance.enabled) {
    return (
      <ToastProvider>
        <MaintenanceMode />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      {/* Top-level boundary catches fatal errors in Providers themselves */}
      <ErrorBoundary context="Application Bootstrap">
        <AuthProvider>
          <CrowdProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>

                {/* Public Landing Page */}
                <Route path="/" element={<Welcome />} />

                {/* Login — own boundary so a login crash doesn't block the whole app */}
                <Route
                  path="/login"
                  element={
                    <ErrorBoundary context="Login Page">
                      <AdminLogin />
                    </ErrorBoundary>
                  }
                />

                {/* Main Layout shell (Wrapped routes) */}
                <Route
                  element={
                    <ErrorBoundary context="App Shell">
                      <Layout />
                    </ErrorBoundary>
                  }
                >
                  <Route
                    path="/dashboard"
                    element={
                      <ErrorBoundary context="Dashboard">
                        <Dashboard />
                      </ErrorBoundary>
                    }
                  />

                  <Route
                    path="/navigation"
                    element={
                      <ErrorBoundary context="Navigation & Routing">
                        <Navigation />
                      </ErrorBoundary>
                    }
                  />

                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary context="Admin Panel">
                          <Admin />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>

                </Routes>
              </Suspense>
            </BrowserRouter>
          </CrowdProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ToastProvider>
  );
}

export default App;
