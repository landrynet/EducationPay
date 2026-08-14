import { AlertTriangle, Inbox, LoaderCircle, RefreshCw } from 'lucide-react';

export function EmptyState({ title = 'Rien à afficher pour le moment', description = 'Les informations de cet espace apparaîtront lorsque votre environnement sera configuré.' }: { title?: string; description?: string }) {
  return (
    <div className="flex min-h-[190px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 text-center" data-testid="state-empty">
      <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-secondary text-primary"><Inbox className="size-5" strokeWidth={1.7} /></span>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="space-y-3" aria-label="Chargement en cours" data-testid="state-loading">
      {[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-muted" />)}
      <span className="sr-only"><LoaderCircle className="size-4" /> Chargement en cours</span>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex min-h-[190px] flex-col items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/5 px-6 text-center" role="alert" data-testid="state-error">
      <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-destructive/10 text-destructive"><AlertTriangle className="size-5" /></span>
      <h3 className="text-sm font-semibold text-foreground">Cet espace n’est pas disponible</h3>
      <p className="mt-1.5 text-xs text-muted-foreground">Réessayez dans un instant, ou revenez plus tard.</p>
      {onRetry ? <button type="button" onClick={onRetry} data-testid="button-retry" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><RefreshCw className="size-3.5" /> Réessayer</button> : null}
    </div>
  );
}

export function StatCard({ label, note, tone = 'mint' }: { label: string; note: string; tone?: 'mint' | 'sand' | 'blue' | 'rose' }) {
  const toneClass = { mint: 'bg-primary/10 text-primary', sand: 'bg-secondary text-secondary-foreground', blue: 'bg-[#e4edf2] text-[#416577]', rose: 'bg-[#f5e7e0] text-[#a5654f]' }[tone];
  return (
    <article className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_8px_24px_-20px_hsl(var(--foreground)/.28)]" data-testid={`card-stat-${label.toLowerCase().replaceAll(' ', '-')}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <span className={`grid size-8 place-items-center rounded-xl text-xs font-bold ${toneClass}`}>—</span>
      </div>
      <p className="mt-7 font-serif text-4xl leading-none text-foreground">—</p>
      <p className="mt-3 text-xs text-muted-foreground">{note}</p>
    </article>
  );
}