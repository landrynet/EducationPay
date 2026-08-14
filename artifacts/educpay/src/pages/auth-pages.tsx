import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  MailCheck,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { getSupabaseConfigError, supabase, withSupabaseTimeout } from '@/lib/supabase';
import { useActivateEstablishmentApplication } from '@workspace/api-client-react';

const authVisual = `${import.meta.env.BASE_URL}images/educpay-auth-visual-alt.jpg`;

function BrandLogo() {
  return (
    <Link href="/" className="auth-brand" aria-label="EducPAY, accueil">
      <span className="auth-brand-mark" aria-hidden="true">
        e
      </span>
      <span>EducPAY</span>
    </Link>
  );
}

function AuthShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="auth-page">
      <div className="auth-page-glow auth-page-glow-one" aria-hidden="true" />
      <div className="auth-page-glow auth-page-glow-two" aria-hidden="true" />
      <div className="auth-frame">
        <div className="auth-layout">
          <section className="auth-card">
            <div className="auth-card-brand">
              <BrandLogo />
            </div>
            <div className="auth-form-area">{children}</div>
            <aside className="auth-visual" aria-label="L'équipe éducative au cœur d'EducPAY">
              <img src={authVisual} alt="Une équipe échange autour d'un projet d'établissement" />
              <div className="auth-visual-shade" />
              <div className="auth-visual-content">
                <span className="auth-visual-kicker">L’école, en confiance</span>
                <strong>Des repères partagés pour avancer sereinement.</strong>
                <span className="auth-visual-pulse">
                  <span className="auth-pulse-dot" />
                  EducPAY accompagne votre quotidien
                </span>
              </div>
            </aside>
          </section>
        </div>

        <footer className="auth-footer">
          <span>EducPAY · La clarté au service de l’école</span>
          <span>Accès sécurisé · Données protégées par Supabase</span>
        </footer>
      </div>
    </main>
  );
}

function AuthHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="auth-heading">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function Field({
  label,
  type = 'text',
  placeholder,
  autoComplete,
  name,
}: {
  label: string;
  type?: string;
  placeholder: string;
  autoComplete?: string;
  name?: string;
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && visible ? 'text' : type;

  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="auth-input-wrap">
        <input
          required
          name={name}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        {isPassword ? (
          <button
            type="button"
            className="auth-input-action"
            aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : null}
      </span>
    </label>
  );
}

function AuthSubmit({ children, loading = false }: { children: ReactNode; loading?: boolean }) {
  return (
    <button type="submit" className="auth-submit" disabled={loading}>
      <span>{children}</span>
      {!loading ? <ArrowRight className="size-4" /> : <span className="auth-spinner" aria-hidden="true" />}
    </button>
  );
}

function PreviewNotice({ children }: { children: ReactNode }) {
  return (
    <div className="auth-notice">
      <CheckCircle2 className="size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

export function AuthLoginPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const configError = getSupabaseConfigError();
      if (configError) {
        setErrorMessage(configError);
        return;
      }

      const form = new FormData(event.currentTarget);
      const email = String(form.get('email') ?? '');
      const password = String(form.get('password') ?? '');

      const { data, error } = await withSupabaseTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        'Supabase ne répond pas. Vérifiez les variables VITE_SUPABASE_* et la connexion réseau, puis réessayez.',
      );

      if (error) {
        setErrorMessage(error.message || 'Erreur lors de la connexion');
        setLoading(false);
        return;
      }

      const user = data.user;

      if (!user) {
        setErrorMessage('Impossible de récupérer l’utilisateur après connexion.');
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await withSupabaseTimeout(
        supabase
          .from('profiles')
          .select('role,must_change_password,is_active,establishment_id')
          .eq('id', user.id)
          .single(),
        'Connexion réussie, mais Supabase ne répond pas pour le profil. Vérifiez la table profiles et ses règles RLS.',
      );

      if (profileError) {
        console.warn('No profile row found or error reading profile:', profileError.message);
        setErrorMessage(
          'Connexion réussie, mais votre profil EducPAY est introuvable ou inaccessible. Vérifiez la table profiles, la ligne correspondant à cet utilisateur et ses règles RLS.',
        );
        return;
      }

      if (profile?.must_change_password) {
        setLocation('/auth/first-login');
        return;
      }

      if (profile?.role && !['SUPER_ADMIN', 'DIRECTOR', 'ESTABLISHMENT_ADMIN', 'ACCOUNTANT', 'TUTOR', 'PARENT'].includes(profile.role)) {
        setErrorMessage('Vous n’êtes pas autorisé à accéder à cet espace.');
        setLoading(false);
        return;
      }

      let isApprovedDirectorApplication = false;
      if ((profile?.role === 'DIRECTOR' || profile?.role === 'ESTABLISHMENT_ADMIN') && profile.establishment_id) {
        const { data: applicationStatus, error: applicationStatusError } = await withSupabaseTimeout(
          supabase
            .from('establishment_applications')
            .select('status, responsible_account_status')
            .eq('responsible_user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          'Le statut de votre établissement n’a pas pu être vérifié.',
        );

        if (applicationStatusError) {
          console.warn('Unable to read application status for director login:', applicationStatusError.message);
          setErrorMessage('Le statut de votre établissement n’a pas pu être vérifié.');
          setLoading(false);
          return;
        }

        isApprovedDirectorApplication = applicationStatus?.status === 'APPROVED' && applicationStatus?.responsible_account_status === 'ACTIVE';

        if (!isApprovedDirectorApplication) {
          setErrorMessage('Votre établissement est encore en attente de validation ou a été refusé.');
          setLoading(false);
          return;
        }
      }

      if (profile?.is_active === false && !isApprovedDirectorApplication) {
        setErrorMessage('Ce compte est désactivé ou votre établissement n’est pas encore validé.');
        setLoading(false);
        return;
      }

      // Success — navigate to the appropriate dashboard based on role
      if (profile?.role === 'SUPER_ADMIN') {
        setLocation('/super-admin');
      } else {
        setLocation('/app');
      }
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <AuthHeading title="Bon retour parmi nous" description="Entrez vos identifiants pour accéder à votre espace EducPAY." />
      <form className="auth-form" onSubmit={handleSubmit}>
        <Field label="Adresse email" name="email" type="email" placeholder="vous@etablissement.fr" autoComplete="email" />
        <Field label="Mot de passe" name="password" type="password" placeholder="Votre mot de passe" autoComplete="current-password" />
        <div className="auth-form-meta">
          <span className="auth-secure-label">
            <LockKeyhole className="size-3.5" />
            Connexion protégée
          </span>
          <Link href="/auth/forgot-password" className="auth-inline-link">
            Mot de passe oublié ?
          </Link>
        </div>
        <AuthSubmit loading={loading}>{loading ? 'Ouverture de votre espace…' : 'Se connecter'}</AuthSubmit>
      </form>
    
      <p className="auth-switch">
        Vous n’avez pas encore d’accès ?{' '}
        <Link href="/auth/register" className="auth-inline-link">
          Enregistrez votre etabilsement
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthRegisterPage() {
  return (
    <AuthShell>
      <AuthHeading title="Demander un accès" description="L’accès Responsable est créé après la validation de votre établissement par EducPAY." />
      <div className="auth-success-state">
        <span className="auth-success-icon"><CheckCircle2 className="size-6" /></span>
        <PreviewNotice>Commencez par déposer les informations de votre établissement. Aucun mot de passe n’est demandé pendant cette étape.</PreviewNotice>
        <Link href="/register-establishment" className="auth-submit"><span>Déposer une demande</span><ArrowRight className="size-4" /></Link>
      </div>
      <p className="auth-switch">
        Vous avez déjà un accès ?{' '}
        <Link href="/auth/login" className="auth-inline-link">
          Se connecter
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthActivationPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [applicationId] = useState(() => new URLSearchParams(window.location.search).get('application') ?? '');
  const activate = useActivateEstablishmentApplication();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const form = new FormData(event.currentTarget);
      const password = String(form.get('password') ?? '');
      const confirmation = String(form.get('password-confirmation') ?? '');
      if (password.length < 8 || password !== confirmation) {
        setError('Les mots de passe doivent être identiques et contenir au moins 8 caractères.');
        return;
      }
      const { data: sessionData } = await withSupabaseTimeout(
        supabase.auth.getSession(),
        'Le lien d’activation n’est plus disponible. Demandez un nouveau lien.',
      );
      if (!sessionData.session?.user) {
        setError('Ce lien doit être ouvert depuis l’email d’activation.');
        return;
      }
      const { error: passwordError } = await withSupabaseTimeout(
        supabase.auth.updateUser({ password }),
        'Supabase ne répond pas pendant l’activation.',
      );
      if (passwordError) {
        setError('Le mot de passe n’a pas pu être enregistré. Le lien est peut-être expiré.');
        return;
      }
      if (!applicationId) {
        setError('La demande associée à ce lien est introuvable.');
        return;
      }
      await activate.mutateAsync({ id: applicationId });
      setComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Le compte n’a pas pu être activé.');
    } finally {
      setLoading(false);
    }
  }

  if (complete) {
    return (
      <AuthShell>
        <div className="auth-success-state">
          <span className="auth-success-icon"><CheckCircle2 className="size-6" /></span>
          <AuthHeading title="Compte activé" description="Votre accès Responsable est prêt. Vous pouvez maintenant rejoindre votre espace EducPAY." />
          <Link href="/auth/login" className="auth-submit"><span>Se connecter</span><ArrowRight className="size-4" /></Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthHeading title="Activer votre compte" description="Choisissez le mot de passe qui protégera votre accès Responsable." />
      <form className="auth-form" onSubmit={handleSubmit}>
        <Field label="Nouveau mot de passe" name="password" type="password" placeholder="8 caractères minimum" autoComplete="new-password" />
        <Field label="Confirmer le mot de passe" name="password-confirmation" type="password" placeholder="Répétez le mot de passe" autoComplete="new-password" />
        <AuthSubmit loading={loading}>{loading ? 'Activation en cours…' : 'Activer mon compte'}</AuthSubmit>
      </form>
      {error ? <div className="auth-notice" role="alert">{error}</div> : null}
      <p className="auth-switch"><Link href="/auth/login" className="auth-inline-link">Retour à la connexion</Link></p>
    </AuthShell>
  );
}

export function AuthForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');

    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/auth/reset-password`;

    supabase.auth
      .resetPasswordForEmail(email, { redirectTo })
      .then(({ error }) => {
        if (error) setError('Impossible d’envoyer le lien de récupération.');
        else setSent(true);
      })
      .catch(() => setError('Erreur lors de la demande.'))
      .finally(() => setLoading(false));
  }

  return (
    <AuthShell>
      {sent ? (
        <div className="auth-success-state">
          <span className="auth-success-icon">
            <MailCheck className="size-6" />
          </span>
          <AuthHeading title="Vérifiez votre boîte mail" description="Le lien de récupération a été envoyé si l’adresse existe." />
          <PreviewNotice>Un email de récupération a été demandé. Si vous ne recevez rien, vérifiez vos dossiers indésirables.</PreviewNotice>
          <Link href="/auth/reset-password" className="auth-submit">
            <span>Ouvrir la réinitialisation</span>
            <ArrowRight className="size-4" />
          </Link>
          <button type="button" className="auth-secondary-action" onClick={() => setSent(false)}>
            Utiliser une autre adresse
          </button>
        </div>
      ) : (
        <>
          <AuthHeading title="Mot de passe oublié ?" description="Nous vous indiquerons comment créer un nouveau mot de passe." />
          <form className="auth-form" onSubmit={handleSubmit}>
            <Field label="Adresse email" name="email" type="email" placeholder="vous@etablissement.fr" autoComplete="email" />
            <AuthSubmit>Envoyer le lien</AuthSubmit>
          </form>
        </>
      )}
      <p className="auth-switch">
        <Link href="/auth/login" className="auth-inline-link auth-back-inline">
          <ArrowLeft className="size-4" />
          Retour à la connexion
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthResetPasswordPage() {
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const form = new FormData(event.currentTarget);
      const password = String(form.get('password') ?? '');
      const passwordConfirmation = String(form.get('password-confirmation') ?? '');
      if (!password || password.length < 8 || password !== passwordConfirmation) {
        setError('Les mots de passe doivent être identiques et contenir au moins 8 caractères.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError('Impossible de définir le nouveau mot de passe.');
        setLoading(false);
        return;
      }

      // On suppose que Supabase a déjà géré la session via le lien de récupération.
      setLocation('/auth/login');
    } catch (err: any) {
      setError(err?.message ?? 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <AuthHeading title="Réinitialiser le mot de passe" description="Votre nouveau mot de passe doit comporter au moins 8 caractères." />
      <form className="auth-form" onSubmit={handleSubmit}>
        <Field label="Nouveau mot de passe" name="password" type="password" placeholder="Votre nouveau mot de passe" autoComplete="new-password" />
        <Field label="Confirmer le mot de passe" name="password-confirmation" type="password" placeholder="Répétez votre mot de passe" autoComplete="new-password" />
        <AuthSubmit>Enregistrer et revenir à la connexion</AuthSubmit>
      </form>
      <PreviewNotice>Mode aperçu : votre mot de passe est simulé et n’est pas enregistré.</PreviewNotice>
    </AuthShell>
  );
}

export function AuthFirstLoginPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const form = new FormData(event.currentTarget);
      const password = String(form.get('password') ?? '');
      const passwordConfirmation = String(form.get('password-confirmation') ?? '');
      if (!password || password.length < 8 || password !== passwordConfirmation) {
        setError('Les mots de passe doivent être identiques et contenir au moins 8 caractères.');
        setLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user ?? null;
      if (!user) {
        setError('Session introuvable. Connectez-vous puis réessayez.');
        setLoading(false);
        return;
      }

      const { error: pwdError } = await supabase.auth.updateUser({ password });
      if (pwdError) {
        setError('Impossible de mettre à jour le mot de passe.');
        setLoading(false);
        return;
      }

      // Update profile to clear must_change_password flag
      await supabase.from('profiles').update({ must_change_password: false }).eq('id', user.id);

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (profile?.role === 'SUPER_ADMIN') {
        setLocation('/super-admin');
      } else {
        setLocation('/app');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <AuthHeading title="Première connexion" description="Choisissez un nouveau mot de passe pour sécuriser votre accès." />
      <form className="auth-form" onSubmit={handleSubmit}>
        <Field label="Nouveau mot de passe" name="password" type="password" placeholder="Votre nouveau mot de passe" autoComplete="new-password" />
        <Field label="Confirmer le mot de passe" name="password-confirmation" type="password" placeholder="Répétez votre mot de passe" autoComplete="new-password" />
        <AuthSubmit loading={loading}>Enregistrer et continuer</AuthSubmit>
      </form>
      {error ? <div className="auth-notice">{error}</div> : null}
      <p className="auth-switch">
        <Link href="/auth/login" className="auth-inline-link">
          Revenir à la connexion
        </Link>
      </p>
    </AuthShell>
  );
}