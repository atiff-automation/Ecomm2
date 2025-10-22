'use client';

/**
 * Forgot Password Page
 * Allows users to request password reset email
 *
 * Following CLAUDE.md standards:
 * - Type safety (explicit types, no any)
 * - Error handling (try-catch on API calls)
 * - Input validation (Zod schemas)
 * - Security first (client-side validation + server-side)
 */

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validation/auth';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

function ForgotPasswordForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Client-side validation using Zod
      const validatedData: ForgotPasswordInput = forgotPasswordSchema.parse({ email });

      // Call API to request password reset
      const response = await fetchWithCSRF('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: validatedData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to process request. Please try again.');
        setIsLoading(false);
        return;
      }

      // Success - show success message
      setSuccess(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Forgot password error:', error);

      if (error instanceof Error) {
        // Zod validation error or other Error
        setError(error.message);
      } else {
        setError('An error occurred. Please try again.');
      }

      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">JRM E-commerce</h1>
          <p className="mt-2 text-sm text-gray-600">
            Malaysian E-commerce with Membership Benefits
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot Password?</CardTitle>
            <CardDescription>
              Enter your email address and we&apos;ll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-1"
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    We&apos;ll send a password reset link to this email
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  <p className="font-medium">Check your email!</p>
                  <p className="mt-1 text-sm">
                    If an account exists with <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
                  <p className="font-medium mb-2">What to do next:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Check your inbox for the reset email</li>
                    <li>Click the link in the email (valid for 1 hour)</li>
                    <li>Create a new password</li>
                    <li>Sign in with your new password</li>
                  </ol>
                </div>

                <p className="text-sm text-gray-600 text-center">
                  Didn&apos;t receive the email? Check your spam folder or{' '}
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setEmail('');
                    }}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    try again
                  </button>
                </p>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link
                  href="/auth/signin"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Protected by advanced security measures
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
