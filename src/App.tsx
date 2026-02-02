import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PartnerAuthProvider, usePartnerAuth } from './context/PartnerAuthContext';
import { ThemeProvider } from '@/components/theme-provider';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Lazy load Partner pages
const PartnerLogin = lazy(() => import('./pages/partner/PartnerLogin'));
const PartnerDashboard = lazy(() => import('./pages/partner/PartnerDashboard'));

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Admin route protection
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/" /> : <>{children}</>;
}

// Partner route protection
function PartnerPrivateRoute({ children }: { children: React.ReactNode }) {
  const { partnerUser, loading } = usePartnerAuth();
  if (loading) return <LoadingScreen />;
  return partnerUser ? <>{children}</> : <Navigate to="/partner/login" />;
}

function PartnerPublicRoute({ children }: { children: React.ReactNode }) {
  const { partnerUser, loading } = usePartnerAuth();
  if (loading) return <LoadingScreen />;
  return partnerUser ? <Navigate to="/partner" /> : <>{children}</>;
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="tx-pay-ui-theme">
      <AuthProvider>
        <PartnerAuthProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Admin Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />

                {/* Partner Routes */}
                <Route
                  path="/partner/login"
                  element={
                    <PartnerPublicRoute>
                      <PartnerLogin />
                    </PartnerPublicRoute>
                  }
                />
                <Route
                  path="/partner"
                  element={
                    <PartnerPrivateRoute>
                      <PartnerDashboard />
                    </PartnerPrivateRoute>
                  }
                />
                <Route
                  path="/partner/*"
                  element={
                    <PartnerPrivateRoute>
                      <PartnerDashboard />
                    </PartnerPrivateRoute>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </PartnerAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
