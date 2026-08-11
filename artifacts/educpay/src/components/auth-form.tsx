import { type FormEvent, type ReactNode, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, LoaderCircle } from 'lucide-react';

export function Field({ id, label, type = 'text', value, onChange, placeholder, error, autoComplete, hint, required = true }: {
  id: string; label: string; type?: string; value: string; onChange: (value: string) => void; placeholder?: string; error?: string; autoComplete?: string; hint?: string; required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const password = type === 'password';
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="flex justify-between text-sm font-bold text-card-foreground">
        <span>{label}</span>
        {hint && <span className="font-medium text-muted-foreground">{hint}</span>}
      </label>
      <div className="relative">
         <input id={id} name={id} type={password && visible ? 'text' : type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} required={required} aria-required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={`h-12 w-full rounded-xl border bg-background/70 px-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors ${password ? 'pr-12' : ''} ${error ? 'border-destructive' : 'border-input hover:border-foreground/30 focus:border-primary'}`} data-testid={`input-${id}`} />
        {password && <button type="button" onClick={() => setVisible((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground" aria-label={visible ? 'Hide password' : 'Show password'} data-testid={`button-toggle-${id}`}>
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>}
      </div>
      {error && <p id={`${id}-error`} className="flex items-center gap-1.5 text-xs font-medium text-destructive" role="alert"><AlertCircle className="size-3.5" aria-hidden="true" />{error}</p>}
    </div>
  );
}

export function SubmitButton({ children, loading, disabled }: { children: ReactNode; loading?: boolean; disabled?: boolean }) {
  return <button type="submit" disabled={disabled || loading} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-[0_8px_18px_hsl(var(--primary)/.18)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_24px_hsl(var(--primary)/.24)] disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0" data-testid="button-submit">
    {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}{children}
  </button>;
}

export function FormMessage({ kind, children }: { kind: 'error' | 'success'; children: ReactNode }) {
  return <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs font-medium leading-5 ${kind === 'error' ? 'border-destructive/25 bg-destructive/8 text-destructive' : 'border-primary/25 bg-primary/8 text-primary'}`} role={kind === 'error' ? 'alert' : 'status'} data-testid={`message-${kind}`}>
    {kind === 'error' ? <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}{children}
  </div>;
}

export function useSubmit(handler: () => Promise<void>) {
  const [loading, setLoading] = useState(false);
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    try { await handler(); } finally { setLoading(false); }
  };
  return { loading, onSubmit };
}

export function PasswordStrength({ password }: { password: string }) {
  const checks = [
    ['8+ characters', password.length >= 8],
    ['One uppercase letter', /[A-Z]/.test(password)],
    ['One number', /\d/.test(password)],
  ] as const;
  const score = checks.filter(([, valid]) => valid).length;
  return <div className="space-y-2.5 rounded-xl border border-border bg-background/45 p-3.5" data-testid="password-strength">
    <div className="flex items-center justify-between text-xs font-bold"><span className="text-muted-foreground">Password strength</span><span className={score === 3 ? 'text-primary' : 'text-accent-foreground'}>{score === 3 ? 'Good to go' : score === 0 ? 'Add a few details' : 'Getting there'}</span></div>
    <div className="flex gap-1.5">{[0, 1, 2].map((segment) => <span className={`h-1.5 flex-1 rounded-full transition-colors ${segment < score ? 'bg-primary' : 'bg-muted'}`} key={segment} />)}</div>
    <div className="grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-3">{checks.map(([label, valid]) => <span className={valid ? 'text-primary' : ''} key={label}>{valid ? '✓' : '○'} {label}</span>)}</div>
  </div>;
}