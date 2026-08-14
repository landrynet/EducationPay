import { Link, useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, CircleCheck, Sparkles } from 'lucide-react';
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

export function PlaceholderPage() {
  const [location] = useLocation();
  const names: Record<string, { title: string; description: string }> = {
    '/app/establishment': { title: 'Établissement', description: 'Les repères de votre structure seront rassemblés dans cet espace.' },
    '/app/team': { title: 'Équipe', description: 'Cet espace accueillera les repères de votre équipe, quand vous serez prêt.' },
    '/app/resources': { title: 'Ressources', description: 'Un endroit simple pour retrouver les ressources utiles à votre établissement.' },
    '/app/calendar': { title: 'Calendrier', description: 'Les prochaines dates importantes trouveront naturellement leur place ici.' },
    '/app/settings': { title: 'Paramètres', description: 'Les réglages de votre espace seront disponibles dans une prochaine étape.' },
    '/app/help': { title: 'Aide', description: 'Nous préparons un accompagnement clair pour chaque étape de votre installation.' },
  };
  const page = names[location] ?? names['/app/help'];
  return <AppShell><div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10"><PageHeader eyebrow="Espace EducPAY" title={page.title} description={page.description} /><div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-8"><EmptyState title="Cet espace se prépare" description="Aucune donnée n’est disponible à ce stade. Votre environnement EducPAY évoluera ici, sans informations fictives." /></div></div></AppShell>;
}