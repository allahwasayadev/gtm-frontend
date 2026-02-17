'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, LoadingScreen } from '@/components/ui';
import { motion } from 'framer-motion';
import { User, Building2, Mail, Lock, ArrowRight, ArrowLeftRight, UserPlus, Check } from 'lucide-react';
import Link from 'next/link';

const features = [
  'Upload your account lists securely',
  'Connect with collaboration partners',
  'Discover matching accounts instantly',
];

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const prefillEmail = searchParams.get('email');
  const { signup, user, loading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: prefillEmail || '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo || '/dashboard');
    }
  }, [user, loading, router, redirectTo]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(formData.name, formData.email, formData.password, formData.company || undefined);
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
                className="w-14 h-14 bg-linear-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              >
                <UserPlus className="w-7 h-7 text-white" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 transition-colors group-hover:text-indigo-600">
                GTM Account Mapper
              </h1>
            </Link>
            <p className="text-slate-500">Create your account to get started</p>
          </div>

          {/* Desktop Heading */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Get started</h2>
            <p className="text-slate-500">Create your account in seconds</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-200/60 px-5 py-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Full Name"
                icon={User}
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setErrors({ ...errors, name: '' });
                }}
                placeholder="John Doe"
                error={errors.name}
                autoComplete="name"
              />

              <Input
                label="Company Name"
                icon={Building2}
                type="text"
                value={formData.company}
                onChange={(e) => {
                  setFormData({ ...formData, company: e.target.value });
                }}
                placeholder="Acme Corp"
                helperText="Used for grouping and context"
                autoComplete="organization"
              />

              <Input
                label="Email Address"
                icon={Mail}
                type="email"
                required
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setErrors({ ...errors, email: '' });
                }}
                placeholder="you@example.com"
                error={errors.email}
                autoComplete="email"
              />

              <Input
                label="Password"
                icon={Lock}
                type="password"
                required
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setErrors({ ...errors, password: '' });
                }}
                placeholder="Minimum 8 characters"
                error={errors.password}
                helperText="Must be at least 8 characters"
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                icon={Lock}
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  setErrors({ ...errors, confirmPassword: '' });
                }}
                placeholder="Re-enter your password"
                error={errors.confirmPassword}
                autoComplete="new-password"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full shadow-lg shadow-indigo-500/25"
              >
                Create Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-8">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </div>
  );
}
