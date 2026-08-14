import { useCreateEstablishmentApplication, useGetEstablishmentApplication, useResubmitEstablishmentApplication, useUpdateEstablishmentApplication, getGetEstablishmentApplicationQueryKey, type EstablishmentApplication, type EstablishmentApplicationInput } from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clipboard, ExternalLink, FileCheck2, LoaderCircle, MapPin, Pencil, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import schoolTeam from '@assets/generated_images/educpay-school-team.jpg';

const DRAFT_KEY = 'educpay-registration-draft';
const SUBMISSION_KEY = 'educpay-registration-submission';

type SubmissionRecord = {
  id: string;
  reference: string;
  editToken: string;
  email: string;
};

const emptyDraft: EstablishmentApplicationInput = {
  officialName: '',
  establishmentType: '',
  levels: [],
  address: '',
  city: '',
  province: '',
  phone: '',
  officialEmail: '',
  schoolYear: '',
  principalFirstName: '',
  principalLastName: '',
  principalEmail: '',
  principalPhone: '',
  principalFunction: '',
};

const stepNames = ['Établissement', 'Coordonnées', 'Responsable', 'Vérification'];

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') return error.message;
  return fallback;
}

function PublicHeader({ eyebrow, title, description, className = '' }: { eyebrow: string; title: string; description: string; className?: string }) {
  return (
    <header className={`mx-auto max-w-3xl text-center ${className}`}>
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h1 className="font-serif text-4xl leading-[0.95] tracking-[-0.03em] text-foreground sm:text-5xl">{title}</h1>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
    </header>
  );
}

function PublicFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <main className={`public-frame min-h-[100dvh] bg-background px-4 py-8 sm:px-6 lg:px-10 lg:py-12 ${className}`}>
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-extrabold tracking-[-0.03em] text-foreground" data-testid="link-public-brand">
            <span className="grid size-8 place-items-center rounded-[11px_11px_11px_3px] bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar))]">e</span>
            EducPAY
          </Link>
          <Link href="/registration-status" className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" data-testid="link-registration-status">
            Suivre une demande
          </Link>
        </div>
        {children}
      </div>
    </main>
  );
}

function Field({ label, name, value, onChange, type = 'text', placeholder, required = true, error }: {
  label: string;
  name: keyof EstablishmentApplicationInput;
  value: string;
  onChange: (name: keyof EstablishmentApplicationInput, value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="auth-field" data-testid={`field-${name}`}>
      <span>{label}{required ? <span className="text-destructive"> *</span> : null}</span>
      <span className="auth-input-wrap">
        <input
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          required={required}
          onChange={(event) => onChange(name, event.target.value)}
          aria-invalid={Boolean(error)}
          data-testid={`input-${name}`}
        />
      </span>
      {error ? <small className="mt-1 block text-xs text-destructive">{error}</small> : null}
    </label>
  );
}

function LevelPicker({ value, onChange }: { value: EstablishmentApplicationInput['levels']; onChange: (levels: EstablishmentApplicationInput['levels']) => void }) {
  const levels = [
    { value: 'PRIMARY' as const, label: 'Primaire', description: 'Enseignement primaire' },
    { value: 'SECONDARY' as const, label: 'Secondaire', description: 'Collège ou lycée' },
    { value: 'PRIMARY_SECONDARY' as const, label: 'Primaire et secondaire', description: 'Plusieurs niveaux' },
  ];
  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-2 text-sm font-semibold text-foreground">Niveaux enseignés <span className="text-destructive">*</span></legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {levels.map((level) => {
          const checked = value.includes(level.value);
          return (
            <label key={level.value} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${checked ? 'border-primary bg-primary/5' : 'border-border/80 bg-card hover:border-primary/40'}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(checked ? value.filter((item) => item !== level.value) : [...value, level.value])}
                className="mt-0.5 size-4 accent-[hsl(var(--primary))]"
                data-testid={`input-level-${level.value.toLowerCase()}`}
              />
              <span>
                <strong className="block text-sm">{level.label}</strong>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{level.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function ApplicationFields({ draft, onChange, errors = {} }: {
  draft: EstablishmentApplicationInput;
  onChange: (name: keyof EstablishmentApplicationInput, value: string | EstablishmentApplicationInput['levels']) => void;
  errors?: Partial<Record<keyof EstablishmentApplicationInput, string>>;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Nom officiel" name="officialName" value={draft.officialName} onChange={(name, value) => onChange(name, value)} placeholder="Nom officiel de l’établissement" error={errors.officialName} />
      <Field label="Type d’établissement" name="establishmentType" value={draft.establishmentType} onChange={(name, value) => onChange(name, value)} placeholder="École, collège, lycée..." error={errors.establishmentType} />
      <Field label="Année scolaire" name="schoolYear" value={draft.schoolYear} onChange={(name, value) => onChange(name, value)} placeholder="2025-2026" error={errors.schoolYear} />
      <LevelPicker value={draft.levels} onChange={(levels) => onChange('levels', levels)} />
      <Field label="Adresse" name="address" value={draft.address} onChange={(name, value) => onChange(name, value)} placeholder="Adresse complète" error={errors.address} />
      <Field label="Ville" name="city" value={draft.city} onChange={(name, value) => onChange(name, value)} placeholder="Ville" error={errors.city} />
      <Field label="Province" name="province" value={draft.province} onChange={(name, value) => onChange(name, value)} placeholder="Province" error={errors.province} />
      <Field label="Téléphone de l’établissement" name="phone" value={draft.phone} onChange={(name, value) => onChange(name, value)} type="tel" placeholder="+1 000 000 0000" error={errors.phone} />
      <Field label="Email officiel" name="officialEmail" value={draft.officialEmail} onChange={(name, value) => onChange(name, value)} type="email" placeholder="contact@etablissement.org" error={errors.officialEmail} />
      <Field label="Prénom du responsable" name="principalFirstName" value={draft.principalFirstName} onChange={(name, value) => onChange(name, value)} placeholder="Prénom" error={errors.principalFirstName} />
      <Field label="Nom du responsable" name="principalLastName" value={draft.principalLastName} onChange={(name, value) => onChange(name, value)} placeholder="Nom" error={errors.principalLastName} />
      <Field label="Fonction" name="principalFunction" value={draft.principalFunction} onChange={(name, value) => onChange(name, value)} placeholder="Direction, secrétariat..." error={errors.principalFunction} />
      <Field label="Email du responsable" name="principalEmail" value={draft.principalEmail} onChange={(name, value) => onChange(name, value)} type="email" placeholder="responsable@etablissement.org" error={errors.principalEmail} />
      <Field label="Téléphone du responsable" name="principalPhone" value={draft.principalPhone} onChange={(name, value) => onChange(name, value)} type="tel" placeholder="+1 000 000 0000" error={errors.principalPhone} />
    </div>
  );
}

function validateDraft(draft: EstablishmentApplicationInput, step: number): Partial<Record<keyof EstablishmentApplicationInput, string>> {
  const errors: Partial<Record<keyof EstablishmentApplicationInput, string>> = {};
  const required = (name: keyof EstablishmentApplicationInput, minimum = 2) => {
    const value = draft[name];
    if (typeof value === 'string' && value.trim().length < minimum) errors[name] = 'Ce champ est requis.';
  };
  if (step === 0) {
    required('officialName');
    required('establishmentType');
    required('schoolYear', 4);
    if (draft.levels.length === 0) errors.levels = 'Sélectionnez au moins un niveau.';
  }
  if (step === 1) {
    required('address', 3);
    required('city');
    required('province');
    required('phone', 7);
    required('officialEmail', 5);
    if (draft.officialEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.officialEmail)) errors.officialEmail = 'Saisissez une adresse email valide.';
  }
  if (step === 2) {
    required('principalFirstName');
    required('principalLastName');
    required('principalFunction');
    required('principalEmail', 5);
    required('principalPhone', 7);
    if (draft.principalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.principalEmail)) errors.principalEmail = 'Saisissez une adresse email valide.';
  }
  return errors;
}

function SummaryRow({ label, value, onEdit, testId }: { label: string; value: string; onEdit?: () => void; testId: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/70 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
      <span className="flex items-center gap-3 text-right text-sm font-semibold text-foreground" data-testid={testId}>
        <span>{value || '—'}</span>
        {onEdit ? <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline" data-testid={`button-edit-${testId}`}><Pencil className="size-3" /> Modifier</button> : null}
      </span>
    </div>
  );
}

function ApplicationSummary({ draft, onEdit }: { draft: EstablishmentApplicationInput; onEdit: (step: number) => void }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6">
        <div className="mb-2 flex items-center gap-2"><MapPin className="size-4 text-primary" /><h3 className="font-semibold">Établissement</h3></div>
        <SummaryRow label="Nom officiel" value={draft.officialName} onEdit={() => onEdit(0)} testId="summary-official-name" />
        <SummaryRow label="Type" value={draft.establishmentType} onEdit={() => onEdit(0)} testId="summary-establishment-type" />
        <SummaryRow label="Niveaux" value={draft.levels.join(', ')} onEdit={() => onEdit(0)} testId="summary-levels" />
        <SummaryRow label="Année scolaire" value={draft.schoolYear} onEdit={() => onEdit(0)} testId="summary-school-year" />
      </section>
      <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6">
        <div className="mb-2 flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /><h3 className="font-semibold">Coordonnées</h3></div>
        <SummaryRow label="Adresse" value={`${draft.address}, ${draft.city}, ${draft.province}`} onEdit={() => onEdit(1)} testId="summary-address" />
        <SummaryRow label="Téléphone" value={draft.phone} onEdit={() => onEdit(1)} testId="summary-phone" />
        <SummaryRow label="Email officiel" value={draft.officialEmail} onEdit={() => onEdit(1)} testId="summary-official-email" />
      </section>
      <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 lg:col-span-2">
        <div className="mb-2 flex items-center gap-2"><FileCheck2 className="size-4 text-primary" /><h3 className="font-semibold">Responsable de l’établissement</h3></div>
        <div className="grid gap-x-6 sm:grid-cols-2">
          <SummaryRow label="Nom" value={`${draft.principalFirstName} ${draft.principalLastName}`} onEdit={() => onEdit(2)} testId="summary-principal-name" />
          <SummaryRow label="Fonction" value={draft.principalFunction} onEdit={() => onEdit(2)} testId="summary-principal-function" />
          <SummaryRow label="Email" value={draft.principalEmail} onEdit={() => onEdit(2)} testId="summary-principal-email" />
          <SummaryRow label="Téléphone" value={draft.principalPhone} onEdit={() => onEdit(2)} testId="summary-principal-phone" />
        </div>
      </section>
    </div>
  );
}

function ErrorNotice({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm leading-6 text-destructive" role="alert" data-testid="registration-error">{children}</div>;
}

export function RegisterEstablishmentPage() {
  const [, setLocation] = useLocation();
  const createApplication = useCreateEstablishmentApplication();
  const [draft, setDraft] = useState<EstablishmentApplicationInput>(() => readStorage(DRAFT_KEY, emptyDraft));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof EstablishmentApplicationInput, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  const updateDraft = (name: keyof EstablishmentApplicationInput, value: string | EstablishmentApplicationInput['levels']) => {
    setDraft((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const goNext = () => {
    if (step < 3) {
      const nextErrors = validateDraft(draft, step);
      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors);
        return;
      }
      setErrors({});
      setStep((current) => current + 1);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (createApplication.isPending) return;
    setSubmitError(null);
    createApplication.mutate({ data: draft }, {
      onSuccess: (result) => {
        const submission: SubmissionRecord = { id: result.id, reference: result.reference, editToken: result.editToken, email: result.email };
        window.localStorage.setItem(SUBMISSION_KEY, JSON.stringify(submission));
        window.localStorage.removeItem(DRAFT_KEY);
        setLocation('/registration-submitted');
      },
      onError: (error) => setSubmitError(getErrorMessage(error, 'La demande n’a pas pu être envoyée. Vérifiez les informations puis réessayez.')),
    });
  };

  return (
    <PublicFrame className="registration-page-frame">
      <div className="registration-intro">
        <div className="registration-intro-copy">
          <PublicHeader
            eyebrow="Inscription établissement"
            title="Déposer une demande, étape par étape."
            description="Renseignez les informations officielles de votre établissement. Vous pourrez vérifier chaque détail avant l’envoi."
            className="registration-header"
          />
        </div>
        <div className="registration-intro-visual" aria-hidden="true">
          <div className="registration-photo-card">
            <img src={schoolTeam} alt="" />
            <div className="registration-photo-caption">
              <span>EDUCPAY</span>
              <strong>Un dossier clair, dès le départ.</strong>
            </div>
          </div>
          <div className="registration-steps-card">
            <span className="registration-steps-icon"><Check className="size-4" /></span>
            <span><strong>4 étapes simples</strong><small>Du dossier à la validation</small></span>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-4xl">
        <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Progression de l’inscription">
          {stepNames.map((name, index) => (
            <li key={name} className="min-w-0" data-testid={`step-${index + 1}`}>
              <div className={`mb-2 h-1 rounded-full ${index <= step ? 'bg-primary' : 'bg-muted'}`} />
              <span className={`block truncate text-[10px] font-bold uppercase tracking-[0.1em] sm:text-xs ${index === step ? 'text-primary' : 'text-muted-foreground'}`}>{index + 1}. {name}</span>
            </li>
          ))}
        </ol>
        <form onSubmit={submit}>
          <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_12px_34px_-24px_hsl(var(--foreground)/.3)] sm:p-8">
            <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Étape {step + 1} sur 4</p>
                <h2 className="mt-1 text-xl font-semibold">{stepNames[step]}</h2>
              </div>
              {step === 3 ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><ShieldCheck className="size-4 text-primary" /> Vérification finale</span> : null}
            </div>
            {step === 0 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nom officiel" name="officialName" value={draft.officialName} onChange={updateDraft} placeholder="Nom officiel de l’établissement" error={errors.officialName} />
                <Field label="Type d’établissement" name="establishmentType" value={draft.establishmentType} onChange={updateDraft} placeholder="École, collège, lycée..." error={errors.establishmentType} />
                <Field label="Année scolaire" name="schoolYear" value={draft.schoolYear} onChange={updateDraft} placeholder="2025-2026" error={errors.schoolYear} />
                <LevelPicker value={draft.levels} onChange={(levels) => updateDraft('levels', levels)} />
                {errors.levels ? <p className="text-xs text-destructive sm:col-span-2">{errors.levels}</p> : null}
              </div>
            ) : null}
            {step === 1 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Adresse" name="address" value={draft.address} onChange={updateDraft} placeholder="Adresse complète" error={errors.address} />
                <Field label="Ville" name="city" value={draft.city} onChange={updateDraft} placeholder="Ville" error={errors.city} />
                <Field label="Province" name="province" value={draft.province} onChange={updateDraft} placeholder="Province" error={errors.province} />
                <Field label="Téléphone de l’établissement" name="phone" value={draft.phone} onChange={updateDraft} type="tel" placeholder="+1 000 000 0000" error={errors.phone} />
                <Field label="Email officiel" name="officialEmail" value={draft.officialEmail} onChange={updateDraft} type="email" placeholder="contact@etablissement.org" error={errors.officialEmail} />
              </div>
            ) : null}
            {step === 2 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Prénom du responsable" name="principalFirstName" value={draft.principalFirstName} onChange={updateDraft} placeholder="Prénom" error={errors.principalFirstName} />
                <Field label="Nom du responsable" name="principalLastName" value={draft.principalLastName} onChange={updateDraft} placeholder="Nom" error={errors.principalLastName} />
                <Field label="Fonction" name="principalFunction" value={draft.principalFunction} onChange={updateDraft} placeholder="Direction, secrétariat..." error={errors.principalFunction} />
                <Field label="Email du responsable" name="principalEmail" value={draft.principalEmail} onChange={updateDraft} type="email" placeholder="responsable@etablissement.org" error={errors.principalEmail} />
                <Field label="Téléphone du responsable" name="principalPhone" value={draft.principalPhone} onChange={updateDraft} type="tel" placeholder="+1 000 000 0000" error={errors.principalPhone} />
              </div>
            ) : null}
            {step === 3 ? <ApplicationSummary draft={draft} onEdit={setStep} /> : null}
            {submitError ? <div className="mt-6"><ErrorNotice>{submitError}</ErrorNotice></div> : null}
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => { setErrors({}); setStep((current) => Math.max(0, current - 1)); }} disabled={step === 0 || createApplication.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-previous-step"><ArrowLeft className="size-4" /> Retour</button>
              {step < 3 ? (
                <button type="button" onClick={goNext} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50" data-testid="button-next-step">Continuer <ArrowRight className="size-4" /></button>
              ) : (
                <button type="submit" disabled={createApplication.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-60" data-testid="button-submit-registration">
                  {createApplication.isPending ? <><LoaderCircle className="size-4 animate-spin" /> Envoi en cours…</> : <><CheckCircle2 className="size-4" /> Envoyer la demande</>}
                </button>
              )}
            </div>
          </section>
        </form>
        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">Vos informations sont transmises à l’équipe EducPAY pour revue. Aucun paiement n’est demandé à cette étape.</p>
      </div>
    </PublicFrame>
  );
}

export function RegistrationSubmittedPage() {
  const [submission] = useState<SubmissionRecord | null>(() => readStorage(SUBMISSION_KEY, null));
  const [copied, setCopied] = useState(false);
  const copyReference = async () => {
    if (!submission) return;
    try {
      await navigator.clipboard.writeText(submission.reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return (
    <PublicFrame>
      <div className="mx-auto max-w-2xl rounded-3xl border border-border/80 bg-card px-5 py-10 text-center shadow-[0_16px_40px_-28px_hsl(var(--foreground)/.4)] sm:px-10 sm:py-14">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Check className="size-7" /></span>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Demande envoyée</p>
        <h1 className="mt-2 font-serif text-4xl leading-none tracking-[-0.03em] sm:text-5xl">Votre demande est en revue.</h1>
        {submission ? (
          <>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-muted-foreground">La demande a bien été reçue et porte le statut <strong className="text-foreground">PENDING_REVIEW</strong>. Conservez cette référence pour suivre son avancement.</p>
            <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-border/80 bg-background p-5">
              <span className="text-xs font-bold uppercase tracking-[0.13em] text-muted-foreground">Référence</span>
              <strong className="mt-2 block break-all font-mono text-xl tracking-[0.08em] text-foreground" data-testid="text-submission-reference">{submission.reference}</strong>
              <button type="button" onClick={copyReference} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline" data-testid="button-copy-reference"><Clipboard className="size-3.5" /> {copied ? 'Référence copiée' : 'Copier la référence'}</button>
            </div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/registration-status" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground" data-testid="link-check-submission">Suivre la demande <ArrowRight className="size-4" /></Link>
              <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted" data-testid="link-submission-home">Retour à l’accueil</Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">La référence de cette demande n’est pas disponible sur cet appareil.</p>
            <Link href="/registration-status" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground" data-testid="link-find-submission">Retrouver une demande <Search className="size-4" /></Link>
          </>
        )}
      </div>
    </PublicFrame>
  );
}

function statusLabel(status: string) {
  return { PENDING_REVIEW: 'En revue', APPROVED: 'Validée', REJECTED: 'Refusée', SUSPENDED: 'Suspendue' }[status] ?? status;
}

function statusClass(status: string) {
  return status === 'APPROVED' ? 'border-primary/25 bg-primary/10 text-primary' : status === 'REJECTED' ? 'border-destructive/25 bg-destructive/10 text-destructive' : 'border-[hsl(var(--sidebar-primary))]/35 bg-[hsl(var(--sidebar-primary))]/15 text-foreground';
}

function EditableApplicationForm({ initial, token, onComplete }: { initial: EstablishmentApplication; token: string; onComplete: (application: EstablishmentApplication) => void }) {
  const updateApplication = useUpdateEstablishmentApplication();
  const resubmitApplication = useResubmitEstablishmentApplication();
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const update = (name: keyof EstablishmentApplicationInput, value: string | EstablishmentApplicationInput['levels']) => setDraft((current) => ({ ...current, [name]: value }));
  const pending = updateApplication.isPending || resubmitApplication.isPending;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const errors = validateDraft(draft, 0);
    const allErrors = { ...errors, ...validateDraft(draft, 1), ...validateDraft(draft, 2) };
    if (Object.keys(allErrors).length) {
      setError('Vérifiez les champs signalés avant de renvoyer la demande.');
      return;
    }
    setError(null);
    updateApplication.mutate({ id: initial.id ?? '', data: draft, params: { token } }, {
      onSuccess: () => resubmitApplication.mutate({ id: initial.id ?? '', params: { token } }, {
        onSuccess: (result) => onComplete(result),
        onError: (reason) => setError(getErrorMessage(reason, 'La demande n’a pas pu être renvoyée.')),
      }),
      onError: (reason) => setError(getErrorMessage(reason, 'Les corrections n’ont pas pu être enregistrées.')),
    });
  };
  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl border border-border/80 bg-card p-5 sm:p-7">
      <div className="mb-6"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Correction</p><h2 className="mt-1 text-xl font-semibold">Mettre à jour la demande</h2><p className="mt-2 text-sm text-muted-foreground">Corrigez les informations demandées, puis renvoyez votre dossier en revue.</p></div>
      <ApplicationFields draft={draft} onChange={update} />
      {error ? <div className="mt-5"><ErrorNotice>{error}</ErrorNotice></div> : null}
      <button type="submit" disabled={pending} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" data-testid="button-resubmit-application">
        {pending ? <><LoaderCircle className="size-4 animate-spin" /> Enregistrement…</> : <><RefreshCw className="size-4" /> Enregistrer et renvoyer</>}
      </button>
    </form>
  );
}

export function RegistrationStatusPage() {
  const saved = useMemo(() => readStorage<SubmissionRecord | null>(SUBMISSION_KEY, null), []);
  const [id, setId] = useState(saved?.id ?? '');
  const [token, setToken] = useState(saved?.editToken ?? '');
  const [lookup, setLookup] = useState(Boolean(saved?.id && saved?.editToken));
  const [lookupError, setLookupError] = useState<string | null>(null);
  const query = useGetEstablishmentApplication(id, { token }, { query: { enabled: lookup && Boolean(id && token), queryKey: getGetEstablishmentApplicationQueryKey(id, { token }) } });
  const application = query.data;
  const submitLookup = (event: FormEvent) => {
    event.preventDefault();
    setLookupError(null);
    if (!id.trim() || token.trim().length < 32) {
      setLookupError('Saisissez un identifiant et un edit token valide.');
      return;
    }
    setLookup(true);
  };
  useEffect(() => {
    if (query.isError) setLookupError(getErrorMessage(query.error, 'Impossible de retrouver cette demande. Vérifiez vos informations.'));
  }, [query.isError, query.error]);

  return (
    <PublicFrame>
      <PublicHeader eyebrow="Suivi de demande" title="Retrouver votre dossier." description="Utilisez l’identifiant de la demande et l’edit token reçus lors de la soumission. Ces informations restent stockées dans votre navigateur." />
      <div className="mx-auto mt-10 max-w-4xl">
        <form onSubmit={submitLookup} className="rounded-2xl border border-border/80 bg-card p-5 sm:p-7">
          <div className="grid gap-5 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
            <Field label="Identifiant de la demande" name="officialName" value={id} onChange={(_, value) => setId(value)} placeholder="Identifiant" />
            <Field label="Edit token" name="officialEmail" value={token} onChange={(_, value) => setToken(value)} placeholder="Token reçu après l’envoi" />
            <button type="submit" className="inline-flex h-[46px] items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground" data-testid="button-search-application"><Search className="size-4" /> Rechercher</button>
          </div>
          {lookupError ? <div className="mt-5"><ErrorNotice>{lookupError}</ErrorNotice></div> : null}
        </form>
        {lookup && query.isLoading ? <div className="mt-6 rounded-2xl border border-border/80 bg-card p-7"><div className="h-5 w-40 animate-pulse rounded bg-muted" /><div className="mt-5 h-24 animate-pulse rounded-xl bg-muted" /></div> : null}
        {lookup && !query.isLoading && !query.isError && application ? (
          <div className="mt-6">
            <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Référence {application.reference}</p><h2 className="mt-1 text-2xl font-semibold">{application.officialName}</h2><p className="mt-1 text-sm text-muted-foreground">Dernière mise à jour : {new Date(application.updatedAt).toLocaleDateString('fr-FR')}</p></div>
                <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-bold ${statusClass(application.status)}`} data-testid="status-registration">{statusLabel(application.status)}</span>
              </div>
              {application.status === 'REJECTED' ? (
                <>
                  <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-destructive">Motif du refus</p><p className="mt-2 text-sm leading-6 text-foreground">{application.rejectionReason || 'Aucun motif détaillé n’a été communiqué.'}</p></div>
                  <EditableApplicationForm initial={application} token={token} onComplete={(result) => { setLookupError(null); window.localStorage.setItem(SUBMISSION_KEY, JSON.stringify({ id: result.id, reference: result.reference, editToken: token, email: result.officialEmail })); window.location.reload(); }} />
                </>
              ) : (
                <div className="mt-7 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-background p-4"><span className="text-xs text-muted-foreground">Établissement</span><strong className="mt-1 block text-sm">{application.city}, {application.province}</strong></div>
                  <div className="rounded-xl bg-background p-4"><span className="text-xs text-muted-foreground">Année scolaire</span><strong className="mt-1 block text-sm">{application.schoolYear}</strong></div>
                  <div className="rounded-xl bg-background p-4"><span className="text-xs text-muted-foreground">Responsable</span><strong className="mt-1 block text-sm">{application.principalFirstName} {application.principalLastName}</strong></div>
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </PublicFrame>
  );
}