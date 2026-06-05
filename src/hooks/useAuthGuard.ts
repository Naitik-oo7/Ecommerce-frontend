'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/lib/redux/hooks';

/**
 * Hydration- and rehydration-safe auth guard.
 *
 * `state.auth.isAuthenticated` is `false` during SSR and on the very first
 * client render (localStorage/sessionStorage are unavailable on the server),
 * and there is a brief `isLoading` window while `AuthInitializer` verifies a
 * stored token. Treating `!isAuthenticated` as "logged out" during that window
 * bounces already-logged-in users to `/login` (the audit's "forced login
 * redirect" on cart/wishlist/profile/notifications).
 *
 * Callers should branch on `ready` first and only act on `isAuthenticated`
 * once it is true.
 */
export function useAuthGuard() {
  const { isAuthenticated, user, isLoading } = useAppSelector((s) => s.auth);

  // `false` during SSR and the first client paint; flips to `true` after
  // hydration, by which point the store's initial state has been recomputed
  // in the browser with the correct persisted auth.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const ready = mounted && !isLoading;

  return { ready, isAuthenticated, user };
}
