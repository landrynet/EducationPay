import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import LoginPage from '@/pages/auth-login';
import RegisterPage from '@/pages/auth-register';
import ForgotPasswordPage from '@/pages/auth-forgot';
import ResetPasswordPage from '@/pages/auth-reset';
import FirstLoginPage from '@/pages/auth-first-login';
import DashboardPage from '@/pages/dashboard';
import { BrandMark } from '@/components/auth-layout';
import { isLocalSession } from '@/lib/local-auth';
import {
  Route,
  Switch,
  Link,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  return <main className="min-h-[100dvh] overflow-hidden bg-background">
    <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
      <Link href="/" data-testid="link-home-brand"><BrandMark /></Link>
      <nav className="flex items-center gap-3"><Link href="/auth/login" className="rounded-lg px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground" data-testid="link-home-signin">Sign in</Link><Link href="/auth/register" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="link-home-start">See the workspace</Link></nav>
    </header>
    <section className="relative mx-auto grid max-w-7xl gap-16 px-5 pb-20 pt-16 sm:px-8 md:pt-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-12 lg:pb-28">
      <div className="absolute -left-32 -top-28 size-[32rem] rounded-full bg-accent/10 blur-3xl" />
      <div className="relative"><p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-primary"><span className="h-px w-8 bg-primary" /> The school office, in order</p><h1 className="max-w-2xl font-sans text-5xl font-extrabold leading-[1.02] tracking-[-0.065em] text-foreground sm:text-6xl lg:text-7xl">A calmer way to keep every <span className="text-primary">school day</span> accounted for.</h1><p className="mt-7 max-w-lg text-lg leading-8 text-muted-foreground">EducPAY gives school administrators a clear operational home for the work that keeps families, classrooms, and finance moving together.</p><div className="mt-9 flex flex-wrap items-center gap-4"><Link href="/auth/login" className="rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_10px_22px_hsl(var(--primary)/.18)] transition-all hover:-translate-y-0.5" data-testid="link-hero-login">Enter the workspace</Link><span className="text-xs font-semibold text-muted-foreground">Built for the people behind the bell.</span></div></div>
      <div className="relative rounded-[1.8rem] border border-border bg-card p-4 shadow-[0_30px_80px_hsl(216_38%_17%/0.12)] sm:p-6"><div className="rounded-xl border border-border bg-background p-5 sm:p-7"><div className="flex items-center justify-between border-b border-border pb-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">EducPAY / overview</p><h2 className="mt-2 text-xl font-extrabold tracking-tight text-foreground">Good morning, Amina</h2></div><span className="grid size-10 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">AO</span></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-primary p-4 text-primary-foreground"><p className="text-[10px] font-bold uppercase tracking-wider opacity-70">This term</p><p className="mt-2 text-2xl font-extrabold">On track</p><div className="mt-5 h-1 rounded-full bg-primary-foreground/25"><div className="h-full w-[78%] rounded-full bg-primary-foreground" /></div></div><div className="rounded-xl border border-border p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">To review</p><p className="mt-2 text-2xl font-extrabold text-foreground">06</p><p className="mt-5 text-xs font-semibold text-accent-foreground">Needs your eye</p></div></div><div className="mt-5 space-y-2.5">{['Morning reconciliation', 'Family account follow-up', 'Term close checklist'].map((item, index) => <div className="flex items-center justify-between rounded-lg border border-border px-3.5 py-3" key={item}><span className="text-xs font-bold text-foreground/75">{item}</span><span className={`size-2 rounded-full ${index === 1 ? 'bg-accent' : 'bg-primary'}`} /></div>)}</div></div></div>
    </section>
    <section className="border-y border-border bg-card/45"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 md:grid-cols-3 lg:px-12"><div><p className="font-mono text-xs text-primary">01 / CLARITY</p><h2 className="mt-3 text-xl font-extrabold tracking-tight">See what needs attention.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">A focused view of the work in front of your office, without the noise.</p></div><div><p className="font-mono text-xs text-primary">02 / CONTROL</p><h2 className="mt-3 text-xl font-extrabold tracking-tight">Keep handoffs visible.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">The details stay close to the decisions that depend on them.</p></div><div><p className="font-mono text-xs text-primary">03 / CONFIDENCE</p><h2 className="mt-3 text-xl font-extrabold tracking-tight">Start every day ready.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">A dependable foundation for school administrators and their teams.</p></div></div></section>
    <footer className="mx-auto flex max-w-7xl items-center justify-between px-5 py-8 text-xs text-muted-foreground sm:px-8 lg:px-12"><BrandMark /><span>EducPAY · school operations, in order</span></footer>
  </main>;
}

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
        <Route path="/" component={Home} />
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
