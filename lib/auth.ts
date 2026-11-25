import { useSyncExternalStore } from 'react';

export const tokenKey = 'token';
export const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem(tokenKey) : null);
export const setToken = (t: string) => localStorage.setItem(tokenKey, t);
export const clearToken = () => localStorage.removeItem(tokenKey);

/** Subscribes to token changes made in other tabs (e.g. logout). */
function subscribe(cb: () => void) {
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
}

/**
 * true/false once mounted in the browser; null during server render and hydration,
 * so callers can show a spinner instead of flashing protected content.
 */
export function useHasToken(): boolean | null {
  return useSyncExternalStore(subscribe, () => !!getToken(), () => null);
}
