'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGoogleAuthMutation } from '@/services/api/authApi';
import { setUser } from '@/lib/redux/authSlice';
import { useAppDispatch } from '@/lib/redux/hooks';
import { useMergeGuestCart } from '@/lib/redux/useMergeGuestCart';
import { setAuthTokens } from '@/lib/authTokens';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
    __gsiInitialized?: boolean;
  }
}

interface GoogleAuthButtonProps {
  onError?: (msg: string) => void;
}

export default function GoogleAuthButton({ onError }: GoogleAuthButtonProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [googleAuthMutation] = useGoogleAuthMutation();
  const mergeGuestCart = useMergeGuestCart();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const onErrorRef = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  // Kept in a ref because the GSI callback below is registered once and would
  // otherwise close over a stale merge function.
  const mergeGuestCartRef = useRef(mergeGuestCart);
  useEffect(() => { mergeGuestCartRef.current = mergeGuestCart; }, [mergeGuestCart]);

  const initGoogle = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google || !buttonRef.current) return;

    if (!window.__gsiInitialized) {
      window.__gsiInitialized = true;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          setLoading(true);
          try {
            const result = await googleAuthMutation({ idToken: response.credential }).unwrap();
            setAuthTokens(result.accessToken, result.refreshToken, true);
            dispatch(setUser(result.user));
            // Transfer any guest-cart items into the server cart before leaving.
            await mergeGuestCartRef.current();
            router.push('/');
          } catch (err: unknown) {
            const error = err as { data?: { message?: string } };
            onErrorRef.current?.(error.data?.message || 'Google sign-in failed. Please try again.');
          } finally {
            setLoading(false);
          }
        },
      });
    }

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: buttonRef.current.offsetWidth || 400,
    });
  };

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    if (document.getElementById('google-gsi-script') && window.google) {
      initGoogle();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        className="w-full flex items-center justify-center gap-2.5 h-10 rounded-xl border border-[#E5E2DD] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] text-sm font-medium text-[#6B6B6B] cursor-not-allowed opacity-60"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Google (not configured)
      </button>
    );
  }

  return (
    <div className="w-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-[#1A1A1A]/70 rounded-xl z-10">
          <span className="w-4 h-4 border-2 border-[#E5E2DD] border-t-[#C7A27C] rounded-full animate-spin" />
        </div>
      )}
      <div ref={buttonRef} className="w-full [&>div]:w-full [&>div>div]:w-full" />
    </div>
  );
}
