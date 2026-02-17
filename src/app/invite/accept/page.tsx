'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { invitesApi } from '@/features/invites/invites.api';
import type { InviteValidation } from '@/features/invites/types';
import { Button, LoadingScreen } from '@/components/ui';
import { motion } from 'framer-motion';
import { X, Users, Handshake } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function InviteAcceptPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <InviteAcceptContent />
    </Suspense>
  );
}

function InviteAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const token = searchParams.get('token');

  const [validation, setValidation] = useState<InviteValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidation({ valid: false, status: 'missing', message: 'No invite token provided.' });
      setLoading(false);
      return;
    }

    invitesApi
      .validate(token)
      .then((res) => setValidation(res.data))
      .catch(() =>
        setValidation({ valid: false, status: 'error', message: 'Failed to validate invite.' }),
      )
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const res = await invitesApi.accept(token);
      toast.success(res.data.message);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to accept invite.';
      toast.error(msg);
      setAccepting(false);
    }
  };

  // Auto-accept when logged-in user lands on valid invite (e.g. after signup/login redirect)
  useEffect(() => {
    if (user && validation?.valid && !accepting) {
      handleAccept();
    }
  }, [user, validation]);

  if (loading || authLoading) {
    return <LoadingScreen message="Validating invite..." />;
  }

  const redirectPath = `/invite/accept?token=${token}`;

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-sky-50 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 transition-colors group-hover:text-indigo-600">
              GTM Account Mapper
            </h1>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-200/60 px-5 py-6 sm:p-8">
          {!validation?.valid ? (
            /* Invalid / Expired State */
            <div className="text-center">
              <motion.div
                className="w-16 h-16 bg-linear-to-br from-red-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              >
                <X className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {validation?.status === 'expired' ? 'Invite Expired' : 'Invalid Invite'}
              </h2>
              <p className="text-slate-500 mb-6">
                {validation?.message || 'This invite link is not valid.'}
              </p>
              <Link href="/login">
                <Button variant="primary" size="lg" className="w-full">
                  Go to Login
                </Button>
              </Link>
            </div>
          ) : (
            /* Valid Invite */
            <div className="text-center">
              <motion.div
                className="w-16 h-16 bg-linear-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              >
                <Handshake className="w-8 h-8 text-white" />
              </motion.div>

              <h2 className="text-xl font-bold text-slate-900 mb-1">
                You&apos;re Invited!
              </h2>
              <p className="text-slate-500 mb-6">
                <span className="font-semibold text-slate-900">
                  {validation.inviterName}
                </span>
                {validation.inviterCompany && (
                  <span className="text-slate-400"> from {validation.inviterCompany}</span>
                )}{' '}
                wants to connect with you on GTM Account Mapper.
              </p>

              {user ? (
                /* Flow 1: Already logged in */
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={accepting}
                  onClick={handleAccept}
                >
                  Accept &amp; Connect
                </Button>
              ) : (
                /* Flow 2 & 3: Not logged in */
                <div className="space-y-3">
                  <Link href={`/login?redirect=${encodeURIComponent(redirectPath)}`}>
                    <Button variant="primary" size="lg" className="w-full">
                      Sign In to Accept
                    </Button>
                  </Link>
                  <Link
                    href={`/signup?redirect=${encodeURIComponent(redirectPath)}&email=${encodeURIComponent(validation.invitedEmail || '')}`}
                  >
                    <Button variant="outline" size="lg" className="w-full">
                      Create Account to Accept
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          Compare account lists and find overlaps with your partners
        </p>
      </motion.div>
    </div>
  );
}
