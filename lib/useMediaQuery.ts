import { useSyncExternalStore } from 'react';

/** Live media-query match; false during server render. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(query); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Phones (below Tailwind's `sm` breakpoint). */
export const usePhone = () => useMediaQuery('(max-width: 639px)');
