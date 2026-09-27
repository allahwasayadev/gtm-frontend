'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, CodeInput, LoadingScreen, CountryCodeSelect, COUNTRY_CODES } from '@/components/ui';
import { motion } from 'framer-motion';
import { Smartphone, ArrowLeft, RefreshCw, ArrowRight, Shield, Phone } from 'lucide-react';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/error-utils';
import { SMS_CONSENT_TEXT } from '@/lib/sms-consent';

const RESEND_COOLDOWN = 60;

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <VerifyPhoneContent />
    </Suspense>
  );
}

type Step = 'phone' | 'otp';

function VerifyPhoneContent() {
  const router = useRouter();
  const { user, loading, sendPhoneVerificationCode, verifyPhoneCode } = useAuth();

  // Always start on the phone step. The OTP step says "we sent a code", so it
  // must only be reachable after a send has actually succeeded — otherwise a
  // failed send leaves the user looking at a claim that is not true.
  const userHasPhone = Boolean(user?.phoneNumber);
  const [step, setStep] = useState<Step>('phone');
  /** The number a successful send actually went to. */
  const [sentTo, setSentTo] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [autoSent, setAutoSent] = useState(false);
  // Consent already recorded at signup, if any. Users who declined there see
  // the checkbox here, unchecked, and can still skip the whole step.
  const alreadyConsented = Boolean(user?.smsConsent);
  const [smsConsent, setSmsConsent] = useState(false);
  const hasConsent = alreadyConsented || smsConsent;

  const fullPhoneNumber =
    step === 'otp' && sentTo
      ? sentTo
      : `${countryCode}${phoneLocal.replace(/\D/g, '')}`;

  // Redirect if not logged in or not email-verified
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && !user.emailVerified) {
      router.push(`/verify-email?email=${encodeURIComponent(user.email)}`);
    }
  }, [user, loading, router]);

  // Redirect if already phone-verified
  useEffect(() => {
    if (!loading && user?.isPhoneVerified) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Auto-send OTP if phone was collected during signup
  useEffect(() => {
    // Only auto-send when consent is already on record. Never send on page
    // load to someone who has not opted in.
    if (!loading && user?.phoneNumber && !user.isPhoneVerified && !autoSent && alreadyConsented) {
      const target = user.phoneNumber;
      setAutoSent(true);
      setIsSending(true);
      sendPhoneVerificationCode(target)
        .then((result) => {
          if (result?.code) {
            console.log('[Phone verification] Code:', result.code);
          }
          // Only now is it true that a code was sent.
          setSentTo(target);
          setStep('otp');
          setResendCooldown(RESEND_COOLDOWN);
        })
        .catch((err) => {
          setError(getErrorMessage(err, 'Failed to send code'));
        })
        .finally(() => {
          setIsSending(false);
        });
    }
  }, [loading, user, autoSent, alreadyConsented, sendPhoneVerificationCode]);

  // Prefill from the number captured at signup, so starting on the phone step
  // does not lose it. Longest matching dial code wins (+1 vs +12 etc).
  useEffect(() => {
    if (!user?.phoneNumber || phoneLocal) return;
    const codes = [...new Set(COUNTRY_CODES.map((c) => c.code))].sort(
      (a, b) => b.length - a.length,
    );
    const match = codes.find((c) => user.phoneNumber!.startsWith(c));
    if (match) {
      setCountryCode(match);
      setPhoneLocal(user.phoneNumber!.slice(match.length));
    } else {
      setPhoneLocal(user.phoneNumber!.replace(/\D/g, ''));
    }
  }, [user?.phoneNumber, phoneLocal]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendCode = async () => {
    const digits = phoneLocal.replace(/\D/g, '');
    if (!digits) {
      setError('Phone number is required');
      return;
    }
    if (!hasConsent) {
      setError('Please agree to receive SMS messages before we send a code.');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      const target = fullPhoneNumber;
      const result = await sendPhoneVerificationCode(target, smsConsent || undefined);
      if (result?.code) {
        console.log('[Phone verification] Code:', result.code);
      }
      setSentTo(target);
      setStep('otp');
      setResendCooldown(RESEND_COOLDOWN);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to send code'));
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setIsVerifying(true);
    setError('');

    try {
      await verifyPhoneCode(code);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Verification failed'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsSending(true);
    setError('');

    try {
      const result = await sendPhoneVerificationCode(fullPhoneNumber);
      if (result?.code) {
        console.log('[Phone verification] Code:', result.code);
      }
      setResendCooldown(RESEND_COOLDOWN);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to resend code'));
    } finally {
      setIsSending(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setError('');
  };

  if (loading || !user) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Brand Panel — lg+ */}
      <div className="hidden lg:flex lg:w-120 xl:w-130 shrink-0 bg-linear-to-br from-indigo-600 via-indigo-700 to-violet-800 relative overflow-hidden flex-col justify-center px-12 xl:px-16">
        <div className="absolute top-20 -left-16 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />
        <div className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-violet-400/20 rounded-full blur-2xl" />

        <div className="relative">
          <Link href="/">
            <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-900/30">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </Link>

          <h1 className="text-3xl xl:text-4xl font-bold text-white mb-3">
            One last step
          </h1>
          <p className="text-indigo-200 text-lg mb-8 max-w-sm leading-relaxed">
            Adding a verified phone number helps secure your account. It is optional — you can skip it and continue.
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
                <Smartphone className="w-7 h-7 text-white" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                Verify Your Phone
              </h1>
            </Link>
          </div>

          {/* Desktop Heading */}
          <div className="hidden lg:block mb-8 text-center">
            <div className="w-14 h-14 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {step === 'phone' ? 'Verify your phone number' : 'Enter verification code'}
            </h2>
            <p className="text-slate-500">
              {step === 'phone'
                ? 'Optional — you can skip this and use Ovrlap without SMS'
                : `We sent a 6-digit code to ${fullPhoneNumber}`}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-200/60 px-5 py-6 sm:p-8">
            {step === 'phone' ? (
              <PhoneStep
                countryCode={countryCode}
                onCountryCodeChange={setCountryCode}
                phoneLocal={phoneLocal}
                onPhoneLocalChange={(v) => {
                  setPhoneLocal(v);
                  setError('');
                }}
                onSubmit={handleSendCode}
                isSending={isSending}
                error={error}
                smsConsent={smsConsent}
                alreadyConsented={alreadyConsented}
                onSmsConsentChange={(v) => {
                  setSmsConsent(v);
                  setError('');
                }}
                onSkip={() => router.push('/dashboard')}
              />
            ) : (
              <OtpStep
                phoneNumber={fullPhoneNumber}
                onVerify={handleVerifyCode}
                onResend={handleResend}
                onBack={handleBackToPhone}
                isVerifying={isVerifying}
                isResending={isSending}
                resendCooldown={resendCooldown}
                error={error}
              />
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-8">
            {step === 'phone'
              ? 'Your phone number is used only to send account verification codes'
              : 'The code expires in 10 minutes'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function PhoneStep({
  countryCode,
  onCountryCodeChange,
  phoneLocal,
  onPhoneLocalChange,
  onSubmit,
  isSending,
  error,
  smsConsent,
  alreadyConsented,
  onSmsConsentChange,
  onSkip,
}: {
  countryCode: string;
  onCountryCodeChange: (v: string) => void;
  phoneLocal: string;
  onPhoneLocalChange: (v: string) => void;
  onSubmit: () => void;
  isSending: boolean;
  error: string;
  smsConsent: boolean;
  alreadyConsented: boolean;
  onSmsConsentChange: (v: boolean) => void;
  onSkip: () => void;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Phone Number{' '}
          <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <div className="flex gap-2">
          <CountryCodeSelect
            value={countryCode}
            onChange={onCountryCodeChange}
          />
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Phone className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={15}
              value={phoneLocal}
              onChange={(e) => onPhoneLocalChange(e.target.value.replace(/\D/g, '').slice(0, 15))}
              placeholder="5551234567"
              className={`block w-full pl-10 pr-4 py-2.5 text-sm text-slate-900 bg-white border rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:bg-white focus:shadow-sm transition-all ${
                error
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
              }`}
              autoComplete="tel-national"
              autoFocus
            />
          </div>
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* A2P 10DLC consent — an explicit checkbox, not implied by continuing */}
      {alreadyConsented ? (
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <p className="text-xs text-emerald-800 leading-relaxed">
            You agreed to receive Ovrlap verification codes by SMS when you signed up.
            Reply STOP to any message to opt out, or HELP for help.
          </p>
        </div>
      ) : (
        <label className="flex items-start gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={smsConsent}
            onChange={(e) => onSmsConsentChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 accent-indigo-600"
          />
          <div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {SMS_CONSENT_TEXT}
            </p>
            <div className="flex gap-3 mt-2">
              <Link
                href="/terms"
                target="_blank"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                target="_blank"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </Link>
              <Link
                href="/sms-opt-in"
                target="_blank"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                SMS Terms
              </Link>
            </div>
          </div>
        </label>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSending}
        className="w-full shadow-lg shadow-indigo-500/25"
      >
        Send verification code
        <ArrowRight className="w-4 h-4" />
      </Button>

      <button
        type="button"
        onClick={onSkip}
        className="w-full text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
      >
        Skip for now — continue without SMS
      </button>
    </form>
  );
}

function OtpStep({
  phoneNumber,
  onVerify,
  onResend,
  onBack,
  isVerifying,
  isResending,
  resendCooldown,
  error,
}: {
  phoneNumber: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  onBack: () => void;
  isVerifying: boolean;
  isResending: boolean;
  resendCooldown: number;
  error: string;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-2 lg:hidden">
        <p className="text-slate-500">We sent a 6-digit code to</p>
        <p className="text-indigo-600 font-semibold">{phoneNumber}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
          Enter your 6-digit code
        </label>
        <CodeInput
          onComplete={onVerify}
          disabled={isVerifying}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600 text-center">{error}</p>
        </div>
      )}

      {isVerifying && (
        <div className="flex items-center justify-center gap-2 text-indigo-600">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Verifying...</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Edit phone
        </button>

        <button
          onClick={onResend}
          disabled={isResending || resendCooldown > 0}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {isResending ? (
            <span className="flex items-center gap-1">
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
  );
}
