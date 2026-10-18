'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, LoadingScreen } from '@/components/ui';
import { getErrorMessage } from '@/lib/error-utils';
import { normalizeResetIdentifier } from '@/lib/phone';
import { isOtpComplete, toOtpDigits } from '@/lib/otp';
import { cancelWebOtp, releaseWebOtp } from '@/lib/web-otp';
import { useWebOtpCode } from '@/lib/use-web-otp';

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

  /**
   * Android Chrome may offer the texted code here too — but it only FILLS it.
   *
   * This form also sets a new password, so submitting it the moment a code
   * arrives would send an empty or half-typed password and fail. web.dev's
   * example submits because its form holds nothing else; this one does not.
   * The request stops once a full code is present, or the page goes away.
   */
  useWebOtpCode({
    enabled: !isSubmitting && !/^\d{6}$/.test(code),
    onCode: (filled: string) => setCode(toOtpDigits(filled)),
  });

  // Leaving this screen drops the request. pagehide does not fire on a
  // client-side route change. Released, not cancelled, so a code that
  // arrived on the screen before cannot be thrown away by a remount.
  useEffect(() => () => releaseWebOtp(), []);

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
      // Same canonicalisation as the screen before it, so a user who typed
      // ten digits there and ten digits here reaches the same account.
      await resetPassword(
        normalizeResetIdentifier(identifier),
        code.trim(),
        newPassword,
      );
      router.push('/login');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid or expired code.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 sm:p-8">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">
            Choose a new password
          </h1>
          <p className="text-ink-3 text-sm">
            Enter the 6-digit code we texted you.
          </p>
        </div>

        <div className="bg-surface rounded-lg shadow-card border border-hairline px-5 py-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1.5">
                Email address or mobile number
              </label>
              <Input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com or (201) 555-0123"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1.5">
                6-digit code
              </label>
              {/* No maxLength: it counts characters, so a pasted "123 456"
                  would arrive as "123 45". toOtpDigits caps the digits
                  instead, which also lets the OS fill it in one go. This form
                  still needs a new password, so it never self-submits. */}
              <Input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                enterKeyHint="next"
                value={code}
                onChange={(e) => {
                  const next = toOtpDigits(e.target.value);
                  // Synchronously, before any render: once the user has a
                  // full code of their own, a later arrival must not land on
                  // top of it.
                  if (isOtpComplete(next)) cancelWebOtp();
                  setCode(next);
                }}
                placeholder="123456"
                autoComplete="one-time-code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1.5">
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
              <label className="block text-sm font-medium text-ink-2 mb-1.5">
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

            {error && <p className="text-sm text-danger">{error}</p>}

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

          <p className="text-xs text-ink-3 text-center mt-6">
            The code expires in 10 minutes.
          </p>

          <div className="text-center mt-4 pt-4 border-t border-hairline">
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-accent hover:text-accent-ink inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Request a new code
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
