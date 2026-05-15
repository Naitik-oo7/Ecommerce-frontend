'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useResetPasswordMutation } from '@/services/api/authApi';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validators/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  
  const [resetPasswordMutation, { isLoading }] = useResetPasswordMutation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setError(null);
      await resetPasswordMutation(data).unwrap();
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      setError(error.data?.message || 'Failed to reset password. Please try again.');
    }
  };

  if (!token) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Invalid Link</CardTitle>
          <CardDescription>The password reset link is invalid or has expired.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/forgot-password" className="text-blue-600 hover:underline">
            Request a new reset link
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Password Reset Successful</CardTitle>
          <CardDescription>Your password has been reset successfully.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center">Redirecting to login...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>Enter your new password</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              aria-invalid={errors.password ? 'true' : 'false'}
            />
            {errors.password && (
              <p className="text-sm text-red-600" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
          <div className="text-sm text-center">
            Remember your password?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
