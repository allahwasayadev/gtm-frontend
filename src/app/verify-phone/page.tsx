'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CodeInput, LoadingScreen, Button, Input } from '@/components/ui';
import { motion } from 'framer-motion';
import { Smartphone, ArrowLeftRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/error-utils';
import { readActivation, type ActivationState } from '@/lib/activation';
import { SMS_CONSENT_TEXT } from '@/lib/sms-consent';

/**
 * Account activation.
 *
 * Authorised by the activation token held in sessionStorage — issued at signup
 * or by a password-correct login. Nothing here is keyed on an email address,
 * so knowing one grants no power over an account.
 *
 * Three entry states:
 *  - a code was sent, enter it;
 *  - sending failed, offer resend;
 *  - no number on file at all (accounts predating this flow), ask for one.
 */
export default function VerifyPhonePage() {
  const router = useRouter();
  const {
    user,
    verifyActivation,
    resendActivationCode,
    setActivationPhone,
    loading,
  } = useAuth();

  const [state, setState] = useState<ActivationState | null>(null);
  const [ready, setReady] = useState(false);

  const [phoneInput, setPhoneInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');

  // sessionStorage is unavailable during SSR, so read it after mount.
  useEffect(() => {
    setState(readActivation());
    setReady(true);
  }, []);

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleComplete = async (code: string) => {
    setIsSubmitting(true);
    setError('');
    try {
      await verifyActivation(code);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Verification failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    setError('');
    try {
      await resendActivationCode();
      setState(readActivation());
      setResendCooldown(60);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to resend code'));
    } finally {
      setIsResending(false);
    }
  };

  const handleSetPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await setActivationPhone(phoneInput.trim());
      setState(readActivation());
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not send the code'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !ready) return <LoadingScreen message="Loading..." />;

  // No activation in progress — the token is gone or the tab is new.
  if (!state) {
    return (
      <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-card border border-slate-200/60 p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Activation expired
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Sign in with your password to pick up where you left off.
          </p>
          <Link href="/login">
            <Button variant="primary" size="lg" className="w-full">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const needsNumber = state.needsPhoneNumber;

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
          {needsNumber
            ? 'Add a mobile number so we can text you a code. Your account is not active until it is verified.'
            : state.smsSent
              ? 'Enter the code we texted you. Your account is not active until this is done.'
              : 'Your account is created, but we could not send the code. Try again below.'}
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
              {needsNumber
                ? 'Add your mobile number'
                : state.smsSent
                  ? 'Check your phone'
                  : 'We could not send your code'}
            </h2>
            {!needsNumber && state.phoneHint && (
              <>
                <p className="text-slate-500">
                  {state.smsSent
                    ? 'We sent a 6-digit code by text to'
                    : 'No code could be sent to'}
                </p>
                <p className="text-indigo-600 font-semibold">
                  {state.phoneHint}
                </p>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-slate-200/60 px-5 py-6 sm:p-8">
            {needsNumber ? (
              <form onSubmit={handleSetPhone} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Mobile number
                  </label>
                  <Input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+1 555 123 4567"
                    autoComplete="tel"
                  />
                </div>
                <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100 leading-relaxed">
                  {SMS_CONSENT_TEXT}
                </p>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full"
                >
                  Text me a code
                </Button>
              </form>
            ) : (
              <>
                <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
                  Enter your 6-digit code
                </label>
                <CodeInput
                  onComplete={handleComplete}
                  disabled={isSubmitting}
                />

                {error && (
                  <p className="text-sm text-red-600 text-center mt-4">
                    {error}
                  </p>
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
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />{' '}
                        Sending…
                      </span>
                    ) : resendCooldown > 0 ? (
                      `Resend in ${resendCooldown}s`
                    ) : (
                      'Resend code'
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-400 text-center mt-6">
                  The code expires in 10 minutes. Standard message and data
                  rates may apply. Reply STOP to opt out and HELP for help.
                </p>

                {/* Wrong number typed at sign-up, or the number has changed. */}
                <div className="text-center mt-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() =>
                      setState({ ...state, needsPhoneNumber: true })
                    }
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Use a different number
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
