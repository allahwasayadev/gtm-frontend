'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/ui';
import { normalizeResetIdentifier } from '@/lib/phone';
import { rearmWebOtp } from '@/lib/web-otp';

/**
 * Step 1 of reset: identify the account.
 *
 * Accepts an email address OR a mobile number, but the code only ever goes to
 * the account's VERIFIED phone. The response is identical whatever is true —
 * unknown account, no verified phone, opted out, rate-limited — so this screen
 * must not branch on it either.
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const { requestPasswordReset } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setIsSubmitting(true);
    // The reset code is texted by this request, and the next screen is a
    // client-side navigation away, so a code collected here survives to it.
    rearmWebOtp();
    try {
      // This field takes an email address OR a number, so it keeps no +1
      // prefix of its own. But ten digits is now the only way a US user has
      // ever entered their number, so that is canonicalised to +1XXXXXXXXXX
      // before it goes — otherwise it would not match the stored number.
      // Anything else is sent exactly as typed, never trimmed to fit.
      await requestPasswordReset(normalizeResetIdentifier(identifier));
      setSubmitted(true);
    } catch {
      // Handled by the context toast. Still show the neutral screen: a visible
      // failure here would itself hint at whether the account exists.
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen via-white flex items-center justify-center p-4 sm:p-8">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">
            Reset your password
          </h1>
          <p className="text-ink-3 text-sm">
            {submitted
              ? 'Check your phone'
              : 'Enter your email address or mobile number.'}
          </p>
        </div>

        <div className="bg-surface rounded-lg shadow-card border border-hairline px-5 py-6 sm:p-8">
          {submitted ? (
            <>
              <p className="text-sm text-ink-2 leading-relaxed">
                If an account exists with a verified mobile number, we have sent
                a 6-digit reset code to it by text.
              </p>
              <p className="text-xs text-ink-3 mt-3 leading-relaxed">
                Codes are only sent to a number that has already been verified
                on the account. If you no longer have access to that number,
                contact support.
              </p>
              <Button
                variant="primary"
                size="lg"
                className="w-full mt-6"
                onClick={() =>
                  router.push(
                    `/reset-password?identifier=${encodeURIComponent(
                      normalizeResetIdentifier(identifier),
                    )}`,
                  )
                }
              >
                I have a code
              </Button>
            </>
          ) : (
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
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full"
              >
                Send reset code
              </Button>
            </form>
          )}

          <div className="text-center mt-6 pt-4 border-t border-hairline">
            <Link
              href="/login"
              className="text-sm font-semibold text-accent hover:text-accent-ink inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
