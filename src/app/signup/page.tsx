'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/features/auth/types';
import { Button, Input, Dropdown, LoadingScreen, CountryCodeSelect } from '@/components/ui';
import { motion } from 'framer-motion';
import { User, Building2, Mail, Lock, ArrowRight, Check, Phone } from 'lucide-react';
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
  const [formData, setFormData] = useState<{
    name: string;
    company: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: UserRole | null;
    countryCode: string;
    phoneLocal: string;
    smsConsent: boolean;
  }>({
    name: '',
    company: '',
    email: prefillEmail || '',
    password: '',
    confirmPassword: '',
    role: null,
    countryCode: '+1',
    phoneLocal: '',
    smsConsent: false,
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

    if (formData.role === null) {
      newErrors.role = 'Please select your role';
    }

    const phoneDigits = formData.phoneLocal.replace(/\D/g, '');
    if (!phoneDigits) {
      newErrors.phone = 'Phone number is required';
    } else {
      const fullPhone = `${formData.countryCode}${phoneDigits}`;
      if (!/^\+[1-9]\d{7,14}$/.test(fullPhone)) {
        newErrors.phone = 'Enter a valid phone number';
      }
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
      const selectedRole = formData.role as UserRole;
      const phoneNumber = `${formData.countryCode}${formData.phoneLocal.replace(/\D/g, '')}`;
      await signup(formData.name, formData.email, formData.password, [selectedRole], formData.company || undefined, phoneNumber);
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch {
      // Error is handled by AuthContext with toast
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || user) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  return (
    <div className="min-h-screen flex lg:h-screen lg:overflow-hidden">
      {/* Brand Panel — lg+ */}
      <div className="hidden lg:flex lg:h-screen lg:w-120 xl:w-130 shrink-0 bg-linear-to-br from-indigo-600 via-indigo-700 to-violet-800 relative overflow-hidden flex-col justify-center px-12 xl:px-16">
        {/* Decorative elements */}
        <div className="absolute top-20 -left-16 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />
        <div className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-violet-400/20 rounded-full blur-2xl" />

        <div className="relative">
          <Link href="/" className="inline-block mb-8">
            <img src="/ovrlap-logo-white.svg" alt="Ovrlap" className="h-16 w-auto" />
          </Link>

          <h1 className="text-3xl xl:text-4xl font-bold text-white mb-3">
            Join Ovrlap
          </h1>
          <p className="text-indigo-200 text-lg mb-12 max-w-sm leading-relaxed">
            Start finding account overlaps with your go-to-market partners today.
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
      <div className="flex-1 min-h-screen lg:h-screen bg-linear-to-br from-sky-50 via-white to-indigo-50 lg:bg-slate-50/80 flex items-center lg:items-start justify-center p-4 sm:p-8 lg:overflow-y-auto">
        <motion.div
          className="w-full max-w-md lg:py-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Mobile/Tablet Logo + Title */}
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-block group">
              <motion.div
                className="flex justify-center mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              >
                <img src="/ovrlap-logo.svg" alt="Ovrlap" className="h-14 w-auto" />
              </motion.div>
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
                helperText="Shown on your profile and used to group your workspace."
                autoComplete="organization"
              />

              <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Role<span className="text-red-500 ml-1">*</span>
                </label>
                <Dropdown
                  aria-label="Role"
                  placeholder="Select role"
                  options={[
                    { value: 'OEM', label: 'OEM Seller (manufacture or supply)' },
                    { value: 'Reseller', label: 'Reseller (sell or distribute)' },
                  ]}
                  value={formData.role ?? ''}
                  onChange={(v) => {
                    setFormData({
                      ...formData,
                      role: (v === 'OEM' || v === 'Reseller') ? v : null,
                    });
                    setErrors({ ...errors, role: '' });
                  }}
                />
                {errors.role && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.role}</p>
                )}
                {!errors.role && (
                  <p className="mt-1.5 text-sm text-slate-500">This helps us show the right labels and connection context.</p>
                )}
              </div>

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

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <CountryCodeSelect
                    value={formData.countryCode}
                    onChange={(code) => {
                      setFormData({ ...formData, countryCode: code });
                      setErrors({ ...errors, phone: '' });
                    }}
                  />
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={15}
                      value={formData.phoneLocal}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 15);
                        setFormData({ ...formData, phoneLocal: digits });
                        setErrors({ ...errors, phone: '' });
                      }}
                      placeholder="5551234567"
                      className={`block w-full pl-10 pr-4 py-2.5 text-sm text-slate-900 bg-white border rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:bg-white focus:shadow-sm transition-all ${
                        errors.phone
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                      }`}
                      autoComplete="tel-national"
                    />
                  </div>
                </div>
                {errors.phone && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* SMS Consent Checkbox (A2P 10DLC) */}
              <label className="flex items-start gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.smsConsent}
                  onChange={(e) => setFormData({ ...formData, smsConsent: e.target.checked })}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 accent-indigo-600"
                />
                <div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    I agree to receive automated SMS verification codes from Ovrlap for account security. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help.
                  </p>
                  <div className="flex gap-3 mt-2">
                    <a
                      href="https://ovrlap.app/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Terms
                    </a>
                    <a
                      href="https://ovrlap.app/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Privacy Policy
                    </a>
                  </div>
                </div>
              </label>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={!formData.smsConsent}
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
