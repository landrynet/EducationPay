export const SESSION_KEY = 'educpay.local.session';
export const DEMO_EMAIL = 'superadmin@demo.local';
export const DEMO_PASSWORD = 'SchoolOffice!24';

export type AuthResult = { ok: true } | { ok: false; message: string };

const pause = (ms = 650) => new Promise((resolve) => window.setTimeout(resolve, ms));

export function isLocalSession(): boolean {
  return typeof window !== 'undefined' && window.localStorage.getItem(SESSION_KEY) === 'active';
}

export async function simulateLogin(email: string, password: string): Promise<AuthResult> {
  await pause();
  if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    return { ok: false, message: 'Use the demo identity shown below to continue.' };
  }
  window.localStorage.setItem(SESSION_KEY, 'active');
  return { ok: true };
}

export async function simulateSuccess(): Promise<AuthResult> {
  await pause(750);
  return { ok: true };
}

export function clearLocalSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
}