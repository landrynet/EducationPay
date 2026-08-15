import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';
const clientUrl = supabaseUrl || 'https://placeholder.supabase.co';
const clientAnonKey = supabaseAnonKey || 'educpay-local-placeholder-key';

export const supabaseConfig = {
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  missing: [
    !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
    !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : null,
  ].filter((value): value is string => value !== null),
} as const;

if (!supabaseConfig.isConfigured) {
  // Keep silent in production but helpful in dev.
  // Do not throw to avoid breaking apps that haven't set env yet.
  // Logging here is safe since these are public keys / urls.
  // eslint-disable-next-line no-console
  console.warn('Supabase client configured without VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export function getSupabaseConfigError() {
  if (supabaseConfig.isConfigured) return null;

  return `La connexion Supabase n’est pas configurée. Variable(s) manquante(s) : ${supabaseConfig.missing.join(', ')}.`;
}

export function getNetworkAwareTimeoutMs(defaultMs = 15000) {
  const connection = (navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      downlink?: number;
    };
  }).connection;

  if (!connection) return defaultMs;

  const effectiveType = connection.effectiveType?.toLowerCase() ?? '';
  const downlink = connection.downlink ?? 0;

  if (effectiveType.includes('slow') || effectiveType.includes('2g') || effectiveType.includes('3g')) {
    return 24000;
  }

  if (downlink > 8) return 8000;
  if (downlink > 3) return 10000;

  return defaultMs;
}

export function withSupabaseTimeout<T>(promiseLike: PromiseLike<T>, timeoutMessage: string, timeoutMs = getNetworkAwareTimeoutMs()) {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    Promise.resolve(promiseLike).then(
      (value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export const supabase = createClient(clientUrl, clientAnonKey);
export default supabase;
