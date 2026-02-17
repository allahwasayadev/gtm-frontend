'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, LoadingScreen } from '@/components/ui';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, ArrowLeftRight, Check } from 'lucide-react';
import Link from 'next/link';

const features = [
  'Upload your account lists securely',
  'Connect with collaboration partners',
  'Discover matching accounts instantly',
];

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { login, user, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo || '/dashboard');
    }
  }, [user, loading, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(formData.email, formData.password);
      router.push(redirectTo || '/dashboard');
    } catch (error) {
      // Error is handled by AuthContext with toast
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || user) {
    return <LoadingScreen message="Checking authentication..." />;
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
            GTM Account Mapper
          </h1>
          <p className="text-indigo-200 text-lg mb-12 max-w-sm leading-relaxed">
            Find account overlaps with your go-to-market partners in seconds.
          </p>

          <div className="space-y-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <span className="text-indigo-100 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 min-h-screen bg-linear-to-br from-indigo-50 via-white to-sky-50 lg:bg-slate-50/80 flex items-center justify-center p-4 sm:p-8">
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
                className="w-14 h-14 bg-linear-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              >
                <ArrowRight className="w-7 h-7 text-white" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 transition-colors group-hover:text-indigo-600">
                GTM Account Mapper
              </h1>
            </Link>
            <p className="text-slate-500">Welcome back! Sign in to continue.</p>
          </div>

          {/* Desktop Heading */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500">Sign in to your account to continue</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-200/60 px-5 py-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address"
                icon={Mail}
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                autoComplete="email"
              />

              <Input
                label="Password"
                icon={Lock}
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full shadow-lg shadow-indigo-500/25"
              >
                Sign In
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-center text-sm text-slate-500">
                Don&apos;t have an account?{' '}
                <Link
                  href="/signup"
                  className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Create account
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-8">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </div>
  );
}
