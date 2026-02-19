'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/features/auth/auth.api';
import { Button, Input } from '@/components/ui';
import { motion } from 'framer-motion';
import { Lock, ArrowLeftRight, ArrowLeft, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/error-utils';

type PageState = 'loading' | 'valid' | 'invalid' | 'success';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const token = searchParams.get('token');

  const [pageState, setPageState] = useState<PageState>('loading');
  const [userEmail, setUserEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setPageState('invalid');
        return;
      }

      try {
        const response = await authApi.validateResetToken(token);
        if (response.data.valid) {
          setUserEmail(response.data.email ?? '');
          setPageState('valid');
        } else {
          setPageState('invalid');
        }
      } catch {
        setPageState('invalid');
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword.trim()) {
      setError('Password is required');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(token!, newPassword);
      setPageState('success');
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to reset password. Please try again.');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (pageState) {
      case 'loading':
        return (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Validating reset link...</p>
          </div>
        );

      case 'invalid':
        return (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Invalid or Expired Link</h3>
            <p className="text-slate-500 mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link href="/forgot-password">
              <Button variant="primary" size="lg" className="w-full">
                Request New Link
              </Button>
            </Link>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Password Reset Successfully</h3>
            <p className="text-slate-500 mb-6">
              Your password has been reset. You can now sign in with your new password.
            </p>
            <Link href="/login">
              <Button variant="primary" size="lg" className="w-full">
                <ArrowLeft className="w-4 h-4" />
                Sign In
              </Button>
            </Link>
          </div>
        );

      case 'valid':
        return (
          <>
            {userEmail && (
              <p className="text-sm text-slate-500 mb-5">
                Resetting password for <span className="font-medium text-slate-700">{userEmail}</span>
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <Input
                  label="New Password"
                  icon={Lock}
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirm Password"
                  icon={Lock}
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full shadow-lg shadow-indigo-500/25"
              >
                Reset Password
              </Button>
            </form>
          </>
        );
    }
  };

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
            Create a new password
          </h1>
          <p className="text-indigo-200 text-lg mb-8 max-w-sm leading-relaxed">
            Choose a strong password to keep your account secure.
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
                className="w-14 h-14 bg-linear-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              >
                <Lock className="w-7 h-7 text-white" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                New Password
              </h1>
            </Link>
          </div>

          {/* Desktop Heading */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Set your new password</h2>
            <p className="text-slate-500">Enter a new password for your account</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-200/60 px-5 py-6 sm:p-8">
            {renderContent()}

            {pageState === 'valid' && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-center text-sm text-slate-500">
                  Remember your password?{' '}
                  <Link
                    href="/login"
                    className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
