import { useSyncExternalStore } from 'react';
import { logoutSession } from 'zitejs/api';

const KEY = 'rodast_session';
type Session = { token: string; phone: string };

const listeners = new Set<() => void>();
let current: Session | null = (() => {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
})();

const emit = () => listeners.forEach((l) => l());

export const tok = () => current?.token ?? '';

export function setSession(s: Session | null) {
  current = s;
  if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY);
  emit();
}

export function useSession() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => current,
  );
}

export async function logout() {
  const t = tok();
  setSession(null);
  if (t) logoutSession({ token: t }).catch(() => {});
  window.location.assign('/');
}

/** Any endpoint saying the session is gone signs the user out locally. */
export function handleAuthError(e: unknown) {
  const code = (e as { code?: string })?.code;
  if (code === 'UNAUTHORIZED') { setSession(null); return true; }
  return false;
}
