import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

export type EstablishmentLevel = 'PRIMARY' | 'SECONDARY' | 'PRIMARY_SECONDARY';

export type EstablishmentApplicationInput = {
  officialName: string;
  establishmentType: string;
  levels: EstablishmentLevel[];
  address: string;
  city: string;
  province: string;
  phone: string;
  officialEmail: string;
  schoolYear: string;
  principalFirstName: string;
  principalLastName: string;
  principalEmail: string;
  principalPhone: string;
  principalFunction: string;
};

export type ApplicationHistoryEntry = {
  action: string;
  oldStatus: string | null;
  newStatus: string | null;
  createdAt: string;
};

export type EstablishmentApplication = EstablishmentApplicationInput & {
  id: string;
  reference: string;
  establishmentCode: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  rejectionReason: string | null;
  responsibleAccountStatus: 'PENDING_ACTIVATION' | 'ACTIVE' | 'DISABLED';
  activationExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  history: ApplicationHistoryEntry[];
};

export type SubmissionResult = {
  id: string;
  reference: string;
  status: EstablishmentApplication['status'];
  editToken: string;
  email: string;
};

export type ApiError = Error & { status?: number };

type AuthTokenProvider = () => Promise<string | null>;
let authTokenProvider: AuthTokenProvider = async () => null;

export function setAuthTokenProvider(provider: AuthTokenProvider) {
  authTokenProvider = provider;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await authTokenProvider();
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(path, { ...init, headers });
  const rawText = await response.text().catch(() => '');
  let payload: any = null;
  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const serverMessage =
      typeof payload === 'object' && payload && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : null;

    const fallbackMessage = serverMessage
      ? serverMessage
      : response.status === 503
      ? 'Le service d’inscription est temporairement indisponible. Configurez Supabase puis réessayez.'
      : response.status === 404
      ? 'Route API introuvable (404).'
      : response.status >= 500
      ? `Erreur serveur (${response.status}). Réessayez dans un instant.`
      : 'Une erreur est survenue. Réessayez dans un instant.';

    const error = new Error(fallbackMessage) as ApiError;
    error.status = response.status;
    throw error;
  }
  return payload as T;
}

export function getGetEstablishmentApplicationQueryKey(id: string, params?: { token?: string }) {
  return ['/api/establishment-applications', id, params?.token ?? ''] as const;
}

export function getListEstablishmentApplicationsQueryKey(params?: { status?: string }) {
  return ['/api/establishment-applications', params?.status ?? 'all'] as const;
}

export function useCreateEstablishmentApplication(): UseMutationResult<
  SubmissionResult,
  ApiError,
  { data: EstablishmentApplicationInput }
> {
  return useMutation({
    mutationFn: ({ data }) =>
      apiFetch<SubmissionResult>('/api/establishment-applications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useGetEstablishmentApplication(
  id: string,
  params?: { token?: string },
  options?: { query?: { enabled?: boolean; queryKey?: readonly unknown[] } },
): UseQueryResult<EstablishmentApplication, ApiError> {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetEstablishmentApplicationQueryKey(id, params),
    enabled: options?.query?.enabled ?? Boolean(id && params?.token),
    queryFn: () =>
      apiFetch<EstablishmentApplication>(
        `/api/establishment-applications/${encodeURIComponent(id)}?token=${encodeURIComponent(params?.token ?? '')}`,
      ),
  });
}

export function useUpdateEstablishmentApplication(): UseMutationResult<
  EstablishmentApplication,
  ApiError,
  { id: string; data: EstablishmentApplicationInput; params?: { token?: string } }
> {
  return useMutation({
    mutationFn: ({ id, data, params }) =>
      apiFetch<EstablishmentApplication>(
        `/api/establishment-applications/${encodeURIComponent(id)}?token=${encodeURIComponent(params?.token ?? '')}`,
        { method: 'PATCH', body: JSON.stringify(data) },
      ),
  });
}

export function useResubmitEstablishmentApplication(): UseMutationResult<
  EstablishmentApplication,
  ApiError,
  { id: string; params?: { token?: string } }
> {
  return useMutation({
    mutationFn: ({ id, params }) =>
      apiFetch<EstablishmentApplication>(
        `/api/establishment-applications/${encodeURIComponent(id)}/resubmit?token=${encodeURIComponent(params?.token ?? '')}`,
        { method: 'POST', body: JSON.stringify({}) },
      ),
  });
}

export function useListEstablishmentApplications(
  params?: { status?: string },
  options?: { query?: { enabled?: boolean; queryKey?: readonly unknown[] } },
): UseQueryResult<EstablishmentApplication[], ApiError> {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getListEstablishmentApplicationsQueryKey(params),
    enabled: options?.query?.enabled ?? true,
    queryFn: () => {
      const query = params?.status ? `?status=${encodeURIComponent(params.status)}` : '';
      return apiFetch<EstablishmentApplication[]>(`/api/establishment-applications${query}`);
    },
  });
}

function useAdminAction(
  action: 'approve' | 'reject',
): UseMutationResult<
  EstablishmentApplication,
  ApiError,
  { id: string; data?: { reason: string } }
> {
  return useMutation({
    mutationFn: ({ id, data }) =>
      apiFetch<EstablishmentApplication>(
        `/api/establishment-applications/${encodeURIComponent(id)}/${action}`,
        { method: 'POST', body: JSON.stringify(data ?? {}) },
      ),
  });
}

export function useApproveEstablishmentApplication() {
  return useAdminAction('approve');
}

export function useRejectEstablishmentApplication() {
  return useAdminAction('reject');
}

export function useActivateEstablishmentApplication(): UseMutationResult<
  EstablishmentApplication,
  ApiError,
  { id: string }
> {
  return useMutation({
    mutationFn: ({ id }) =>
      apiFetch<EstablishmentApplication>(
        `/api/establishment-applications/${encodeURIComponent(id)}/activate`,
        { method: 'POST', body: JSON.stringify({}) },
      ),
  });
}