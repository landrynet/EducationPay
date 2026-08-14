import { Link } from 'wouter';
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
  Server,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { EmptyState, ErrorState, LoadingState, StatCard } from '@/components/dashboard-states';
import { PageHeader } from '@/components/page-header';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';

// ============================================================
// SUPER ADMIN PAGES (Platform Administration Only)
// ============================================================

export function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<{
    totalTenants: number;
    pendingApplications: number;
    approvedTenants: number;
  }>({ totalTenants: 0, pendingApplications: 0, approvedTenants: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadPlatformStats() {
      try {
        const { data: establishments } = await supabase
          .from('establishments')
          .select('id, status');

        if (!active) return;

        const total = establishments?.length ?? 0;
        const approved = establishments?.filter((e) => e.status === 'APPROVED').length ?? 0;
        const pending = establishments?.filter((e) => e.status === 'PENDING_REVIEW').length ?? 0;

        setStats({
          totalTenants: total,
          approvedTenants: approved,
          pendingApplications: pending,
        });
      } catch (err) {
        console.warn('Super admin stats load error:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadPlatformStats();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <PageHeader
          eyebrow="Plateforme EducPAY · Super Admin"
          title="Administration de la plateforme"
          description="Supervision globale des établissements, des demandes d’adhésion et des paramètres techniques."
          actions={
            <Link
              href="/super-admin/establishments"
              data-testid="link-super-admin-applications"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Sparkles className="size-4" /> Gérer les demandes
            </Link>
          }
        />
        <section aria-labelledby="overview-title">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="overview-title" className="text-sm font-semibold text-foreground">
              Indicateurs plateforme
            </h2>
            <span className="text-xs text-muted-foreground">Périmètre SaaS EducPAY</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Établissements enregistrés"
              note={loading ? '…' : `${stats.totalTenants} structure${stats.totalTenants > 1 ? 's' : ''}`}
              tone="mint"
            />
            <StatCard
              label="Demandes en attente"
              note={loading ? '…' : `${stats.pendingApplications} dossier${stats.pendingApplications > 1 ? 's' : ''}`}
              tone="sand"
            />
            <StatCard
              label="Établissements validés"
              note={loading ? '…' : `${stats.approvedTenants} actif${stats.approvedTenants > 1 ? 's' : ''}`}
              tone="blue"
            />
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <section
            className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6"
            aria-labelledby="security-policy-title"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                  Sécurité & Isolation
                </p>
                <h2 id="security-policy-title" className="mt-1 text-lg font-semibold">
                  Périmètre strict du Super Admin
                </h2>
              </div>
              <ShieldCheck className="size-5 text-primary/60" />
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Conformément à la politique d’architecture EducPAY, le Super Admin gère exclusivement
                les comptes établissements (tenants), leur validation et les paramètres plateforme.
              </p>
              <div className="rounded-xl border border-border/70 bg-background p-4 text-xs">
                <strong className="block font-semibold text-foreground">Données protégées et inaccessibles :</strong>
                <p className="mt-1 text-muted-foreground">
                  Élèves, tuteurs, paiements, reçus, classes, notes, rapports financiers internes. Ces données
                  sont strictement isolées pour chaque établissement via Row-Level Security.
                </p>
              </div>
            </div>
          </section>

          <section
            className="rounded-2xl border border-border/80 bg-[hsl(var(--sidebar))] p-5 text-sidebar-foreground sm:p-6"
            aria-labelledby="quick-actions-title"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sidebar-primary">
                  Action prioritaire
                </p>
                <h2 id="quick-actions-title" className="mt-1 text-lg font-semibold">
                  Validation des inscriptions
                </h2>
              </div>
              <Building2 className="size-5 text-sidebar-primary" />
            </div>
            <p className="mt-6 text-sm leading-6 text-sidebar-foreground/65">
              Consultez les dossiers déposés par les directeurs et activez leur compte après vérification des repères officiels.
            </p>
            <Link
              href="/super-admin/establishments"
              data-testid="link-quick-establishments"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sidebar-primary-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              Ouvrir les dossiers <ArrowRight className="size-4" />
            </Link>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

export function SuperAdminPlatformPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <PageHeader
          eyebrow="Supervision Technique"
          title="Administration de la plateforme"
          description="État des services et métriques d’infrastructure d’EducPAY."
        />
        <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <Server className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">État des services</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-background p-4">
              <div>
                <strong className="block text-sm font-semibold">Base de données Supabase</strong>
                <p className="mt-1 text-sm text-muted-foreground">Row-Level Security actif et opérationnel.</p>
              </div>
              <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                Opérationnel
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-background p-4">
              <div>
                <strong className="block text-sm font-semibold">API Server</strong>
                <p className="mt-1 text-sm text-muted-foreground">Service de validation et d’emails.</p>
              </div>
              <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                Opérationnel
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-background p-4">
              <div>
                <strong className="block text-sm font-semibold">Isolation multi-tenant</strong>
                <p className="mt-1 text-sm text-muted-foreground">Séparation stricte plateforme / données école.</p>
              </div>
              <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                Conforme
              </span>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export function SuperAdminSettingsPage() {
  const options = [
    { title: 'Notifications de nouvelles demandes', description: 'Alerter les super administrateurs lors d’un dépôt de dossier.', enabled: true },
    { title: 'Validation automatique des emails', description: 'Vérifier la validité syntaxique des domaines scolaires.', enabled: true },
    { title: 'Journalisation d’audit', description: 'Tracer les décisions d’approbation et de refus.', enabled: true },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <PageHeader
          eyebrow="Paramètres globaux"
          title="Paramètres de la plateforme"
          description="Réglages et politiques d’administration de la plateforme EducPAY."
        />
        <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <Settings2 className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Configuration plateforme</h2>
          </div>
          <div className="space-y-4">
            {options.map((option) => (
              <div key={option.title} className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-background p-4">
                <div>
                  <strong className="block text-sm font-semibold">{option.title}</strong>
                  <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                </div>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${option.enabled ? 'border-primary/25 bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground'}`}>
                  {option.enabled ? 'Actif' : 'Inactif'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

// ============================================================
// ESTABLISHMENT ADMIN PAGES (Single Tenant Business Space Only)
// ============================================================

export function DirectorDashboardPage() {
  const { user, profile } = useAuth();
  const [establishment, setEstablishment] = useState<{
    official_name: string;
    code: string;
    city: string;
    province: string;
    school_year: string;
    status: string;
  } | null>(null);
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
          description="Votre espace est prêt. Les informations affichées sont strictement limitées à votre établissement."
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
                <div className="rounded-xl bg-background p-4"><span className="text-xs text-muted-foreground">Accès</span><strong className="mt-1 block text-sm">Administrateur d’établissement</strong></div>
                <div className="rounded-xl bg-background p-4"><span className="text-xs text-muted-foreground">Sécurité</span><strong className="mt-1 block text-sm">Données isolées (Tenant)</strong></div>
              </div>
            </section>
            <section className="mt-6 rounded-2xl border border-border/80 bg-card p-5 sm:p-7">
              <div className="mb-5 flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Prochaine étape</p><h2 className="mt-1 text-lg font-semibold">Préparer votre espace</h2></div><CalendarDays className="size-5 text-primary/70" /></div>
              <EmptyState title="Votre espace métier est prêt" description="Configurez les repères de votre établissement, vos années scolaires et vos référents." />
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
                  {establishment.status === 'APPROVED' ? 'Validé' : establishment.status}
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
                  <StatusBlock title="État du compte" value={establishment.status === 'APPROVED' ? 'Compte validé' : 'Validation en attente'} />
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