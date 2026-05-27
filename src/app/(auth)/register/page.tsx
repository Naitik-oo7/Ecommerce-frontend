'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, ShoppingBag, ArrowRight, Star, Gift, Percent, Heart, CheckCircle } from 'lucide-react';
import { useRegisterMutation } from '@/services/api/authApi';
import { registerSchema, type RegisterFormData } from '@/lib/validators/auth';
import { setUser } from '@/lib/redux/authSlice';
import { useAppDispatch } from '@/lib/redux/hooks';
import { setCookie } from '@/lib/cookies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [registerMutation, { isLoading }] = useRegisterMutation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      const response = await registerMutation(data).unwrap();
      dispatch(setUser(response.user));
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      setCookie('accessToken', response.accessToken);
      setSuccess(true);
      setTimeout(() => router.push('/'), 2000);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      setError(error.data?.message || 'Registration failed. Please try again.');
    }
  };

  const perks = [
    {
      icon: Gift,
      title: 'Welcome Reward',
      desc: 'Get exclusive discounts on your very first order',
    },
    {
      icon: Percent,
      title: 'Member Prices',
      desc: 'Access member-only deals and flash sales',
    },
    {
      icon: Heart,
      title: 'Wishlist & Saves',
      desc: 'Save your favourites and never lose track again',
    },
  ];

  if (success) {
    return (
      <div className="w-full max-w-md bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl p-10 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#C7A27C]/15 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-[#C7A27C]" />
        </div>
        <h2 className="text-2xl font-bold text-[#111111] dark:text-[#F6F3EE]">Account Created!</h2>
        <p className="text-sm text-[#6B6B6B] dark:text-[#8A8A8A]">
          Your account has been created successfully. Redirecting you now…
        </p>
        <div className="w-8 h-8 border-2 border-[#E5E2DD] border-t-[#C7A27C] rounded-full animate-spin mt-2" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">

      {/* ── Left panel — Form ── */}
      <div className="flex flex-col justify-center px-8 md:px-12 py-10 md:w-[52%]">
        <div className="max-w-sm w-full mx-auto">
          {/* Brand mark */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-[#111111] dark:bg-[#C7A27C] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white dark:text-[#111111]" />
            </div>
            <span className="font-bold text-sm tracking-widest uppercase text-[#111111] dark:text-[#F6F3EE]">
              Mono
            </span>
          </div>

          <h2 className="text-2xl font-bold text-[#111111] dark:text-[#F6F3EE]">Create account</h2>
          <p className="mt-1 text-sm text-[#6B6B6B] dark:text-[#8A8A8A]">
            Join thousands of happy shoppers today
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
            {error && (
              <div className="p-3 text-sm text-[#B54A4A] bg-[#B54A4A]/10 rounded-lg border border-[#B54A4A]/20">
                {error}
              </div>
            )}

            {/* Full name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium text-[#111111] dark:text-[#F6F3EE]">
                Full name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="pl-9 bg-[#F6F3EE] dark:bg-[#111111] border-[#E5E2DD] dark:border-[#2A2A2A] focus:border-[#C7A27C] focus:ring-[#C7A27C]/20"
                  {...register('name')}
                  aria-invalid={errors.name ? 'true' : 'false'}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-[#B54A4A]" role="alert">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-[#111111] dark:text-[#F6F3EE]">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-9 bg-[#F6F3EE] dark:bg-[#111111] border-[#E5E2DD] dark:border-[#2A2A2A] focus:border-[#C7A27C] focus:ring-[#C7A27C]/20"
                  {...register('email')}
                  aria-invalid={errors.email ? 'true' : 'false'}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-[#B54A4A]" role="alert">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-[#111111] dark:text-[#F6F3EE]">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  className="pl-9 pr-10 bg-[#F6F3EE] dark:bg-[#111111] border-[#E5E2DD] dark:border-[#2A2A2A] focus:border-[#C7A27C] focus:ring-[#C7A27C]/20"
                  {...register('password')}
                  aria-invalid={errors.password ? 'true' : 'false'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#111111] dark:hover:text-[#F6F3EE] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[#B54A4A]" role="alert">{errors.password.message}</p>
              )}
            </div>

            {/* Terms note */}
            <p className="text-xs text-[#6B6B6B] dark:text-[#8A8A8A] leading-relaxed">
              By creating an account you agree to our{' '}
              <span className="text-[#C7A27C] font-medium cursor-pointer hover:underline">Terms of Service</span>
              {' '}and{' '}
              <span className="text-[#C7A27C] font-medium cursor-pointer hover:underline">Privacy Policy</span>.
            </p>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#111111] hover:bg-[#C7A27C] dark:bg-[#C7A27C] dark:hover:bg-[#F6F3EE] dark:hover:text-[#111111] text-white dark:text-[#111111] font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-[#E5E2DD] dark:bg-[#2A2A2A]" />
              <span className="text-xs text-[#6B6B6B] dark:text-[#8A8A8A]">or continue with</span>
              <div className="flex-1 h-px bg-[#E5E2DD] dark:bg-[#2A2A2A]" />
            </div>

            {/* Google */}
            <GoogleAuthButton onError={(msg) => setError(msg)} />

            {/* Login link */}
            <p className="text-center text-sm text-[#6B6B6B] dark:text-[#8A8A8A]">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-[#C7A27C] hover:text-[#111111] dark:hover:text-[#F6F3EE] transition-colors"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* ── Right panel — Branding ── */}
      <div className="relative flex flex-col justify-between p-8 md:p-10 bg-[#F6F3EE] dark:bg-[#111111] md:w-[48%] overflow-hidden">
        {/* Headline */}
        <div className="mt-8 md:mt-12">
          <h1 className="text-3xl font-bold text-[#111111] dark:text-[#F6F3EE] leading-tight">
            Start your journey!
          </h1>
          <p className="mt-1 text-[#C7A27C] font-semibold flex items-center gap-1.5">
            Create a free account today
            <Star className="w-4 h-4 fill-[#C7A27C]" />
          </p>
          <p className="mt-3 text-sm text-[#6B6B6B] dark:text-[#8A8A8A] leading-relaxed max-w-xs">
            Join our community and unlock a world of exclusive deals, fast delivery, and a seamless shopping experience.
          </p>

          {/* Perks list */}
          <ul className="mt-7 space-y-4">
            {perks.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <div className="mt-0.5 w-9 h-9 rounded-xl bg-[#E8E4DE] dark:bg-[#1F1F1F] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#C7A27C]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111111] dark:text-[#F6F3EE]">{title}</p>
                  <p className="text-xs text-[#6B6B6B] dark:text-[#8A8A8A] leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Illustration */}
        <div className="relative mt-8 flex justify-center items-end h-40 pointer-events-none select-none">
          {/* Glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-52 h-24 rounded-full bg-[#C7A27C]/15 dark:bg-[#C7A27C]/10 blur-2xl" />

          {/* Gift box left */}
          <svg className="absolute left-4 bottom-2 w-14 h-14 drop-shadow-md" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="36" width="64" height="38" rx="4" fill="#C7A27C" opacity="0.7"/>
            <rect x="8" y="28" width="64" height="12" rx="3" fill="#C7A27C" opacity="0.9"/>
            <rect x="36" y="28" width="8" height="46" rx="2" fill="#E8E4DE"/>
            <path d="M40 28 C40 28 28 20 28 12 C28 6 34 4 40 12 C46 4 52 6 52 12 C52 20 40 28 40 28Z" fill="#E8E4DE"/>
          </svg>

          {/* Tag / percent bag right */}
          <svg className="absolute right-6 bottom-2 w-16 h-16 drop-shadow-md" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 30 L14 70 L66 70 L60 30 Z" fill="#C7A27C" opacity="0.6"/>
            <path d="M28 30 C28 20 52 20 52 30" stroke="#111111" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4"/>
            <rect x="14" y="26" width="52" height="8" rx="3" fill="#C7A27C" opacity="0.8"/>
            <text x="32" y="56" fontSize="18" fontWeight="bold" fill="#E8E4DE" opacity="0.9">%</text>
          </svg>

          {/* Main bag */}
          <svg className="relative w-28 h-32 drop-shadow-xl" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 38 L6 110 C6 114 9 116 13 116 L87 116 C91 116 94 114 94 110 L90 38 Z" fill="#111111" opacity="0.85"/>
            <rect x="6" y="30" width="88" height="12" rx="4" fill="#111111" opacity="0.9"/>
            <path d="M34 30 C34 14 66 14 66 30" stroke="#C7A27C" strokeWidth="4" strokeLinecap="round" fill="none"/>
            <circle cx="50" cy="68" r="12" fill="none" stroke="#C7A27C" strokeWidth="2.5" opacity="0.5"/>
            <path d="M44 68 L48 72 L56 64" stroke="#C7A27C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          {/* Stars scatter */}
          <svg className="absolute top-2 right-10 w-6 h-6 opacity-40" viewBox="0 0 24 24" fill="#C7A27C">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
          <svg className="absolute top-6 left-16 w-4 h-4 opacity-30" viewBox="0 0 24 24" fill="#C7A27C">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </div>

        {/* Member count badge */}
        <div className="mt-6 flex items-center gap-2 bg-white dark:bg-[#1A1A1A] rounded-xl px-4 py-2.5 w-fit shadow-sm">
          <div className="flex -space-x-2">
            {['#C7A27C', '#111111', '#6B6B6B'].map((c, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2 border-white dark:border-[#1A1A1A] flex items-center justify-center text-white text-[9px] font-bold"
                style={{ backgroundColor: c }}
              >
                {['J', 'A', 'M'][i]}
              </div>
            ))}
          </div>
          <span className="text-xs font-medium text-[#6B6B6B] dark:text-[#8A8A8A]">
            50K+ members joined
          </span>
          <div className="flex gap-0.5 ml-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-[#C7A27C] text-[#C7A27C]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
