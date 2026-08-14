import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import MarketingPage from '@/components/marketing/MarketingPage';
import {
  AcademicConfigurationPage,
  DashboardPage,
  DirectorDashboardPage,
  EstablishmentOverviewPage,
  PlaceholderPage,
  SettingsPage,
  TutorsPage,
} from '@/pages/app-page';
import {
  AuthFirstLoginPage,
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
} from 'wouter';
import ProtectedRoute from '@/lib/ProtectedRoute';
import { AuthProvider, useAuth } from '@/lib/useAuth';
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

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/auth/login" component={AuthLoginPage} />
        <Route path="/auth/register" component={AuthRegisterPage} />
        <Route path="/auth/forgot-password" component={AuthForgotPasswordPage} />
        <Route path="/auth/reset-password" component={AuthResetPasswordPage} />
        <Route path="/auth/first-login" component={AuthFirstLoginPage} />
        <Route path="/register-establishment" component={RegisterEstablishmentPage} />
        <Route path="/registration-submitted" component={RegistrationSubmittedPage} />
        <Route path="/registration-status" component={RegistrationStatusPage} />
        <Route path="/auth/activate" component={AuthActivationPage} />
        <Route
          path="/app"
          component={() => (
            <ProtectedRoute>
              <RoleDashboardPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/app/establishments"
          component={() => (
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <EstablishmentApplicationsPage />
            </ProtectedRoute>
          )}
        />
          <Route
            path="/app/establishment"
            component={() => (
              <ProtectedRoute>
                <EstablishmentOverviewPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/app/school-years"
            component={() => (
              <ProtectedRoute>
                <AcademicConfigurationPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/app/team"
            component={() => (
              <ProtectedRoute>
                <TutorsPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/app/resources"
            component={() => (
              <ProtectedRoute requiredRole="SUPER_ADMIN">
                <PlaceholderPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/app/calendar"
            component={() => (
              <ProtectedRoute requiredRole="SUPER_ADMIN">
                <PlaceholderPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/app/settings"
            component={() => (
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/app/help"
            component={() => (
              <ProtectedRoute requiredRole="SUPER_ADMIN">
                <PlaceholderPage />
              </ProtectedRoute>
            )}
          />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoleDashboardPage() {
  const { profile } = useAuth();
  return profile?.role === 'SUPER_ADMIN' ? <DashboardPage /> : <DirectorDashboardPage />;
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
