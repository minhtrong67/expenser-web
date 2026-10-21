import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import SplashScreen from './components/ui/SplashScreen';

// Every page is its own chunk, fetched only when visited. The signed-in shell
// (Firestore data layer + app chrome) is one lazy module too, so the login
// screen never downloads the database SDK, charts or export libraries.
const ProtectedShell = lazy(() => import('./routes/ProtectedShell'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TransactionsPage = lazy(() => import('./pages/Transactions'));
const CategoriesPage = lazy(() => import('./pages/Categories'));
const WalletsPage = lazy(() => import('./pages/Wallets'));
const StatisticsPage = lazy(() => import('./pages/Statistics'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Toast styling: inverted surface, following the active theme.
function ThemedToaster() {
  const { colors, isDark } = useSettings();
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: {
          background: colors.inverseSurface,
          color: colors.inverseOnSurface,
          borderRadius: '10px',
          fontSize: '14px',
          boxShadow: '0 8px 24px -6px rgba(0,0,0,.28)',
        },
        success: { iconTheme: { primary: isDark ? '#008236' : '#00c950', secondary: colors.inverseSurface } },
        error: { iconTheme: { primary: isDark ? '#e7000b' : '#ff6467', secondary: colors.inverseSurface } },
      }}
    />
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <ThemedToaster />
          {/* Same splash as index.html + the auth gate: one continuous loading screen */}
          <Suspense fallback={<SplashScreen />}>
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <ProtectedShell />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="wallets" element={<WalletsPage />} />
                <Route path="statistics" element={<StatisticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                {/* Old routes kept as redirects so bookmarks / PWA shortcuts still work */}
                <Route path="calendar" element={<Navigate to="/transactions" replace />} />
                <Route path="budget" element={<Navigate to="/" replace />} />
                <Route path="recurring" element={<Navigate to="/" replace />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}
