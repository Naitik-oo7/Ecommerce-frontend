'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';

/** Branded full-height spinner shown while auth state is rehydrating. */
export function AuthLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#F6F3EE' }}
    >
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#C8703A' }} />
    </div>
  );
}

/**
 * Gate that redirects unauthenticated users to `/login` (preserving the
 * intended destination via `?redirect=`), but only once auth state has settled
 * — so logged-in users are never bounced during the SSR/rehydration window.
 *
 * Use for routes that must be auth-only (e.g. the profile section). For routes
 * that show an inline "sign in" prompt instead of redirecting, use
 * `useAuthGuard` directly and branch on `ready`/`isAuthenticated`.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { ready, isAuthenticated } = useAuthGuard();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace('/login?redirect=' + encodeURIComponent(pathname));
    }
  }, [ready, isAuthenticated, pathname, router]);

  if (!ready) return <AuthLoading />;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
