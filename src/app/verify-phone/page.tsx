'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CodeInput, LoadingScreen, Button, UsPhoneInput, ButtonLink } from '@/components/ui';
import { motion } from 'framer-motion';
import { Smartphone, ArrowLeftRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/error-utils';
import { readActivation, type ActivationState } from '@/lib/activation';
import { SMS_CONSENT_TEXT } from '@/lib/sms-consent';
import { toUsE164, usPhoneValidationError, US_DIAL_CODE } from '@/lib/phone';

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
    requestActivationCode,
    setActivationPhone,
    loading,
  } = useAuth();

  const [state, setState] = useState<ActivationState | null>(null);
  const [ready, setReady] = useState(false);

  /** The ten national digits. The field owns the +1. */
  const [phoneDigits, setPhoneDigits] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  /**
   * Remounts the code field on every resend.
   *
   * Without this a wrong code stays on screen, and because a field holding a
   * full code deliberately stops listening, the newly texted code has nowhere
   * to land. Clearing it is also what the user expects after asking for a new
   * code.
   */
  const [resendKey, setResendKey] = useState(0);
  const [error, setError] = useState('');

  // sessionStorage is unavailable during SSR, so read it after mount.
  useEffect(() => {
    const activation = readActivation();
    setState(activation);
    setReady(true);

  }, []);

  // Only leave once activation is genuinely finished.
  //
  // An existing signed-in user still has `user` in localStorage while being
  // unverified, so redirecting on its presence alone sent them to /dashboard,
  // where the guard 403s, the interceptor sends them back here, and round it
  // goes. Staying put while an activation is in progress breaks that loop.
  useEffect(() => {
    if (!ready) return;
    if (user && !readActivation()) router.replace('/dashboard');
  }, [user, ready, router]);

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

  const handleRequestCode = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    setError('');
    try {
      await requestActivationCode();
      setState(readActivation());
      setResendKey((k) => k + 1);
      setResendCooldown(60);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to resend code'));
    } finally {
      setIsResending(false);
    }
  };

  const handleSetPhone = async (e: React.FormEvent) => {
    e.preventDefault();

    // Same rule as signup: ten US digits, canonicalised to +1XXXXXXXXXX
    // before it leaves the browser. An account reaching activation without a
    // number on file is the legacy path, and it gets the same field.
    const validationError = usPhoneValidationError(phoneDigits);
    if (validationError) {
      setPhoneError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await setActivationPhone(toUsE164(phoneDigits) as string);
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
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface rounded-lg shadow-card border border-hairline p-8 text-center">
          <h2 className="text-xl font-bold text-ink mb-2">
            Activation expired
          </h2>
          <p className="text-ink-3 text-sm mb-6">
            Sign in with your password to pick up where you left off.
          </p>
          <ButtonLink href="/login" variant="primary" size="lg" className="w-full">
              Sign in
            </ButtonLink>
        </div>
      </div>
    );
  }

  const needsNumber = state.needsPhoneNumber;

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-accent p-12 flex-col justify-center">
        <Link href="/">
          <div className="w-14 h-14 bg-surface/15 rounded-lg flex items-center justify-center mb-8">
            <ArrowLeftRight className="w-7 h-7 text-white" />
          </div>
        </Link>
        <h1 className="text-3xl xl:text-4xl font-bold text-white mb-3">
          One last step
        </h1>
        <p className="text-accent-soft text-lg max-w-sm leading-relaxed">
          {needsNumber
            ? 'Add a mobile number so we can text you a code. Your account is not active until it is verified.'
            : !state.codeSent
              ? 'Confirm the number we have for you, and we will text you a code. Nothing is sent until you ask.'
              : 'Enter the code we texted you. Your account is not active until this is done.'}
        </p>
      </div>

      <div className="flex-1 min-h-screen bg-canvas flex items-center justify-center p-4 sm:p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-ink mb-2">
              {needsNumber
                ? 'Add your mobile number'
                : !state.codeSent
                  ? 'Confirm your mobile number'
                  : 'Check your phone'}
            </h2>
            {!needsNumber && state.phoneHint && (
              <>
                <p className="text-ink-3">
                  {state.codeSent
                    ? 'We sent a 6-digit code by text to'
                    : 'We will text your code to'}
                </p>
                <p className="text-accent font-semibold">
                  {state.phoneHint}
                </p>
              </>
            )}
          </div>

          <div className="bg-surface rounded-lg shadow-card border border-hairline px-5 py-6 sm:p-8">
            {needsNumber ? (
              <form onSubmit={handleSetPhone} className="space-y-5">
                <UsPhoneInput
                  id="activation-phone"
                  label="Mobile number"
                  required
                  autoFocus
                  value={phoneDigits}
                  onChange={(digits) => {
                    setPhoneDigits(digits);
                    setPhoneError('');
                    setError('');
                  }}
                  error={phoneError}
                  helperText={`We text a code to this ${US_DIAL_CODE} number.`}
                />
                <p className="text-xs text-ink-2 bg-sunken rounded-md p-4 border border-hairline leading-relaxed">
                  {SMS_CONSENT_TEXT}
                </p>
                {error && <p className="text-sm text-danger">{error}</p>}
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
            ) : !state.codeSent ? (
              /* Number already on file. Show the consent wording and WAIT —
                 an existing account must never be texted just for showing up. */
              <div className="space-y-5">
                <p className="text-xs text-ink-2 bg-sunken rounded-md p-4 border border-hairline leading-relaxed">
                  {SMS_CONSENT_TEXT}
                </p>
                {error && <p className="text-sm text-danger">{error}</p>}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isResending}
                  onClick={handleRequestCode}
                >
                  Text me a code
                </Button>
                <div className="text-center pt-4 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setState({ ...state, needsPhoneNumber: true })}
                    className="text-sm font-semibold text-accent hover:text-accent-ink"
                  >
                    Use a different number
                  </button>
                </div>
              </div>
            ) : (
              <>
                <label className="block text-sm font-medium text-ink-2 mb-3 text-center">
                  Enter your 6-digit code
                </label>
                <CodeInput
                  key={resendKey}
                  onComplete={handleComplete}
                  onChange={() => error && setError('')}
                  disabled={isSubmitting || isResending}
                  describedBy={error ? 'activation-code-error' : undefined}
                />

                {error && (
                  <p
                    id="activation-code-error"
                    role="alert"
                    className="text-sm text-danger text-center mt-4"
                  >
                    {error}
                  </p>
                )}

                <div className="text-center mt-6">
                  <p className="text-sm text-ink-3 mb-1">
                    Didn&apos;t get the code?
                  </p>
                  <button
                    type="button"
                    onClick={handleRequestCode}
                    disabled={isResending || resendCooldown > 0}
                    className="text-sm font-semibold text-accent hover:text-accent-ink disabled:text-ink-3 disabled:cursor-not-allowed"
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

                <p className="text-xs text-ink-3 text-center mt-6">
                  The code expires in 10 minutes. Standard message and data
                  rates may apply. Reply STOP to opt out and HELP for help.
                </p>

                {/* Wrong number typed at sign-up, or the number has changed. */}
                <div className="text-center mt-4 pt-4 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() =>
                      setState({ ...state, needsPhoneNumber: true })
                    }
                    className="text-sm font-semibold text-accent hover:text-accent-ink"
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
