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
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : status === 'REJECTED'
      ? 'border-red-200 bg-red-50 text-red-700'
      : status === 'SUSPENDED'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-sky-200 bg-sky-50 text-sky-700';
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
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10 lg:py-8">
        <PageHeader
          eyebrow="Espace Super Admin"
          title="Demandes d’établissement"
          description="Consultez, vérifiez et traitez les demandes sans quitter votre espace EducPAY."
        />

        <div className="mt-6 rounded-2xl border border-border/80 bg-gradient-to-r from-background via-card to-secondary/30 p-3.5 shadow-[0_12px_30px_-24px_hsl(var(--foreground)/.2)]">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrer les demandes">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setFilter(item.value);
                  setSelectedId(null);
                }}
                className={`rounded-full border px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                  filter === item.value
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'border-border bg-card/80 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
                aria-selected={filter === item.value}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {list.isLoading ? (
          <div className="mt-6"><LoadingState /></div>
        ) : null}

        {list.isError ? (
          <div className="mt-6"><ErrorState onRetry={() => void list.refetch()} /></div>
        ) : null}

        {!list.isLoading && !list.isError && applications.length === 0 ? (
          <div className="mt-6"><EmptyState title="Aucune demande dans cette vue" description="Les nouvelles inscriptions apparaîtront ici dès leur soumission." /></div>
        ) : null}

        {!list.isLoading && !list.isError && applications.length > 0 ? (
          <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(250px,340px)_minmax(0,1fr)]">
            <section className="rounded-2xl border border-border/80 bg-card p-3 shadow-[0_12px_24px_-18px_hsl(var(--foreground)/.2)] sm:p-4" aria-label="Liste des demandes">
              <div className="mb-3 flex flex-col gap-2 px-1.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {applications.length} dossier{applications.length > 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => void list.refetch()}
                  className="inline-flex w-fit items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
                  aria-label="Actualiser la liste"
                >
                  <RotateCcw className="size-3.5" /> Actualiser
                </button>
              </div>

              <div className="grid gap-2.5">
                {applications.map((application) => (
                  <button
                    key={application.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(application.id);
                      setActionError(null);
                    }}
                    className={`w-full rounded-2xl border p-3 text-left transition-all duration-200 ${
                      selected?.id === application.id
                        ? 'border-primary/40 bg-gradient-to-r from-primary/6 to-background shadow-[0_10px_25px_-18px_hsl(var(--primary)/.6)]'
                        : 'border-border/70 bg-background/60 hover:border-primary/30 hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <strong className="max-w-[68%] truncate text-sm font-semibold text-foreground sm:max-w-[72%]">{application.officialName}</strong>
                      <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${statusClass(application.status)}`}>
                        {statusLabel(application.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{application.reference} · {application.city}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{new Date(application.createdAt).toLocaleDateString('fr-FR')}</p>
                  </button>
                ))}
              </div>
            </section>

            {selected ? (
              <section className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-background p-4 shadow-[0_12px_24px_-18px_hsl(var(--foreground)/.2)] sm:p-5 lg:p-6">
                <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{selected.reference}</p>
                    <h2 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">{selected.officialName}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Demande déposée le {new Date(selected.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  <span className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${statusClass(selected.status)}`}>
                    {statusLabel(selected.status)}
                  </span>
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

                {selected.rejectionReason ? (
                  <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-red-700">Motif du refus</p>
                    <p className="mt-2 text-sm leading-6 text-red-800">{selected.rejectionReason}</p>
                  </div>
                ) : null}

                <div className="mt-7 border-t border-border/70 pt-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Clock3 className="size-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Historique</h3>
                  </div>
                  <div className="grid gap-2">
                    {selected.history.length ? (
                      selected.history.map((entry, index) => (
                        <div key={`${entry.action}-${entry.createdAt}-${index}`} className="flex flex-col gap-1 rounded-xl border border-border/70 bg-background px-3 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between">
                          <span className="font-semibold text-foreground">{entry.action}</span>
                          <span className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString('fr-FR')}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">Aucun événement enregistré.</p>
                    )}
                  </div>
                </div>

                {selected.status === 'PENDING_REVIEW' ? (
                  <div className="mt-7 flex flex-col gap-3 border-t border-border/70 pt-6">
                    {actionError ? (
                      <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
                        {actionError}
                      </p>
                    ) : null}

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={approve.isPending || reject.isPending}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-opacity hover:opacity-95 disabled:opacity-60 sm:w-auto"
                      >
                        <Check className="size-4" />
                        {approve.isPending ? 'Validation…' : 'Valider et envoyer l’activation'}
                      </button>

                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={approve.isPending || reject.isPending}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-60 sm:w-auto"
                      >
                        <X className="size-4" /> Refuser
                      </button>
                    </div>

                    <textarea
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      placeholder="Motif obligatoire si vous refusez la demande"
                      className="min-h-[92px] w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                  </div>
                ) : null}

                {approve.isPending || reject.isPending ? (
                  <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <LoaderCircle className="size-3.5 animate-spin" /> Synchronisation en cours…
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-gradient-to-br from-background to-muted/30 p-3.5 sm:p-4">
      <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <strong className="mt-2 block text-sm leading-6 text-foreground break-words">{value || '—'}</strong>
    </div>
  );
}