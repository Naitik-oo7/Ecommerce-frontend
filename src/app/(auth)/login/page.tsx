'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, ShieldCheck, Tag, Truck, ShoppingBag, ArrowRight, Star } from 'lucide-react';
import { useLoginMutation, useResendVerificationMutation } from '@/services/api/authApi';
import { loginSchema, type LoginFormData } from '@/lib/validators/auth';
import { setUser } from '@/lib/redux/authSlice';
import { useAppDispatch } from '@/lib/redux/hooks';
import { useMergeGuestCart } from '@/lib/redux/useMergeGuestCart';
import { setAuthTokens } from '@/lib/authTokens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';


//Login Page
export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loginMutation, { isLoading }] = useLoginMutation();
  const [resendVerificationMutation, { isLoading: isResending }] = useResendVerificationMutation();
  const mergeGuestCart = useMergeGuestCart();
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResendStatus('idle');
    try {
      await resendVerificationMutation({ email: unverifiedEmail }).unwrap();
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      setUnverifiedEmail(null);
      setResendStatus('idle');
      const response = await loginMutation(data).unwrap();
      setAuthTokens(response.accessToken, response.refreshToken, rememberMe);
      dispatch(setUser(response.user));

      // Transfer any items added while browsing as a guest into the server cart.
      await mergeGuestCart();

      // Return the user to where they were headed before being bounced to /login.
      // Only same-origin relative paths are honored (open-redirect safe).
      const redirectTo = new URLSearchParams(window.location.search).get('redirect');
      const safeRedirect =
        redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') && !redirectTo.startsWith('/login')
          ? redirectTo
          : null;
      const destination = safeRedirect ?? (response.user.role === 'admin' ? '/admin/dashboard' : '/');
      router.push(destination);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string }; status?: number };
      const message = error.data?.message || 'Login failed. Please try again.';
      setError(message);
      if (error.status === 403 && message.toLowerCase().includes('verify')) {
        setUnverifiedEmail(data.email);
      }
    }
  };

  const features = [
    {
      icon: ShieldCheck,
      title: 'Secure & Safe',
      desc: 'Encrypted connections and secure authentication protect your account',
    },
    {
      icon: Tag,
      title: 'Best Deals',
      desc: 'Get access to exclusive offers and member discounts',
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      desc: 'Quick and reliable shipping to your doorstep',
    },
  ];

  return (
    <div className="w-full max-w-5xl bg-card rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row md:min-h-145">
      {/* ── Left panel — hidden on mobile so the form is shown first ── */}
      <div className="relative hidden md:flex flex-col justify-between p-8 md:p-10 bg-background md:w-[48%] overflow-hidden">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#111111] dark:bg-[#C7A27C] flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-white dark:text-[#111111]" />
          </div>
          <span className="font-bold text-sm tracking-widest uppercase text-foreground">
            Mono
          </span>
        </div>

        {/* Headline */}
        <div className="mt-8">
          <h1 className="text-3xl font-bold text-foreground leading-tight">
            Welcome back!
          </h1>
          <p className="mt-1 text-accent font-semibold flex items-center gap-1.5">
            Sign in to continue shopping
            <ShoppingBag className="w-4 h-4" />
          </p>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs">
            Access your account to track orders, save favorites, and enjoy exclusive deals.
          </p>

          {/* Feature list */}
          <ul className="mt-7 space-y-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <div className="mt-0.5 w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Decorative shopping illustration */}
        <div className="relative mt-8 flex justify-center items-end h-40 pointer-events-none select-none">
          {/* Glow circle */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-52 h-24 rounded-full bg-[#C7A27C]/15 dark:bg-[#C7A27C]/10 blur-2xl" />

          {/* Gift box */}
          <svg className="absolute left-4 bottom-2 w-14 h-14 drop-shadow-md" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="36" width="64" height="38" rx="4" fill="#C7A27C" opacity="0.7"/>
            <rect x="8" y="28" width="64" height="12" rx="3" fill="#C7A27C" opacity="0.9"/>
            <rect x="36" y="28" width="8" height="46" rx="2" fill="#E8E4DE"/>
            <path d="M40 28 C40 28 28 20 28 12 C28 6 34 4 40 12 C46 4 52 6 52 12 C52 20 40 28 40 28Z" fill="#E8E4DE"/>
          </svg>

          {/* Small tote bag */}
          <svg className="absolute right-6 bottom-2 w-16 h-16 drop-shadow-md" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 30 L14 70 L66 70 L60 30 Z" rx="4" fill="#C7A27C" opacity="0.6"/>
            <path d="M28 30 C28 20 52 20 52 30" stroke="#111111" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4"/>
            <rect x="14" y="26" width="52" height="8" rx="3" fill="#C7A27C" opacity="0.8"/>
            <path d="M34 50 L46 50" stroke="#E8E4DE" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>

          {/* Main large shopping bag */}
          <svg className="relative w-28 h-32 drop-shadow-xl" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 38 L6 110 C6 114 9 116 13 116 L87 116 C91 116 94 114 94 110 L90 38 Z" fill="#111111" opacity="0.85"/>
            <rect x="6" y="30" width="88" height="12" rx="4" fill="#111111" opacity="0.9"/>
            <path d="M34 30 C34 14 66 14 66 30" stroke="#C7A27C" strokeWidth="4" strokeLinecap="round" fill="none"/>
            <path d="M38 72 C38 72 42 78 50 78 C58 78 62 72 62 72" stroke="#C7A27C" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <circle cx="50" cy="62" r="10" fill="none" stroke="#C7A27C" strokeWidth="2.5" opacity="0.6"/>
            <path d="M46 62 L49 65 L54 59" stroke="#C7A27C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          {/* Small plant/accent */}
          <svg className="absolute left-10 bottom-0 w-10 h-12 drop-shadow" viewBox="0 0 50 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="18" y="38" width="14" height="18" rx="3" fill="#C7A27C" opacity="0.5"/>
            <ellipse cx="25" cy="32" rx="14" ry="10" fill="#C7A27C" opacity="0.4"/>
            <ellipse cx="16" cy="26" rx="10" ry="7" fill="#C7A27C" opacity="0.3"/>
            <ellipse cx="34" cy="26" rx="10" ry="7" fill="#C7A27C" opacity="0.3"/>
            <line x1="25" y1="38" x2="25" y2="22" stroke="#C7A27C" strokeWidth="2" opacity="0.5"/>
          </svg>
        </div>

        {/* Trust badge */}
        <div className="mt-8 flex items-center gap-2 bg-card rounded-xl px-4 py-2.5 w-fit shadow-sm">
          <ShieldCheck className="w-4 h-4 text-accent" />
          <span className="text-xs font-medium text-muted-foreground">
            Trusted by 50K+ happy customers
          </span>
          <div className="flex gap-0.5 ml-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-[#C7A27C] text-accent" />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-col justify-center px-6 sm:px-8 md:px-12 py-8 sm:py-10 md:w-[52%]">
        <div className="max-w-sm w-full mx-auto">
          {/* Brand mark — shown on mobile since the left panel is hidden there */}
          <div className="flex md:hidden items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#111111] dark:bg-[#C7A27C] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white dark:text-[#111111]" />
            </div>
            <span className="font-bold text-sm tracking-widest uppercase text-foreground">
              Mono
            </span>
          </div>

          <h2 className="text-2xl font-bold text-foreground">Login</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your credentials to access your account
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 space-y-2">
                <p>{error}</p>
                {unverifiedEmail && (
                  resendStatus === 'sent' ? (
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Verification email sent — check your inbox.
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="text-xs font-semibold underline underline-offset-2 text-destructive hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {isResending ? 'Sending…' : 'Resend verification email'}
                    </button>
                  )
                )}
                {resendStatus === 'error' && (
                  <p className="text-xs">Failed to send — please try again.</p>
                )}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-9 bg-background border-border focus:border-accent focus:ring-accent/20"
                  {...register('email')}
                  aria-invalid={errors.email ? 'true' : 'false'}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  className="pl-9 pr-10 bg-background border-border focus:border-accent focus:ring-accent/20"
                  {...register('password')}
                  aria-invalid={errors.password ? 'true' : 'false'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E5E2DD] accent-[#C7A27C]"
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-accent hover:text-foreground transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary hover:bg-accent text-primary-foreground font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Logging in...
                </span>
              ) : (
                <>
                  Login
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or continue with</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Social buttons */}
            <GoogleAuthButton onError={(msg) => setError(msg)} />

            {/* Register link */}
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-semibold text-accent hover:text-foreground transition-colors"
              >
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
