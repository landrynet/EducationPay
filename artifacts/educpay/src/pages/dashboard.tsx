import { useLocation } from 'wouter';
import { ArrowRight, LogOut, ShieldCheck } from 'lucide-react';
import { BrandMark } from '@/components/auth-layout';
import { clearLocalSession } from '@/lib/local-auth';

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const logout = () => { clearLocalSession(); setLocation('/auth/login'); };
  return <main className="min-h-[100dvh] bg-background">
    <header className="border-b border-border bg-card/70"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12"><BrandMark /><button onClick={logout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" data-testid="button-logout"><LogOut className="size-4" aria-hidden="true" /> Sign out</button></div></header>
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12 lg:py-20">
      <div className="max-w-2xl"><p className="mb-4 text-xs font-bold uppercase tracking-[0.17em] text-primary">Super Admin workspace</p><h1 className="font-sans text-4xl font-extrabold tracking-[-0.055em] text-foreground sm:text-5xl" data-testid="text-dashboard-title">Good morning. You’re in.</h1><p className="mt-5 text-base leading-7 text-muted-foreground">This protected placeholder confirms that the local session guard is working. Business modules will arrive in a later phase.</p></div>
      <div className="mt-10 grid gap-5 md:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8" data-testid="card-session-status"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="size-5" aria-hidden="true" /></span><div><h2 className="font-bold text-foreground">Local session active</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">A non-sensitive marker is stored in this browser only. Sign out clears it.</p></div></div></section>
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Current role</p><p className="mt-3 text-xl font-bold text-foreground">Super Admin</p><p className="mt-1 font-mono text-xs text-muted-foreground">superadmin@demo.local</p></section>
      </div>
      <button onClick={logout} className="group mt-8 flex items-center gap-2 text-sm font-bold text-primary hover:underline" data-testid="button-dashboard-logout">End local session <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></button>
    </div>
  </main>;
}