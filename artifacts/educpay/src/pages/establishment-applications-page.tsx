import {
  getListEstablishmentApplicationsQueryKey,
  useApproveEstablishmentApplication,
  useListEstablishmentApplications,
  useRejectEstablishmentApplication,
  type EstablishmentApplication,
} from '@workspace/api-client-react';
import { Check, CheckCircle2, Clock3, LoaderCircle, RotateCcw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/dashboard-states';
import { PageHeader } from '@/components/page-header';

const filters = [
  { value: '', label: 'Toutes' },
  { value: 'PENDING_REVIEW', label: 'En attente' },
  { value: 'APPROVED', label: 'Validées' },
  { value: 'REJECTED', label: 'Refusées' },
  { value: 'SUSPENDED', label: 'Suspendues' },
];

function statusLabel(status: string) {
  return { PENDING_REVIEW: 'En attente', APPROVED: 'Validée', REJECTED: 'Refusée', SUSPENDED: 'Suspendue' }[status] ?? status;
}

function statusClass(status: string) {
  return status === 'APPROVED'
    ? 'border-primary/25 bg-primary/10 text-primary'
    : status === 'REJECTED'
      ? 'border-destructive/25 bg-destructive/10 text-destructive'
      : 'border-[hsl(var(--sidebar-primary))]/35 bg-[hsl(var(--sidebar-primary))]/15 text-foreground';
}

export function EstablishmentApplicationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const list = useListEstablishmentApplications(filter ? { status: filter } : undefined);
  const approve = useApproveEstablishmentApplication();
  const reject = useRejectEstablishmentApplication();
  const applications = list.data ?? [];
  const selected = applications.find((item) => item.id === selectedId) ?? applications[0] ?? null;

  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: getListEstablishmentApplicationsQueryKey(filter ? { status: filter } : undefined) });
  };

  const handleApprove = async () => {
    if (!selected) return;
    setActionError(null);
    try {
      await approve.mutateAsync({ id: selected.id });
      refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'La validation n’a pas pu être effectuée.');
    }
  };

  const handleReject = async () => {
    if (!selected || rejectionReason.trim().length < 5) {
      setActionError('Le motif du refus est obligatoire.');
      return;
    }
    setActionError(null);
    try {
      await reject.mutateAsync({ id: selected.id, data: { reason: rejectionReason.trim() } });
      setRejectionReason('');
      refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Le refus n’a pas pu être enregistré.');
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <PageHeader eyebrow="Espace Super Admin" title="Demandes d’établissement" description="Consultez, vérifiez et traitez les demandes sans quitter votre espace EducPAY." />
        <div className="mt-7 flex flex-wrap gap-2" role="tablist" aria-label="Filtrer les demandes">
          {filters.map((item) => (
            <button key={item.value} type="button" onClick={() => { setFilter(item.value); setSelectedId(null); }} className={`rounded-full border px-3.5 py-2 text-xs font-bold transition-colors ${filter === item.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'}`} aria-selected={filter === item.value}>{item.label}</button>
          ))}
        </div>
        {list.isLoading ? <div className="mt-6"><LoadingState /></div> : null}
        {list.isError ? <div className="mt-6"><ErrorState onRetry={() => void list.refetch()} /></div> : null}
        {!list.isLoading && !list.isError && applications.length === 0 ? <div className="mt-6"><EmptyState title="Aucune demande dans cette vue" description="Les nouvelles inscriptions apparaîtront ici dès leur soumission." /></div> : null}
        {!list.isLoading && !list.isError && applications.length > 0 ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(260px,340px)_1fr]">
            <section className="rounded-2xl border border-border/80 bg-card p-3 sm:p-4" aria-label="Liste des demandes">
              <div className="mb-2 flex items-center justify-between px-2 py-1"><span className="text-xs font-bold uppercase tracking-[0.13em] text-muted-foreground">{applications.length} dossier{applications.length > 1 ? 's' : ''}</span><RotateCcw className="size-4 text-muted-foreground" /></div>
              <div className="grid gap-2">
                {applications.map((application) => (
                  <button key={application.id} type="button" onClick={() => { setSelectedId(application.id); setActionError(null); }} className={`w-full rounded-xl border p-4 text-left transition-colors ${selected?.id === application.id ? 'border-primary/45 bg-primary/5' : 'border-border/70 hover:border-primary/30 hover:bg-muted/40'}`}>
                    <div className="flex items-start justify-between gap-3"><strong className="truncate text-sm">{application.officialName}</strong><span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${statusClass(application.status)}`}>{statusLabel(application.status)}</span></div>
                    <p className="mt-2 text-xs text-muted-foreground">{application.reference} · {application.city}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(application.createdAt).toLocaleDateString('fr-FR')}</p>
                  </button>
                ))}
              </div>
            </section>
            {selected ? (
              <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-7">
                <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{selected.reference}</p><h2 className="mt-1 text-2xl font-semibold">{selected.officialName}</h2><p className="mt-1 text-sm text-muted-foreground">Demande déposée le {new Date(selected.createdAt).toLocaleDateString('fr-FR')}</p></div>
                  <span className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${statusClass(selected.status)}`}>{statusLabel(selected.status)}</span>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Info label="Type" value={selected.establishmentType} />
                  <Info label="Code établissement" value={selected.establishmentCode} />
                  <Info label="Adresse" value={`${selected.address}, ${selected.city}, ${selected.province}`} />
                  <Info label="Contact officiel" value={`${selected.officialEmail} · ${selected.phone}`} />
                  <Info label="Responsable principal" value={`${selected.principalFirstName} ${selected.principalLastName} · ${selected.principalFunction}`} />
                  <Info label="Contact responsable" value={`${selected.principalEmail} · ${selected.principalPhone}`} />
                  <Info label="Configuration initiale" value={`${selected.levels.join(', ')} · ${selected.schoolYear}`} />
                  <Info label="Compte responsable" value={selected.responsibleAccountStatus === 'ACTIVE' ? 'Actif' : 'En attente d’activation'} />
                </div>
                {selected.rejectionReason ? <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-destructive">Motif du refus</p><p className="mt-2 text-sm leading-6">{selected.rejectionReason}</p></div> : null}
                <div className="mt-7 border-t border-border/70 pt-6">
                  <div className="mb-3 flex items-center gap-2"><Clock3 className="size-4 text-primary" /><h3 className="text-sm font-semibold">Historique</h3></div>
                  <div className="grid gap-2">{selected.history.length ? selected.history.map((entry, index) => <div key={`${entry.action}-${entry.createdAt}-${index}`} className="flex items-center justify-between gap-4 rounded-lg bg-background px-3 py-2 text-xs"><span className="font-semibold">{entry.action}</span><span className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString('fr-FR')}</span></div>) : <p className="text-xs text-muted-foreground">Aucun événement enregistré.</p>}</div>
                </div>
                {selected.status === 'PENDING_REVIEW' ? (
                  <div className="mt-7 flex flex-col gap-3 border-t border-border/70 pt-6">
                    {actionError ? <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">{actionError}</p> : null}
                    <div className="flex flex-col gap-3 sm:flex-row"><button type="button" onClick={handleApprove} disabled={approve.isPending || reject.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"><Check className="size-4" />{approve.isPending ? 'Validation…' : 'Valider et envoyer l’activation'}</button><button type="button" onClick={handleReject} disabled={approve.isPending || reject.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/30 px-5 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/5 disabled:opacity-60"><X className="size-4" /> Refuser</button></div>
                    <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Motif obligatoire si vous refusez la demande" className="min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </div>
                ) : null}
                {approve.isPending || reject.isPending ? <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin" /> Synchronisation en cours…</div> : null}
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-background p-4"><span className="text-xs text-muted-foreground">{label}</span><strong className="mt-1 block text-sm leading-5">{value || '—'}</strong></div>;
}