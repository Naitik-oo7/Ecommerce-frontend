'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, ShoppingBag, ArrowRight, Mail } from 'lucide-react';
import { useVerifyEmailMutation } from '@/services/api/authApi';
import { setUser } from '@/lib/redux/authSlice';
import { useAppDispatch } from '@/lib/redux/hooks';
import { setAuthTokens } from '@/lib/authTokens';
import { useMergeGuestCart } from '@/lib/redux/useMergeGuestCart';

type Status = 'verifying' | 'success' | 'error' | 'no-token';

function VerifyEmailContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mergeGuestCart = useMergeGuestCart();
  const [verifyEmailMutation] = useVerifyEmailMutation();
  const [status, setStatus] = useState<Status>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const attempted = useRef(false);

  useEffect(() => {
    // Read token directly from URL — no useSearchParams needed here
    const token = new URLSearchParams(window.location.search).get('token');

    if (!token) {
      setStatus('no-token');
      return;
    }

    if (attempted.current) return;
    attempted.current = true;

    (async () => {
      try {
        const response = await verifyEmailMutation({ token }).unwrap();
        setAuthTokens(response.accessToken, response.refreshToken, true);
        dispatch(setUser(response.user));
        await mergeGuestCart();
        setStatus('success');
        setTimeout(() => {
          router.push(response.user.role === 'admin' ? '/admin/dashboard' : '/');
        }, 2000);
      } catch (err: unknown) {
        const error = err as { data?: { message?: string } };
        setErrorMessage(error.data?.message || 'The verification link is invalid or has expired.');
        setStatus('error');
      }
    })();
  }, []);

  return (
    <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-10 flex flex-col items-center text-center gap-5">
      {/* Brand mark */}
      <div className="flex items-center gap-2.5 self-start mb-2">
        <div className="w-8 h-8 rounded-lg bg-[#111111] dark:bg-[#C7A27C] flex items-center justify-center">
          <ShoppingBag className="w-4 h-4 text-white dark:text-foreground" />
        </div>
        <span className="font-bold text-sm tracking-widest uppercase text-foreground">Mono</span>
      </div>

      {status === 'verifying' && (
        <>
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Verifying your email</h2>
            <p className="mt-2 text-sm text-muted-foreground">Just a moment…</p>
          </div>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 rounded-full bg-[#C7A27C]/15 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Email verified!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You&rsquo;re all set. Taking you to the store…
            </p>
          </div>
          <div className="w-8 h-8 border-2 border-[#E5E2DD] border-t-[#C7A27C] rounded-full animate-spin" />
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Verification failed</h2>
            <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
          </div>
          <div className="w-full flex flex-col gap-3 mt-1">
            <Link
              href="/register"
              className="w-full h-11 bg-primary hover:bg-accent text-primary-foreground font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            >
              Sign up again
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full h-11 border border-border hover:border-accent text-foreground font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            >
              Go to login
            </Link>
          </div>
        </>
      )}

      {status === 'no-token' && (
        <>
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Mail className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Click the verification link we sent to your email address to activate your account.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full h-11 border border-border hover:border-accent text-foreground font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
          >
            Back to login
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
