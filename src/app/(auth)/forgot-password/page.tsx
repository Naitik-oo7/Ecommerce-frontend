'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForgotPasswordMutation } from '@/services/api/authApi';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validators/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [forgotPasswordMutation, { isLoading }] = useForgotPasswordMutation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setError(null);
      await forgotPasswordMutation(data).unwrap();
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      setError(error.data?.message || 'Failed to send reset email. Please try again.');
    }
  };

  if (success) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Email Sent</CardTitle>
          <CardDescription>
            If an account exists with this email, you will receive a password reset link.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="text-blue-600 hover:underline">
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>Enter your email to receive a password reset link</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              aria-invalid={errors.email ? 'true' : 'false'}
            />
            {errors.email && (
              <p className="text-sm text-red-600" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
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
