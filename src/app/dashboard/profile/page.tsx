'use client';

import { useEffect, useRef, useState } from 'react';
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
import { SMS_CONSENT_TEXT } from '@/lib/sms-consent';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/features/users/users.api';
import {
  Button, CodeInput, ConfirmationModal, FadeIn, Input, LoadingScreen,
  PageTransition, UsPhoneInput, ButtonLink } from '@/components/ui';
import { getErrorMessage } from '@/lib/error-utils';
import { rearmWebOtp } from '@/lib/web-otp';
import {
  isAnyE164,
  isUsE164,
  toUsE164,
  usNationalDigitsFromE164,
  usPhoneValidationError,
  US_DIAL_CODE,
} from '@/lib/phone';

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
  return isAnyE164(phoneNumber);
}

/**
 * Which phone field this account gets.
 *
 * A US number, or none yet, gets the +1 field everyone else sees — same
 * component, same validation, same canonical E.164 on the way out.
 *
 * An account already holding a non-US number keeps the plain international
 * field. Pushing that number through a +1 field would either refuse to show
 * it or quietly rewrite it, and this screen is where someone would discover
 * their own number had been changed under them.
 */
function usesUsPhoneField(storedPhoneNumber: string): boolean {
  const stored = normalizePhoneForCompare(storedPhoneNumber);
  return !stored || isUsE164(stored);
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
  // A2P 10DLC: this screen previously sent SMS with no disclosure at all.
  const [smsConsent, setSmsConsent] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  /**
   * The ten national digits, for the +1 field. Kept beside formData.phoneNumber
   * rather than replacing it: an account already holding a non-US number uses
   * the international field, and that number must pass through untouched.
   */
  const [phoneDigits, setPhoneDigits] = useState('');
  /**
   * Remounts the code field to clear it. The field owns its own digits — that
   * is what lets one input serve as six boxes — so a resend or a fresh send
   * clears it by identity rather than by reaching into it.
   */
  const [verifyCodeResetKey, setVerifyCodeResetKey] = useState(0);
  /**
   * One verification in flight at a time, held in a ref.
   *
   * Two things can start one: the code field, the moment six digits land, and
   * the Verify button. `isVerifyingPhoneCode` is state, so it is not visible
   * to a second handler that runs before React re-renders — a ref is, and the
   * cost of losing that race is two attempts burnt out of five on one code.
   */
  const verifyInFlightRef = useRef(false);
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
      setPhoneDigits(usNationalDigitsFromE164(user.phoneNumber || ''));
      setIsEmailEditingEnabled(false);
      setVerifyCodeInput('');
    }
  }, [user, loading, router]);

  const useUsPhoneField = usesUsPhoneField(user?.phoneNumber || '');

  /**
   * What this screen will submit and verify — canonical E.164 once the entry
   * is complete, and '' until then, so a half-typed number can never be sent
   * anywhere.
   */
  const enteredPhoneNumber = useUsPhoneField
    ? (toUsE164(phoneDigits) ?? '')
    : normalizePhoneForCompare(formData.phoneNumber);

  /** Why the entry is not usable yet, or null. '' entry is not an error here. */
  const phoneEntryError = useUsPhoneField
    ? phoneDigits
      ? usPhoneValidationError(phoneDigits)
      : null
    : formData.phoneNumber.trim() && !isValidPhoneNumber(formData.phoneNumber)
      ? `Use E.164 format (example: ${US_DIAL_CODE}5551234567)`
      : null;

  const normalizedUserPhone = normalizePhoneForCompare(user?.phoneNumber || '');
  const normalizedFormPhone = enteredPhoneNumber;
  const hasPhoneNumber = useUsPhoneField
    ? phoneDigits.length > 0
    : Boolean(formData.phoneNumber.trim());

  /**
   * Is the consent on record good for the number in the field?
   *
   * Consent belongs to a NUMBER, not to an account — the API records it per
   * number and refuses to text one it has no consent for. So a user who is
   * changing their number has no consent for the new one, however long they
   * have had consent for the old one, and must be asked again before
   * anything is sent there. Without this the screen hid the checkbox, the
   * send was refused, and the error named a gate the user could not see.
   */
  const alreadyConsented =
    Boolean(user?.smsConsent) &&
    normalizedUserPhone !== '' &&
    enteredPhoneNumber === normalizedUserPhone;
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

    if (phoneEntryError) {
      newErrors.phoneNumber = phoneEntryError;
    }

    if (user && formData.email !== user.email && !isPhoneVerifiedForCurrentPhone) {
      newErrors.email = 'Please verify your phone number before updating the email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendPhoneVerificationCode = async (triggeredByEmailUpdate = false) => {
    if (!user) return;

    if (!hasPhoneNumber) {
      setErrors((prev) => ({ ...prev, phoneNumber: 'Phone number is required' }));
      return;
    }

    // Only ever a complete, canonical number goes to the API — and so only
    // ever a number a code can actually reach.
    if (phoneEntryError || !enteredPhoneNumber) {
      setErrors((prev) => ({
        ...prev,
        phoneNumber:
          phoneEntryError ??
          `Use E.164 format (example: ${US_DIAL_CODE}5551234567)`,
      }));
      return;
    }

    if (isPhoneVerifiedForCurrentPhone) {
      if (triggeredByEmailUpdate) {
        setIsEmailEditingEnabled(true);
      } 
      return;
    }

    // No send without consent on record for this user.
    if (!alreadyConsented && !smsConsent) {
      setErrors((prev) => ({
        ...prev,
        smsConsent: 'Please agree to receive SMS messages before we send a code.',
      }));
      return;
    }

    setIsSendingPhoneCode(true);
    // Before the request: the message can arrive before the modal opens, and
    // re-arming abandons any request bound to a superseded message.
    rearmWebOtp();
    try {
      const response = await usersApi.sendPhoneVerificationCode({
        phoneNumber: enteredPhoneNumber,
        ...(smsConsent && { smsConsent: true }),
      });
      const result = response.data;

      setFormData((prev) => ({
        ...prev,
        phoneNumber: result.phoneNumber,
      }));
      setPhoneDigits(usNationalDigitsFromE164(result.phoneNumber));

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
      setVerifyCodeInput('');
      setVerifyCodeResetKey((k) => k + 1);
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

  const handleWithdrawSmsConsent = async () => {
    if (!user) return;
    setIsWithdrawing(true);
    try {
      const { data } = await usersApi.withdrawSmsConsent();
      updateUser(
        { ...user, smsConsent: false, smsOptedOut: true },
        undefined,
      );
      setSmsConsent(false);
      toast.success(data.message);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to withdraw SMS consent'));
    } finally {
      setIsWithdrawing(false);
    }
  };

  /**
   * Verify the code. Called by the field itself once six digits land, and by
   * the button for anyone who prefers it — `isVerifyingPhoneCode` is what
   * stops those two paths submitting the same code twice.
   */
  const handleVerifyPhoneCode = async (submittedCode?: string) => {
    if (!user || verifyInFlightRef.current) return;

    const code = (submittedCode ?? verifyCodeInput).trim();

    if (!/^\d{6}$/.test(code)) {
      setErrors((prev) => ({
        ...prev,
        verifyCode: 'Enter the 6-digit code from the SMS',
      }));
      return;
    }

    verifyInFlightRef.current = true;
    setIsVerifyingPhoneCode(true);
    setErrors((prev) => ({ ...prev, verifyCode: '' }));
    try {
      const response = await usersApi.verifyPhoneVerificationCode({
        code,
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
      setPhoneDigits(usNationalDigitsFromE164(result.phoneNumber));
      setIsEmailEditingEnabled(true);
      setShowVerifyPhoneModal(false);
      setVerifyCodeInput('');
      toast.success('Phone verified. You can now update your email.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to verify code'));
    } finally {
      verifyInFlightRef.current = false;
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
        phoneNumber: enteredPhoneNumber,
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

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (loading || !user) {
    return <LoadingScreen message="Loading profile..." />;
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-sunken/50">
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FadeIn>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-ink">Profile Settings</h1>
              <p className="text-ink-3 mt-1">Manage your account information</p>
            </div>
          </FadeIn>

          <div className="space-y-6">
            <FadeIn delay={0.1}>
              <div className="bg-surface rounded-2xl border border-hairline overflow-hidden">
                <div className=" px-6 py-8">
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative">
                      <div className="w-6 h-6 bg-ok rounded-lg border-2 border-white flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <div className="text-center sm:text-left">
                      <h2 className="text-xl font-bold text-white">{user.name}</h2>
                      <p className="text-white/90 text-sm">{user.email}</p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface/20 rounded-lg text-xs font-medium text-white">
                          {user.roles?.includes('OEM') ? <Factory className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                          {user.roles?.includes('OEM') ? 'OEM Seller' : 'Reseller'}
                        </span>
                        {user.company && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface/20 rounded-lg text-xs font-medium text-white">
                            <Building2 className="w-3 h-3" />
                            {user.company}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-hairline border-b border-hairline bg-sunken/50">
                  <div className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-ink-3 text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      Member since
                    </div>
                    <p className="font-semibold text-ink">{formatDate(user.createdAt)}</p>
                  </div>
                  <div className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-ink-3 text-sm mb-1">
                      <Shield className="w-4 h-4" />
                      Status
                    </div>
                    <p className="font-semibold text-ok flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 bg-ok rounded-full animate-pulse" />
                      Active
                    </p>
                  </div>
                  <div className="px-6 py-4 text-center hidden sm:block">
                    <div className="flex items-center justify-center gap-2 text-ink-3 text-sm mb-1">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                    <p className={`font-semibold ${user.emailVerified ? 'text-ok' : 'text-warn'}`}>
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
                          <label className="block text-sm font-medium text-ink-2">
                            Email Address
                            <span className="text-danger ml-1">*</span>
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
                            <Mail className="w-4 h-4 text-ink-3" />
                          </div>
                          <input
                            className={`
                              block w-full pl-10 pr-4 py-2.5 text-sm text-ink
                              bg-surface border rounded-xl
                              placeholder:text-ink-3
                              focus:outline-none focus:ring-2 focus:ring-offset-0 focus:bg-surface focus:shadow-sm
                              transition-all duration-200
                              disabled:bg-sunken disabled:text-ink-3 disabled:cursor-not-allowed
                              ${errors.email ? 'border-danger focus:border-danger focus:ring-danger' : 'border-hairline focus:border-accent focus:ring-accent'}
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
                          <p className="mt-1.5 text-sm text-danger">{errors.email}</p>
                        )}
                        {!errors.email && (
                          <p className="mt-1.5 text-sm text-ink-3">
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
                        {isPhoneVerifiedForCurrentPhone ? (
                          <div>
                            <label className="block text-sm font-medium text-ink-2 mb-1.5">
                              Phone Number
                            </label>
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-sunken border border-hairline rounded-xl">
                              <Phone className="w-4 h-4 text-ink-3" />
                              <span className="text-sm text-ink-2 flex-1">{formData.phoneNumber}</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-ok-soft text-ok text-xs font-medium rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                Verified
                              </span>
                            </div>
                            <p className="mt-1.5 text-sm text-ink-3">
                              Verified phone number. To change, contact support.
                            </p>
                          </div>
                        ) : (
                          <>
                            {useUsPhoneField ? (
                              <UsPhoneInput
                                id="profile-phone"
                                label="Phone Number"
                                value={phoneDigits}
                                onChange={(digits) => {
                                  setPhoneDigits(digits);
                                  setErrors((prev) => ({
                                    ...prev,
                                    phoneNumber: '',
                                    verifyCode: '',
                                  }));
                                  setIsEmailEditingEnabled(false);
                                  setShowVerifyPhoneModal(false);
                                  setVerifyCodeInput('');
                                }}
                                error={errors.phoneNumber}
                                helperText={
                                  hasPhoneNumber
                                    ? 'Required to unlock email updates. Changing it means verifying the new number.'
                                    : 'Add a mobile number for account recovery and to unlock email updates.'
                                }
                              />
                            ) : (
                              /* This account holds a number outside +1. It keeps
                                 the international field so the number it already
                                 has is never rewritten to fit a US-only one. */
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
                                }}
                                placeholder={`${US_DIAL_CODE}5551234567`}
                                helperText={
                                  hasPhoneNumber
                                    ? 'Required to unlock email updates. Use E.164 format, including the country code.'
                                    : 'Add a phone number for account recovery and to unlock email updates. Use E.164 format.'
                                }
                                error={errors.phoneNumber}
                                autoComplete="tel"
                              />
                            )}
                            {hasPhoneNumber && !alreadyConsented && !user?.smsOptedOut && (
                              <label className="mt-3 flex items-start gap-3 bg-sunken rounded-xl p-3.5 border border-hairline cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={smsConsent}
                                  onChange={(e) => {
                                    setSmsConsent(e.target.checked);
                                    setErrors((prev) => ({ ...prev, smsConsent: '' }));
                                  }}
                                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-control text-accent focus:ring-accent accent-[#0E5955]"
                                />
                                <div>
                                  <p className="text-xs text-ink-2 leading-relaxed">
                                    {SMS_CONSENT_TEXT}
                                  </p>
                                  <div className="flex gap-3 mt-2">
                                    <Link href="/terms" target="_blank" className="text-xs font-medium text-accent hover:text-accent-ink" onClick={(e) => e.stopPropagation()}>Terms</Link>
                                    <Link href="/privacy" target="_blank" className="text-xs font-medium text-accent hover:text-accent-ink" onClick={(e) => e.stopPropagation()}>Privacy Policy</Link>
                                    <Link href="/sms-opt-in" target="_blank" className="text-xs font-medium text-accent hover:text-accent-ink" onClick={(e) => e.stopPropagation()}>SMS Terms</Link>
                                  </div>
                                  {errors.smsConsent && (
                                    <p className="mt-1.5 text-xs text-danger">{errors.smsConsent}</p>
                                  )}
                                </div>
                              </label>
                            )}

                            {/* SMS consent status — always visible when a number is
                                on file, so a user can see and revoke consent without
                                needing to have received a text first. */}
                            {hasPhoneNumber && (alreadyConsented || user?.smsOptedOut) && (
                              <div className={`mt-3 rounded-xl p-3.5 border ${user?.smsOptedOut ? 'bg-warn-soft border-warn-soft' : 'bg-ok-soft border-ok-soft'}`}>
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <div className="min-w-0">
                                    <p className={`text-sm font-medium ${user?.smsOptedOut ? 'text-warn' : 'text-ok'}`}>
                                      {user?.smsOptedOut
                                        ? 'SMS messages are turned off'
                                        : 'You agreed to receive Ovrlap SMS'}
                                    </p>
                                    <p className={`text-xs mt-0.5 ${user?.smsOptedOut ? 'text-warn/90' : 'text-ok/90'}`}>
                                      {user?.smsOptedOut
                                        ? 'Ovrlap will not send text messages to this number. Tick the box above to opt in again.'
                                        : user?.smsConsentAt
                                          ? `Consent recorded ${new Date(user.smsConsentAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}. Account verification messages only — never marketing.`
                                          : 'Account verification messages only — never marketing.'}
                                    </p>
                                  </div>
                                  {!user?.smsOptedOut && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={handleWithdrawSmsConsent}
                                      isLoading={isWithdrawing}
                                    >
                                      Withdraw consent
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}

                            {hasPhoneNumber && !isPhoneVerifiedForCurrentPhone && (
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-warn">Not verified yet</span>
                                <span className="text-ink-3">·</span>
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
                          </>
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
                      <label className="block text-sm font-medium text-ink-2 mb-3">
                        Your Role
                      </label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <label
                          className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.role === 'OEM'
                              ? 'border-accent bg-accent-soft/50'
                              : 'border-hairline hover:border-control hover:bg-sunken'
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
                            formData.role === 'OEM' ? 'bg-accent' : 'bg-surface-2'
                          }`}
                          >
                            <Factory className={`w-6 h-6 ${formData.role === 'OEM' ? 'text-white' : 'text-ink-3'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${formData.role === 'OEM' ? 'text-accent-ink' : 'text-ink'}`}>
                              OEM Seller
                            </p>
                            <p className="text-sm text-ink-3 truncate">Original equipment manufacturer</p>
                          </div>
                          {formData.role === 'OEM' && (
                            <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                          )}
                        </label>

                        <label
                          className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.role === 'Reseller'
                              ? 'border-accent bg-accent-soft/50'
                              : 'border-hairline hover:border-control hover:bg-sunken'
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
                            formData.role === 'Reseller' ? 'bg-accent' : 'bg-surface-2'
                          }`}
                          >
                            <Store className={`w-6 h-6 ${formData.role === 'Reseller' ? 'text-white' : 'text-ink-3'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${formData.role === 'Reseller' ? 'text-accent-ink' : 'text-ink'}`}>
                              Reseller
                            </p>
                            <p className="text-sm text-ink-3 truncate">Channel partner or distributor</p>
                          </div>
                          {formData.role === 'Reseller' && (
                            <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                          )}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 mt-8 pt-6 border-t border-hairline">
                    <ButtonLink href="/dashboard" variant="outline" size="lg">
                        Cancel
                      </ButtonLink>
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

                  <div className="mt-10 pt-8 border-t border-hairline">
                    <h3 className="text-sm font-semibold text-ink">Danger zone</h3>
                    <p className="mt-1 text-sm text-ink-3">
                      Permanently delete your account and all associated data (lists, connections, invites). You will not be able to sign in again.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="mt-4 text-danger border-danger hover:bg-danger-soft hover:border-danger"
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
              className={`absolute inset-0 bg-[rgba(25,28,27,0.50)] transition-opacity duration-300 ${
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
              <div className="bg-surface rounded-2xl shadow-2xl shadow-black/25 ring-1 ring-hairline overflow-hidden">
                {/* Header */}
                <div className="relative bg-accent px-6 py-6 overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-surface/10 rounded-full" />
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-surface/5 rounded-full" />
                  <div className="relative flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 bg-surface/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-e2">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 id="verify-modal-title" className="text-lg font-bold text-white">
                          Verify your phone
                        </h2>
                        <p className="text-accent-soft text-sm mt-0.5">
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
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-accent-soft hover:text-white hover:bg-surface/15 transition-all"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                  <label className="block text-sm font-medium text-ink-2 mb-2">
                    Enter 6-digit code
                  </label>
                  {/* Same field as activation, so the phone offers the code
                      here too. It submits on its own once six digits land; the
                      button below stays for anyone who would rather press it. */}
                  <CodeInput
                    key={verifyCodeResetKey}
                    onChange={(code) => {
                      setVerifyCodeInput(code);
                      setErrors((prev) => ({ ...prev, verifyCode: '' }));
                    }}
                    onComplete={(code) => {
                      void handleVerifyPhoneCode(code);
                    }}
                    disabled={isVerifyingPhoneCode}
                    describedBy={
                      errors.verifyCode ? 'profile-verify-code-error' : undefined
                    }
                  />
                  {errors.verifyCode && (
                    <p
                      id="profile-verify-code-error"
                      role="alert"
                      className="mt-2 text-sm text-danger"
                    >
                      {errors.verifyCode}
                    </p>
                  )}
                  <p className="mt-3 text-sm text-ink-3 flex items-center justify-between">
                    <span>Code expires in 10 minutes</span>
                    <button
                      type="button"
                      className="text-accent hover:text-accent-ink font-medium transition-colors"
                      onClick={async () => {
                        await handleSendPhoneVerificationCode(false);
                        setShowVerifyPhoneModal(true);
                      }}
                      disabled={isSendingPhoneCode}
                    >
                      {isSendingPhoneCode ? 'Sending…' : 'Resend code'}
                    </button>
                  </p>

                  <div className="flex gap-3 mt-6 pt-4 border-t border-hairline">
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
                      onClick={() => void handleVerifyPhoneCode()}
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
