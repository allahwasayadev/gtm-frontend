'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/ui';

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
    try {
      await requestPasswordReset(identifier.trim());
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
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-indigo-50 flex items-center justify-center p-4 sm:p-8">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Reset your password
          </h1>
          <p className="text-slate-500 text-sm">
            {submitted
              ? 'Check your phone'
              : 'Enter your email address or mobile number.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-200/60 px-5 py-6 sm:p-8">
          {submitted ? (
            <>
              <p className="text-sm text-slate-600 leading-relaxed">
                If an account exists with a verified mobile number, we have sent
                a 6-digit reset code to it by text.
              </p>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
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
                    `/reset-password?identifier=${encodeURIComponent(identifier.trim())}`,
                  )
                }
              >
                I have a code
              </Button>
            </>
          ) : (
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

          <div className="text-center mt-6 pt-4 border-t border-slate-100">
            <Link
              href="/login"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
