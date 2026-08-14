import { Link, useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleCheck,
  GraduationCap,
  Mail,
  MapPinned,
  Phone,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { EmptyState, ErrorState, LoadingState, StatCard } from '@/components/dashboard-states';
import { PageHeader } from '@/components/page-header';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';

export function DashboardPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <PageHeader
          eyebrow="Votre espace EducPAY"
          title="Bonjour, bienvenue."
          description="Une vue calme pour poser les bases de votre espace de gestion scolaire. Rien n’est renseigné pour l’instant."
          actions={<Link href="/app/help" data-testid="link-dashboard-help" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><Sparkles className="size-4" /> Préparer mon espace</Link>}
        />
        <section aria-labelledby="overview-title">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="overview-title" className="text-sm font-semibold text-foreground">Repères essentiels</h2>
            <span className="text-xs text-muted-foreground">En attente de configuration</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Établissement" note="Votre structure apparaîtra ici" tone="mint" />
            <StatCard label="Équipe" note="Les membres seront visibles ici" tone="sand" />
            <StatCard label="Ressources" note="Vos documents seront regroupés ici" tone="blue" />
            <StatCard label="Prochaines dates" note="Les échéances apparaîtront ici" tone="rose" />
          </div>
        </section>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6" aria-labelledby="activity-title">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">À suivre</p>
                <h2 id="activity-title" className="mt-1 text-lg font-semibold">Votre activité récente</h2>
              </div>
              <CircleCheck className="size-5 text-primary/60" />
            </div>
            <EmptyState title="Votre fil est encore vide" description="Les repères de votre établissement prendront place ici au fil de votre préparation." />
          </section>
          <section className="rounded-2xl border border-border/80 bg-[hsl(var(--sidebar))] p-5 text-sidebar-foreground sm:p-6" aria-labelledby="next-title">
            <div className="flex items-start justify-between">
              <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sidebar-primary">Prochaine étape</p><h2 id="next-title" className="mt-1 text-lg font-semibold">Faire connaissance</h2></div>
              <CalendarDays className="size-5 text-sidebar-primary" />
            </div>
            <p className="mt-9 text-sm leading-6 text-sidebar-foreground/65">Découvrez la structure de l’espace et préparez les premiers repères de votre établissement.</p>
            <Link href="/app/establishment" data-testid="link-next-establishment" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sidebar-primary-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">Explorer l’espace <ArrowRight className="size-4" /></Link>
          </section>
        </div>
        <section className="mt-6 grid gap-6 lg:grid-cols-2" aria-label="États de l’interface">
          <div className="rounded-2xl border border-border/80 bg-card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold">Chargement</h2><span className="text-xs text-muted-foreground">Aperçu</span></div><LoadingState /></div>
          <div className="rounded-2xl border border-border/80 bg-card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold">En cas d’incident</h2><span className="text-xs text-muted-foreground">Aperçu</span></div><ErrorState /></div>
        </section>
      </div>
    </AppShell>
  );
}

export function DirectorDashboardPage() {
  const { user, profile } = useAuth();
  const [establishment, setEstablishment] = useState<{ official_name: string; code: string; city: string; province: string; school_year: string; status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!profile?.establishment_id) {
      setLoading(false);
      return;
    }
    void supabase
      .from('establishments')
      .select('official_name, code, city, province, school_year, status')
      .eq('id', profile.establishment_id)
      .single()
      .then(({ data }) => {
        if (!active) return;
        setEstablishment(data);
        setError(!data);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [profile?.establishment_id]);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <PageHeader
          eyebrow="Votre établissement"
          title={`Bonjour${user?.user_metadata?.first_name ? `, ${user.user_metadata.first_name}` : ''}.`}
          description="Votre espace est prêt. Les informations affichées sont limitées à votre établissement."
        />
        {loading ? <div className="mt-6"><LoadingState /></div> : null}
        {!loading && error ? <div className="mt-6"><ErrorState /></div> : null}
        {!loading && !error && establishment ? (
          <>
            <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_8px_24px_-20px_hsl(var(--foreground)/.28)] sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Établissement actif</p>
                  <h2 className="mt-1 text-2xl font-semibold">{establishment.official_name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{establishment.city}, {establishment.province} · Année scolaire {establishment.school_year}</p>
                </div>
                <span className="inline-flex w-fit rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">Validé</span>
              </div>
              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-background p-4"><span className="text-xs text-muted-foreground">Code établissement</span><strong className="mt-1 block font-mono text-sm">{establishment.code}</strong></div>
                <div className="rounded-xl bg-background p-4"><span className="text-xs text-muted-foreground">Accès</span><strong className="mt-1 block text-sm">Responsable principal</strong></div>
                <div className="rounded-xl bg-background p-4"><span className="text-xs text-muted-foreground">Sécurité</span><strong className="mt-1 block text-sm">Données isolées</strong></div>
              </div>
            </section>
            <section className="mt-6 rounded-2xl border border-border/80 bg-card p-5 sm:p-7">
              <div className="mb-5 flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Prochaine étape</p><h2 className="mt-1 text-lg font-semibold">Préparer votre espace</h2></div><CalendarDays className="size-5 text-primary/70" /></div>
              <EmptyState title="Votre espace métier va prendre forme ici" description="Les prochaines étapes de configuration seront disponibles dans les phases suivantes." />
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

export function EstablishmentOverviewPage() {
  const { profile } = useAuth();
  const [establishment, setEstablishment] = useState<{
    official_name: string;
    code: string;
    establishment_type: string;
    address: string;
    city: string;
    province: string;
    phone: string;
    official_email: string;
    status: string;
    school_year: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!profile?.establishment_id) {
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const { data, error: queryError } = await supabase
          .from('establishments')
          .select('official_name, code, establishment_type, address, city, province, phone, official_email, status, school_year')
          .eq('id', profile.establishment_id)
          .single();

        if (!active) return;
        setEstablishment(data);
        setError(Boolean(queryError || !data));
      } catch {
        if (!active) return;
        setError(true);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [profile?.establishment_id]);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <PageHeader
          eyebrow="Établissement"
          title="Informations de l’établissement"
          description="Une vue claire des repères essentiels de votre structure et de son état de préparation."
          actions={
            <Link href="/app/school-years" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
              <GraduationCap className="size-4" /> Gérer l’année scolaire
            </Link>
          }
        />

        {loading ? <div className="mt-6"><LoadingState /></div> : null}
        {!loading && error ? <div className="mt-6"><ErrorState /></div> : null}

        {!loading && !error && establishment ? (
          <>
            <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_8px_24px_-20px_hsl(var(--foreground)/.28)] sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Structure active</p>
                  <h2 className="mt-1 text-2xl font-semibold">{establishment.official_name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{establishment.city}, {establishment.province} · {establishment.establishment_type}</p>
                </div>
                <span className="inline-flex w-fit rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                  {establishment.status === 'ACTIVE' ? 'Actif' : establishment.status}
                </span>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <InfoCard icon={<Building2 className="size-4" />} label="Code" value={establishment.code} />
                <InfoCard icon={<CalendarDays className="size-4" />} label="Année scolaire" value={establishment.school_year} />
                <InfoCard icon={<Phone className="size-4" />} label="Téléphone" value={establishment.phone} />
                <InfoCard icon={<Mail className="size-4" />} label="Contact" value={establishment.official_email} />
              </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
              <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <MapPinned className="size-5 text-primary" />
                  <h3 className="text-lg font-semibold">Coordonnées</h3>
                </div>
                <dl className="space-y-4">
                  <DetailRow label="Adresse" value={establishment.address} />
                  <DetailRow label="Ville" value={establishment.city} />
                  <DetailRow label="Province" value={establishment.province} />
                  <DetailRow label="Type d’établissement" value={establishment.establishment_type} />
                </dl>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <ShieldCheck className="size-5 text-primary" />
                  <h3 className="text-lg font-semibold">Sécurité et validation</h3>
                </div>
                <div className="space-y-4">
                  <StatusBlock title="État du compte" value={establishment.status === 'ACTIVE' ? 'Compte validé' : 'Validation en attente'} />
                  <StatusBlock title="Accès" value="Données isolées par établissement" />
                  <StatusBlock title="Protection" value="Rôles et accès limité à l’établissement" />
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

export function AcademicConfigurationPage() {
  const schoolYears = [
    { name: '2025-2026', status: 'Clôturée', start: '01/09/2025', end: '30/06/2026' },
    { name: '2026-2027', status: 'Active', start: '01/09/2026', end: '30/06/2027' },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <PageHeader
          eyebrow="Année scolaire"
          title="Configuration académique"
          description="Le calendrier et la structure de l’année scolaire restent alignés sur l’établissement actif."
        />

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Année active" note="2026-2027" tone="mint" />
          <StatCard label="Période" note="01/09/2026 → 30/06/2027" tone="blue" />
          <StatCard label="Statut" note="Ouverte" tone="sand" />
        </section>

        <section className="mt-6 rounded-2xl border border-border/80 bg-card p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Historique des années</h2>
            <button type="button" className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted">
              Ajouter une année
            </button>
          </div>
          <div className="space-y-3">
            {schoolYears.map((year) => (
              <div key={year.name} className="flex flex-col gap-3 rounded-xl border border-border/80 bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="font-semibold">{year.name}</strong>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${year.status === 'Active' ? 'border-primary/25 bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground'}`}>
                      {year.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{year.start} → {year.end}</p>
                </div>
                <button type="button" className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted">
                  Voir détails
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export function TutorsPage() {
  const tutors = [
    { name: 'Sophie Martin', role: 'Directrice', email: 'sophie@lycee-renaissance.fr', status: 'Actif' },
    { name: 'Yves Dubois', role: 'Gestionnaire', email: 'yves@lycee-renaissance.fr', status: 'Actif' },
    { name: 'Clara N’Doye', role: 'Référente administrative', email: 'clara@lycee-renaissance.fr', status: 'En attente' },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <PageHeader
          eyebrow="Tuteurs"
          title="Contacts et référents"
          description="Les personnes clés de l’établissement restent visibles et séparées selon leur rôle et leur statut."
        />

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Directeur" note="1 personne" tone="mint" />
          <StatCard label="Gestion" note="2 personnes" tone="blue" />
          <StatCard label="Actifs" note="2 / 3" tone="sand" />
        </section>

        <section className="mt-6 rounded-2xl border border-border/80 bg-card p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Liste des référents</h2>
            <button type="button" className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted">
              Ajouter un contact
            </button>
          </div>
          <div className="grid gap-3">
            {tutors.map((tutor) => (
              <div key={tutor.email} className="flex flex-col gap-3 rounded-xl border border-border/80 bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <strong className="block text-sm font-semibold">{tutor.name}</strong>
                  <p className="mt-1 text-sm text-muted-foreground">{tutor.role}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{tutor.email}</p>
                </div>
                <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${tutor.status === 'Actif' ? 'border-primary/25 bg-primary/10 text-primary' : 'border-amber-400/30 bg-amber-100 text-amber-700'}`}>
                  {tutor.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export function SettingsPage() {
  const options = [
    { title: 'Notifications', description: 'Recevoir les alertes de validation et de sécurité.', enabled: true },
    { title: 'Accès aux documents', description: 'Partager les ressources internes aux référents de l’établissement.', enabled: true },
    { title: 'Rappels de rentrée', description: 'Envoyer les relances avant la date clé.', enabled: false },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <PageHeader
          eyebrow="Paramètres"
          title="Préférences de l’espace"
          description="Les réglages de base de votre établissement restent lisibles et faciles à ajuster."
        />

        <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <Settings2 className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Configuration</h2>
          </div>
          <div className="space-y-4">
            {options.map((option) => (
              <div key={option.title} className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-background p-4">
                <div>
                  <strong className="block text-sm font-semibold">{option.title}</strong>
                  <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                </div>
                <button type="button" className={`rounded-full border px-3 py-1.5 text-xs font-bold ${option.enabled ? 'border-primary/25 bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground'}`}>
                  {option.enabled ? 'Activé' : 'Désactivé'}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export function PlaceholderPage() {
  const [location] = useLocation();
  const names: Record<string, { title: string; description: string }> = {
    '/app/establishment': { title: 'Établissement', description: 'Les repères de votre structure seront rassemblés dans cet espace.' },
    '/app/team': { title: 'Tuteurs', description: 'Cet espace reprend les contacts et référents de votre établissement.' },
    '/app/resources': { title: 'Ressources', description: 'Un endroit simple pour retrouver les ressources utiles à votre établissement.' },
    '/app/calendar': { title: 'Calendrier', description: 'Les prochaines dates importantes trouveront naturellement leur place ici.' },
    '/app/settings': { title: 'Paramètres', description: 'Les réglages de votre espace sont désormais visibles.' },
    '/app/help': { title: 'Aide', description: 'Nous préparons un accompagnement clair pour chaque étape de votre installation.' },
  };
  const page = names[location] ?? names['/app/help'];
  return <AppShell><div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10"><PageHeader eyebrow="Espace EducPAY" title={page.title} description={page.description} /><div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-8"><EmptyState title="Cet espace se prépare" description="Aucune donnée n’est disponible à ce stade. Votre environnement EducPAY évoluera ici, sans informations fictives." /></div></div></AppShell>;
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background p-4">
      <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
      <span className="block text-xs text-muted-foreground">{label}</span>
      <strong className="mt-1 block text-sm leading-5">{value || '—'}</strong>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value || '—'}</dd>
    </div>
  );
}

function StatusBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <strong className="mt-1 block text-sm text-foreground">{value}</strong>
        </div>
        <CheckCircle2 className="size-4 text-primary" />
      </div>
    </div>
  );
}