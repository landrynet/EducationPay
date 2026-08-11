import { type ReactNode } from 'react';
import { Link } from 'wouter';
import { ArrowUpRight, Check, ShieldCheck } from 'lucide-react';

type AuthLayoutProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  step?: string;
};

export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-3" data-testid="brand-educpay">
      <span className={`brand-mark grid size-10 place-items-center rounded-xl ${light ? 'ring-1 ring-white/20' : ''}`}>
        <span className="font-mono text-lg font-bold tracking-[-0.12em] text-primary-foreground">ep</span>
      </span>
      <span className={`font-sans text-[1.15rem] font-bold tracking-[-0.04em] ${light ? 'text-white' : 'text-foreground'}`}>
        Educ<span className={light ? 'text-[#a5e0ca]' : 'text-primary'}>PAY</span>
      </span>
    </span>
  );
}

export function SimulationNotice() {
  return (
    <div className="simulation-stripe flex gap-3 rounded-xl border border-accent/25 px-4 py-3 text-left" data-testid="notice-local-simulation">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-foreground" aria-hidden="true" />
      <p className="text-xs leading-5 text-foreground/70">
        <span className="font-bold text-foreground">Local simulation</span> · No account is created and no data leaves this browser.
      </p>
    </div>
  );
}

export function AuthLayout({ eyebrow = 'School operations, in order', title, description, children, footer, step }: AuthLayoutProps) {
  return (
    <main className="auth-canvas relative min-h-[100dvh] overflow-hidden">
      <div className="auth-grid pointer-events-none absolute inset-x-0 top-0 h-[46rem] opacity-70" />
      <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
        <Link href="/" className="transition-transform duration-200 hover:-translate-y-0.5" data-testid="link-brand-home">
          <BrandMark />
        </Link>
        <Link href="/" className="group flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground" data-testid="link-back-home">
          Back to site <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </Link>
      </header>

      <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 pb-12 pt-10 sm:px-8 md:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(390px,480px)] lg:items-center lg:gap-24 lg:px-12 lg:pb-24">
        <section className="auth-enter hidden lg:block">
          <div className="mb-8 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            <span className="h-px w-8 bg-primary" /> {eyebrow}
          </div>
          <h1 className="max-w-xl font-sans text-5xl font-extrabold leading-[1.04] tracking-[-0.055em] text-foreground xl:text-6xl">
            Keep the office moving, <span className="text-primary">quietly.</span>
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-muted-foreground">
            A clear starting point for the people who keep every school day accounted for.
          </p>
          <div className="mt-14 grid max-w-md grid-cols-2 gap-3">
            {['Ready for your morning', 'Built for clear handoffs'].map((item) => (
              <div className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-card/50 p-3.5 text-xs font-semibold text-foreground/75" key={item}>
                <span className="mt-0.5 grid size-4 place-items-center rounded-full bg-primary/15 text-primary"><Check className="size-3" aria-hidden="true" /></span>
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="auth-card-enter">
          <div className="mb-8 lg:hidden">
            <div className="mb-5 text-xs font-bold uppercase tracking-[0.17em] text-primary">{eyebrow}</div>
            <h1 className="font-sans text-4xl font-extrabold leading-[1.05] tracking-[-0.055em] text-foreground">{title}</h1>
          </div>
          <div className="rounded-2xl border border-card-border bg-card/95 p-6 shadow-[0_24px_70px_hsl(216_38%_17%/0.09)] sm:p-9">
            <div className="hidden lg:block">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.17em] text-primary">{eyebrow}</p>
              <h1 className="font-sans text-3xl font-extrabold leading-tight tracking-[-0.045em] text-card-foreground">{title}</h1>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
            {step && <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> {step}</div>}
            <div className="mt-7">{children}</div>
          </div>
          {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
        </section>
      </div>
      <footer className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-5 pb-6 text-[11px] font-medium text-muted-foreground/70 sm:px-8 lg:px-12">
        <span>© 2024 EducPAY</span>
        <span className="font-mono tracking-wide">PHASE 3A · LOCAL</span>
      </footer>
    </main>
  );
}