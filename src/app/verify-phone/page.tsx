'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CodeInput, LoadingScreen } from '@/components/ui';
import { motion } from 'framer-motion';
import { Smartphone, ArrowLeftRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/error-utils';

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <VerifyPhoneContent />
    </Suspense>
  );
}

/**
 * Account activation.
 *
 * Unauthenticated by design: signup issues no session, so the only things this
 * screen holds are the email just used and the code from the handset. Entering
 * a valid code is what creates the session.
 */
function VerifyPhoneContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, verifySignupPhone, resendSignupPhoneCode, loading } = useAuth();

  const email = searchParams.get('email') ?? '';
  const phoneHint = searchParams.get('phone') ?? '';
  // Set by signup when Twilio refused. Without it the screen would claim a
  // code was sent that never left the server.
  const [delivery, setDelivery] = useState<'sent' | 'failed'>(
    searchParams.get('sent') === '0' ? 'failed' : 'sent',
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleComplete = async (code: string) => {
    if (!email) {
      setError('Start again from the sign-up page.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await verifySignupPhone(email, code);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Verification failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;
    setIsResending(true);
    setError('');
    try {
      await resendSignupPhoneCode(email);
      setDelivery('sent');
      setResendCooldown(60);
    } catch (err: unknown) {
      // Only a genuine delivery failure changes what we claim. A 429 cooldown
      // or an already-verified 400 says nothing about the earlier message.
      setError(getErrorMessage(err, 'Failed to resend code'));
    } finally {
      setIsResending(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading..." />;

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-indigo-600 to-indigo-800 p-12 flex-col justify-center">
        <Link href="/">
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mb-8">
            <ArrowLeftRight className="w-7 h-7 text-white" />
          </div>
        </Link>
        <h1 className="text-3xl xl:text-4xl font-bold text-white mb-3">
          One last step
        </h1>
        <p className="text-indigo-200 text-lg max-w-sm leading-relaxed">
          {delivery === 'failed'
            ? 'Your account is created, but we could not send the code. Use Resend below to try again.'
            : 'Enter the code we texted you to activate your account. Your account is not active until this is done.'}
        </p>
      </div>

      <div className="flex-1 min-h-screen bg-linear-to-br from-sky-50 via-white to-indigo-50 flex items-center justify-center p-4 sm:p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {delivery === 'failed'
                ? 'We could not send your code'
                : 'Check your phone'}
            </h2>
            <p className="text-slate-500">
              {delivery === 'failed'
                ? 'No code could be sent to'
                : 'We sent a 6-digit code by text to'}
            </p>
            {phoneHint && (
              <p className="text-indigo-600 font-semibold">{phoneHint}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-slate-200/60 px-5 py-6 sm:p-8">
            <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
              Enter your 6-digit code
            </label>
            <CodeInput onComplete={handleComplete} disabled={isSubmitting} />

            {error && (
              <p className="text-sm text-red-600 text-center mt-4">{error}</p>
            )}

            <div className="text-center mt-6">
              <p className="text-sm text-slate-500 mb-1">
                Didn&apos;t get the code?
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || resendCooldown > 0}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <span className="flex items-center gap-1 justify-center">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending…
                  </span>
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  'Resend code'
                )}
              </button>
            </div>

            <p className="text-xs text-slate-400 text-center mt-6">
              The code expires in 10 minutes. Standard message and data rates
              may apply. Reply STOP to opt out and HELP for help.
            </p>

            <div className="text-center mt-4 pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">Wrong number? </span>
              <Link
                href="/signup"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Start again
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
