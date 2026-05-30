'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVerifyEmailMutation } from '@/services/api/authApi';
import { verifyEmailSchema, type VerifyEmailFormData } from '@/lib/validators/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  
  const [verifyEmailMutation, { isLoading }] = useVerifyEmailMutation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    handleSubmit,
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { token },
  });

  const onSubmit = async () => {
    try {
      setError(null);
      await verifyEmailMutation({ token }).unwrap();
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      setError(error.data?.message || 'Failed to verify email. The link may be invalid or expired.');
    }
  };

  if (!token) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Invalid Link</CardTitle>
          <CardDescription>The email verification link is invalid or has expired.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Email Verified</CardTitle>
          <CardDescription>Your email has been verified successfully. Redirecting to login...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Verify Email</CardTitle>
        <CardDescription>Click below to verify your email address</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
