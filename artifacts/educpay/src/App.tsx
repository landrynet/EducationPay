import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import MarketingPage from '@/components/marketing/MarketingPage';
import {
  AcademicConfigurationPage,
  DirectorDashboardPage,
  EstablishmentOverviewPage,
  SettingsPage,
  SuperAdminDashboardPage,
  SuperAdminPlatformPage,
  SuperAdminSettingsPage,
  TutorsPage,
} from '@/pages/app-page';
import {
  AuthForgotPasswordPage,
  AuthLoginPage,
  AuthRegisterPage,
  AuthResetPasswordPage,
  AuthActivationPage,
} from '@/pages/auth-pages';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
  Redirect,
} from 'wouter';
import ProtectedRoute from '@/lib/ProtectedRoute';
import { AuthProvider } from '@/lib/useAuth';
import { setAuthTokenProvider } from '@workspace/api-client-react';
import { supabase } from '@/lib/supabase';
import { RegisterEstablishmentPage, RegistrationStatusPage, RegistrationSubmittedPage } from '@/pages/registration-pages';
import { EstablishmentApplicationsPage } from '@/pages/establishment-applications-page';

setAuthTokenProvider(async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
});

const queryClient = new QueryClient();

function Home() {
  return <MarketingPage />;
}

const ESTABLISHMENT_ROLES = ['DIRECTOR', 'ESTABLISHMENT_ADMIN', 'ACCOUNTANT', 'TUTOR'];

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        {/* Public Marketing & Auth Routes */}
        <Route path="/" component={Home} />
        <Route path="/auth/login" component={AuthLoginPage} />
        <Route path="/auth/register" component={AuthRegisterPage} />
        <Route path="/auth/forgot-password" component={AuthForgotPasswordPage} />
        <Route path="/auth/reset-password" component={AuthResetPasswordPage} />
        <Route path="/register-establishment" component={RegisterEstablishmentPage} />
        <Route path="/registration-submitted" component={RegistrationSubmittedPage} />
        <Route path="/registration-status" component={RegistrationStatusPage} />
        <Route path="/auth/activate" component={AuthActivationPage} />

        {/* Super Admin Platform Space (/super-admin/*) */}
        <Route
          path="/super-admin"
          component={() => (
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminDashboardPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/super-admin/establishments"
          component={() => (
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <EstablishmentApplicationsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/super-admin/platform"
          component={() => (
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminPlatformPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/super-admin/settings"
          component={() => (
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminSettingsPage />
            </ProtectedRoute>
          )}
        />

        {/* Establishment Business Space (/app/*) */}
        <Route
          path="/app"
          component={() => (
            <ProtectedRoute allowedRoles={ESTABLISHMENT_ROLES}>
              <DirectorDashboardPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/app/establishment"
          component={() => (
            <ProtectedRoute allowedRoles={ESTABLISHMENT_ROLES}>
              <EstablishmentOverviewPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/app/school-years"
          component={() => (
            <ProtectedRoute allowedRoles={['DIRECTOR', 'ESTABLISHMENT_ADMIN']}>
              <AcademicConfigurationPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/app/team"
          component={() => (
            <ProtectedRoute allowedRoles={['DIRECTOR', 'ESTABLISHMENT_ADMIN']}>
              <TutorsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/app/settings"
          component={() => (
            <ProtectedRoute allowedRoles={['DIRECTOR', 'ESTABLISHMENT_ADMIN']}>
              <SettingsPage />
            </ProtectedRoute>
          )}
        />

        {/* Legacy redirect for old bookmark */}
        <Route path="/app/establishments">
          {() => <Redirect to="/super-admin/establishments" />}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
            <Toaster />
          </WouterRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
