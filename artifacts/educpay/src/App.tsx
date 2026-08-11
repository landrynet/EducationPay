import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import LandingPage from '@/pages/landing';
import LoginPage from '@/pages/auth-login';
import RegisterPage from '@/pages/auth-register';
import ForgotPasswordPage from '@/pages/auth-forgot';
import ResetPasswordPage from '@/pages/auth-reset';
import FirstLoginPage from '@/pages/auth-first-login';
import DashboardPage from '@/pages/dashboard';
import { isLocalSession } from '@/lib/local-auth';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function ProtectedDashboard() {
  const [, setLocation] = useLocation();
  useEffect(() => { if (!isLocalSession()) setLocation('/auth/login'); }, [setLocation]);
  return isLocalSession() ? <DashboardPage /> : <div className="min-h-[100dvh] bg-background"><div className="loading-bar h-1 w-full bg-primary" /></div>;
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/auth/login" component={LoginPage} />
        <Route path="/auth/register" component={RegisterPage} />
        <Route path="/auth/forgot-password" component={ForgotPasswordPage} />
        <Route path="/auth/reset-password" component={ResetPasswordPage} />
        <Route path="/auth/first-login" component={FirstLoginPage} />
        <Route path="/dashboard" component={ProtectedDashboard} />
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
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
