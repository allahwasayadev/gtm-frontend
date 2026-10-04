'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, LoadingScreen } from '@/components/ui';
import { getErrorMessage } from '@/lib/error-utils';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

/**
 * Step 2 of reset: the 6-digit code texted to the verified phone, plus the new
 * password.
 *
 * There is no emailed link and no token to pre-validate, so nothing here can
 * be probed to learn whether an account exists. Every failure returns the same
 * message from the server.
 */
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();

  const [identifier, setIdentifier] = useState(
    searchParams.get('identifier') ?? '',
  );
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code from the text message.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(identifier.trim(), code.trim(), newPassword);
      router.push('/login');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid or expired code.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-indigo-50 flex items-center justify-center p-4 sm:p-8">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Choose a new password
          </h1>
          <p className="text-slate-500 text-sm">
            Enter the 6-digit code we texted you.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-200/60 px-5 py-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address or mobile number
              </label>
              <Input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com or +1 555 123 4567"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                6-digit code
              </label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoComplete="one-time-code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                New password
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm new password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full"
            >
              Reset password
            </Button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-6">
            The code expires in 10 minutes.
          </p>

          <div className="text-center mt-4 pt-4 border-t border-slate-100">
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Request a new code
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
