'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CodeInput, LoadingScreen } from '@/components/ui';
import { motion } from 'framer-motion';
import { Mail, ArrowLeftRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/error-utils';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');
  const { user, verifyEmail, resendVerificationCode, loading } = useAuth();

  const [email, setEmail] = useState(emailParam || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');

  // Get email from user context if not in URL
  useEffect(() => {
    if (!email && user?.email) {
      setEmail(user.email);
    }
  }, [user, email]);

  // Redirect if already verified
  useEffect(() => {
    if (!loading && user?.emailVerified) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeComplete = async (code: string) => {
    if (!email) {
      setError('Email address is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await verifyEmail(email, code);
      router.push('/dashboard');
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Verification failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;

    setIsResending(true);
    setError('');

    try {
      await resendVerificationCode(email);
      setResendCooldown(60);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to resend code'));
    } finally {
      setIsResending(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Brand Panel — lg+ */}
      <div className="hidden lg:flex lg:w-120 xl:w-130 shrink-0 bg-linear-to-br from-indigo-600 via-indigo-700 to-violet-800 relative overflow-hidden flex-col justify-center px-12 xl:px-16">
        {/* Decorative elements */}
        <div className="absolute top-20 -left-16 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />
        <div className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-violet-400/20 rounded-full blur-2xl" />

        <div className="relative">
          <Link href="/">
            <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-900/30">
              <ArrowLeftRight className="w-7 h-7 text-white" />
            </div>
          </Link>

          <h1 className="text-3xl xl:text-4xl font-bold text-white mb-3">
            Almost there!
          </h1>
          <p className="text-indigo-200 text-lg mb-8 max-w-sm leading-relaxed">
            We&apos;ve sent a verification code to your email. Enter it below to complete your registration.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 min-h-screen bg-linear-to-br from-sky-50 via-white to-indigo-50 lg:bg-slate-50/80 flex items-center justify-center p-4 sm:p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Mobile/Tablet Logo + Title */}
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-block group">
              <motion.div
                className="w-14 h-14 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              >
                <Mail className="w-7 h-7 text-white" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                Verify Your Email
              </h1>
            </Link>
          </div>

          {/* Desktop Heading */}
          <div className="hidden lg:block mb-8 text-center">
            <div className="w-14 h-14 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
            <p className="text-slate-500">We sent a verification code to</p>
            {email && (
              <p className="text-indigo-600 font-semibold">{email}</p>
            )}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-200/60 px-5 py-6 sm:p-8">
            <div className="text-center mb-6 lg:hidden">
              <p className="text-slate-500">We sent a verification code to</p>
              {email && (
                <p className="text-indigo-600 font-semibold">{email}</p>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
                  Enter your 6-digit code
                </label>
                <CodeInput
                  onComplete={handleCodeComplete}
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
              )}

              {isSubmitting && (
                <div className="flex items-center justify-center gap-2 text-indigo-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Verifying...</span>
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-slate-500 mb-2">
                  Didn&apos;t receive the code?
                </p>
                <button
                  onClick={handleResend}
                  disabled={isResending || resendCooldown > 0}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? (
                    <span className="flex items-center gap-1 justify-center">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Sending...
                    </span>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    'Resend code'
                  )}
                </button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-center text-sm text-slate-500">
                Wrong email?{' '}
                <Link
                  href="/signup"
                  className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Go back
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-8">
            The code expires in 15 minutes
          </p>
        </motion.div>
      </div>
    </div>
  );
}
