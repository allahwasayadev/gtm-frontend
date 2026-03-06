'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Factory,
  Mail,
  Phone,
  Save,
  Shield,
  Store,
  Trash2,
  User,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/features/users/users.api';
import {
  Button, ConfirmationModal, FadeIn, Input, LoadingScreen, PageTransition,
} from '@/components/ui';
import { getErrorMessage } from '@/lib/error-utils';

type ProfileFormState = {
  name: string;
  email: string;
  phoneNumber: string;
  company: string;
  /** Single business role for form: OEM or Reseller (Admin is not user-editable) */
  role: 'OEM' | 'Reseller';
};

function normalizePhoneForCompare(phoneNumber: string): string {
  return phoneNumber.trim().replace(/[\s().-]/g, '');
}

function isValidPhoneNumber(phoneNumber: string): boolean {
  const normalized = normalizePhoneForCompare(phoneNumber);
  return /^\+[1-9]\d{7,14}$/.test(normalized);
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, updateUser, deleteAccount } = useAuth();
  const [formData, setFormData] = useState<ProfileFormState>({
    name: '',
    email: '',
    phoneNumber: '',
    company: '',
    role: 'Reseller',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingPhoneCode, setIsSendingPhoneCode] = useState(false);
  const [isVerifyingPhoneCode, setIsVerifyingPhoneCode] = useState(false);
  const [isEmailEditingEnabled, setIsEmailEditingEnabled] = useState(false);
  const [showVerifyPhoneModal, setShowVerifyPhoneModal] = useState(false);
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const [modalAnimate, setModalAnimate] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showVerifyPhoneModal) {
      const id = requestAnimationFrame(() => setModalAnimate(true));
      return () => cancelAnimationFrame(id);
    } else {
      setModalAnimate(false);
    }
  }, [showVerifyPhoneModal]);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      const businessRole = user.roles?.includes('OEM') ? 'OEM' : 'Reseller';
      setFormData({
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        company: user.company || '',
        role: businessRole,
      });
      setIsEmailEditingEnabled(false);
      setVerifyCodeInput('');
    }
  }, [user, loading, router]);

  const normalizedUserPhone = normalizePhoneForCompare(user?.phoneNumber || '');
  const normalizedFormPhone = normalizePhoneForCompare(formData.phoneNumber);
  const hasPhoneNumber = Boolean(formData.phoneNumber.trim());
  const isPhoneVerifiedForCurrentPhone = Boolean(
    user?.isPhoneVerified
      && normalizedUserPhone
      && normalizedFormPhone
      && normalizedUserPhone === normalizedFormPhone,
  );

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

    if (formData.phoneNumber.trim() && !isValidPhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Use E.164 format (example: +15551234567)';
    }

    if (user && formData.email !== user.email && !isPhoneVerifiedForCurrentPhone) {
      newErrors.email = 'Please verify your phone number before updating the email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendPhoneVerificationCode = async (triggeredByEmailUpdate = false) => {
    if (!user) return;

    if (!formData.phoneNumber.trim()) {
      setErrors((prev) => ({ ...prev, phoneNumber: 'Phone number is required' }));
      return;
    }

    if (!isValidPhoneNumber(formData.phoneNumber)) {
      setErrors((prev) => ({ ...prev, phoneNumber: 'Use E.164 format (example: +15551234567)' }));
      return;
    }

    if (isPhoneVerifiedForCurrentPhone) {
      if (triggeredByEmailUpdate) {
        setIsEmailEditingEnabled(true);
      } 
      return;
    }

    setIsSendingPhoneCode(true);
    try {
      const response = await usersApi.sendPhoneVerificationCode({
        phoneNumber: formData.phoneNumber,
      });
      const result = response.data;

      setFormData((prev) => ({
        ...prev,
        phoneNumber: result.phoneNumber,
      }));

      updateUser(
        {
          ...user,
          phoneNumber: result.phoneNumber,
          isPhoneVerified: result.isPhoneVerified,
        },
        undefined,
      );

      if (result.isPhoneVerified) {
        setIsEmailEditingEnabled(true);
        toast.success(result.message);
        return;
      }

      setShowVerifyPhoneModal(true);
      setIsEmailEditingEnabled(false);
      toast.success('Verification code sent to your phone.');
      if (result.code) {
        console.log('[Phone verification] Code sent to', result.phoneNumber, ':', result.code);
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to send verification code'));
    } finally {
      setIsSendingPhoneCode(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    if (!user) return;

    if (!/^\d{6}$/.test(verifyCodeInput.trim())) {
      setErrors((prev) => ({
        ...prev,
        verifyCode: 'Enter the 6-digit code from the SMS',
      }));
      return;
    }

    setIsVerifyingPhoneCode(true);
    setErrors((prev) => ({ ...prev, verifyCode: '' }));
    try {
      const response = await usersApi.verifyPhoneVerificationCode({
        code: verifyCodeInput.trim(),
      });
      const result = response.data;

      updateUser(
        {
          ...user,
          phoneNumber: result.phoneNumber,
          isPhoneVerified: true,
        },
        undefined,
      );
      setFormData((prev) => ({ ...prev, phoneNumber: result.phoneNumber }));
      setIsEmailEditingEnabled(true);
      setShowVerifyPhoneModal(false);
      setVerifyCodeInput('');
      toast.success('Phone verified. You can now update your email.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to verify code'));
    } finally {
      setIsVerifyingPhoneCode(false);
    }
  };

  const handleVerifyNowClick = async () => {
    await handleSendPhoneVerificationCode(false);
  };

  const handleEnableEmailUpdate = async () => {
    if (!isPhoneVerifiedForCurrentPhone) {
      await handleSendPhoneVerificationCode(true);
      return;
    }

    setIsEmailEditingEnabled(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await usersApi.updateProfile({
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        company: formData.company,
        roles: [formData.role],
      });
      const { token, ...updatedUser } = response.data;

      updateUser(
        {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          company: updatedUser.company,
          roles: updatedUser.roles ?? [],
          hasCompletedOnboarding: updatedUser.hasCompletedOnboarding,
          emailVerified: user?.emailVerified ?? false,
          phoneNumber: updatedUser.phoneNumber ?? null,
          isPhoneVerified: updatedUser.isPhoneVerified,
          createdAt: updatedUser.createdAt,
        },
        token,
      );

      setIsEmailEditingEnabled(false);
      if (!updatedUser.isPhoneVerified) {
      } 
      toast.success('Profile updated successfully!');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update profile'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (loading || !user) {
    return <LoadingScreen message="Loading profile..." />;
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50/50">
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FadeIn>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
              <p className="text-slate-500 mt-1">Manage your account information</p>
            </div>
          </FadeIn>

          <div className="space-y-6">
            <FadeIn delay={0.1}>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-linear-to-r from-indigo-500 via-indigo-600 to-violet-600 px-6 py-8">
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative">
                      <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 shadow-xl">
                        <span className="text-3xl font-bold text-white">{getInitials(user.name)}</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-lg border-2 border-white flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <div className="text-center sm:text-left">
                      <h2 className="text-xl font-bold text-white">{user.name}</h2>
                      <p className="text-indigo-100 text-sm">{user.email}</p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-lg text-xs font-medium text-white">
                          {user.roles?.includes('OEM') ? <Factory className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                          {user.roles?.includes('OEM') ? 'OEM Seller' : 'Reseller'}
                        </span>
                        {user.company && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-lg text-xs font-medium text-white">
                            <Building2 className="w-3 h-3" />
                            {user.company}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
                  <div className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      Member since
                    </div>
                    <p className="font-semibold text-slate-900">{formatDate(user.createdAt)}</p>
                  </div>
                  <div className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mb-1">
                      <Shield className="w-4 h-4" />
                      Status
                    </div>
                    <p className="font-semibold text-emerald-600 flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      Active
                    </p>
                  </div>
                  <div className="px-6 py-4 text-center hidden sm:block">
                    <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mb-1">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                    <p className={`font-semibold ${user.emailVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {user.emailVerified ? 'Verified' : 'Pending'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                  <div className="grid gap-6">
                    <div className="grid sm:grid-cols-2 gap-5">
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

                      <div className="w-full">
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <label className="block text-sm font-medium text-slate-700">
                            Email Address
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleEnableEmailUpdate}
                            isLoading={isSendingPhoneCode}
                          >
                            Update Email
                          </Button>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Mail className="w-4 h-4 text-slate-400" />
                          </div>
                          <input
                            className={`
                              block w-full pl-10 pr-4 py-2.5 text-sm text-slate-900
                              bg-white border rounded-xl
                              placeholder:text-slate-400
                              focus:outline-none focus:ring-2 focus:ring-offset-0 focus:bg-white focus:shadow-sm
                              transition-all duration-200
                              disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
                              ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'}
                            `}
                            type="email"
                            required
                            value={formData.email}
                            disabled={!isEmailEditingEnabled}
                            onChange={(e) => {
                              setFormData({ ...formData, email: e.target.value });
                              setErrors({ ...errors, email: '' });
                            }}
                            placeholder="you@example.com"
                            autoComplete="email"
                          />
                        </div>
                        {errors.email && (
                          <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
                        )}
                        {!errors.email && (
                          <p className="mt-1.5 text-sm text-slate-500">
                            {isEmailEditingEnabled
                              ? 'Phone verified. You can edit your email now.'
                              : !hasPhoneNumber
                                ? 'Add a phone number to your account to unlock email updates.'
                                : 'Email editing is locked until your current phone number is verified.'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <Input
                          label="Phone Number"
                          icon={Phone}
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => {
                            const nextPhone = e.target.value;
                            setFormData((prev) => ({ ...prev, phoneNumber: nextPhone }));
                            setErrors((prev) => ({ ...prev, phoneNumber: '' }));
                            setIsEmailEditingEnabled(false);
                            setShowVerifyPhoneModal(false);
                            setVerifyCodeInput('');
                            setErrors((prev) => ({ ...prev, verifyCode: '' }));

                            const normalizedNextPhone = normalizePhoneForCompare(nextPhone);
                            const normalizedStoredPhone = normalizePhoneForCompare(user.phoneNumber || '');
                            if (!user.isPhoneVerified || normalizedNextPhone !== normalizedStoredPhone) {
                            } 
                          }}
                          placeholder="+15551234567"
                          helperText={
                            hasPhoneNumber
                              ? 'Required to unlock email updates. Use E.164 format.'
                              : 'Add a phone number for account recovery and to unlock email updates. Use E.164 format.'
                          }
                          error={errors.phoneNumber}
                          autoComplete="tel"
                        />
                        {hasPhoneNumber && !isPhoneVerifiedForCurrentPhone && (
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-amber-600">Not verified yet</span>
                            <span className="text-slate-300">·</span>
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={handleVerifyNowClick}
                              isLoading={isSendingPhoneCode}
                            >
                              Verify now?
                            </Button>
                          </div>
                        )}
                      </div>

                      <Input
                        label="Company"
                        icon={Building2}
                        type="text"
                        value={formData.company}
                        onChange={(e) =>
                          setFormData({ ...formData, company: e.target.value })}
                        placeholder="Acme Inc."
                        helperText="Optional — helps partners identify your organization"
                        autoComplete="organization"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Your Role
                      </label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <label
                          className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.role === 'OEM'
                              ? 'border-indigo-500 bg-indigo-50/50'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            className="sr-only"
                            checked={formData.role === 'OEM'}
                            onChange={() => setFormData({ ...formData, role: 'OEM' })}
                          />
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            formData.role === 'OEM' ? 'bg-indigo-500' : 'bg-slate-100'
                          }`}
                          >
                            <Factory className={`w-6 h-6 ${formData.role === 'OEM' ? 'text-white' : 'text-slate-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${formData.role === 'OEM' ? 'text-indigo-900' : 'text-slate-900'}`}>
                              OEM Seller
                            </p>
                            <p className="text-sm text-slate-500 truncate">Original equipment manufacturer</p>
                          </div>
                          {formData.role === 'OEM' && (
                            <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                          )}
                        </label>

                        <label
                          className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.role === 'Reseller'
                              ? 'border-indigo-500 bg-indigo-50/50'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            className="sr-only"
                            checked={formData.role === 'Reseller'}
                            onChange={() => setFormData({ ...formData, role: 'Reseller' })}
                          />
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            formData.role === 'Reseller' ? 'bg-indigo-500' : 'bg-slate-100'
                          }`}
                          >
                            <Store className={`w-6 h-6 ${formData.role === 'Reseller' ? 'text-white' : 'text-slate-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${formData.role === 'Reseller' ? 'text-indigo-900' : 'text-slate-900'}`}>
                              Reseller
                            </p>
                            <p className="text-sm text-slate-500 truncate">Channel partner or distributor</p>
                          </div>
                          {formData.role === 'Reseller' && (
                            <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                          )}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                    <Link href="/dashboard">
                      <Button type="button" variant="outline" size="lg">
                        Cancel
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </div>

                  <div className="mt-10 pt-8 border-t border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-900">Danger zone</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Permanently delete your account and all associated data (lists, connections, invites). You will not be able to sign in again.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="mt-4 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      onClick={() => setShowDeleteAccountModal(true)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete my account
                    </Button>
                  </div>
                </form>
              </div>
            </FadeIn>
          </div>
        </div>
      </PageTransition>

      <ConfirmationModal
        isOpen={showDeleteAccountModal}
        title="Delete your account?"
        description="This will permanently delete your profile and all your data (account lists, connections, invites). You will not be able to sign in again. This cannot be undone."
        confirmLabel="Delete account"
        cancelLabel="Cancel"
        intent="danger"
        isLoading={isDeletingAccount}
        onConfirm={async () => {
          setIsDeletingAccount(true);
          try {
            await deleteAccount();
            setShowDeleteAccountModal(false);
          } catch {
            // Toast handled in deleteAccount
          } finally {
            setIsDeletingAccount(false);
          }
        }}
        onClose={() => !isDeletingAccount && setShowDeleteAccountModal(false)}
      />

      {mounted &&
        showVerifyPhoneModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            <div
              className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-300 ${
                modalAnimate ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={() => setShowVerifyPhoneModal(false)}
              aria-hidden="true"
            />

            <div
              className={`relative w-full max-w-md transition-all duration-300 ease-out ${
                modalAnimate
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-95 translate-y-4'
              }`}
              style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="verify-modal-title"
            >
              <div className="bg-white rounded-2xl shadow-2xl shadow-black/25 ring-1 ring-slate-200/80 overflow-hidden">
                {/* Header */}
                <div className="relative bg-linear-to-br from-indigo-600 via-indigo-500 to-violet-500 px-6 py-6 overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />
                  <div className="relative flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg shadow-indigo-700/30">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 id="verify-modal-title" className="text-lg font-bold text-white">
                          Verify your phone
                        </h2>
                        <p className="text-indigo-200 text-sm mt-0.5">
                          Code sent to {formData.phoneNumber || 'your phone'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowVerifyPhoneModal(false);
                        setVerifyCodeInput('');
                        setErrors((prev) => ({ ...prev, verifyCode: '' }));
                      }}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-indigo-200 hover:text-white hover:bg-white/15 transition-all"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Enter 6-digit code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verifyCodeInput}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVerifyCodeInput(digitsOnly);
                      setErrors((prev) => ({ ...prev, verifyCode: '' }));
                    }}
                    placeholder="000000"
                    className={`block w-full px-4 py-3.5 text-center text-2xl font-semibold tracking-[0.4em] rounded-xl border transition-all placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                      errors.verifyCode
                        ? 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
                        : 'border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-400'
                    }`}
                    autoComplete="one-time-code"
                    autoFocus
                  />
                  {errors.verifyCode && (
                    <p className="mt-2 text-sm text-red-600">{errors.verifyCode}</p>
                  )}
                  <p className="mt-3 text-sm text-slate-500 flex items-center justify-between">
                    <span>Code expires in 10 minutes</span>
                    <button
                      type="button"
                      className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                      onClick={async () => {
                        await handleSendPhoneVerificationCode(false);
                        setShowVerifyPhoneModal(true);
                      }}
                      disabled={isSendingPhoneCode}
                    >
                      {isSendingPhoneCode ? 'Sending…' : 'Resend code'}
                    </button>
                  </p>

                  <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      onClick={() => {
                        setShowVerifyPhoneModal(false);
                        setVerifyCodeInput('');
                        setErrors((prev) => ({ ...prev, verifyCode: '' }));
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      className="flex-1"
                      onClick={handleVerifyPhoneCode}
                      isLoading={isVerifyingPhoneCode}
                    >
                      Verify
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </main>
  );
}
