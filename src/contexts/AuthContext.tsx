'use client';

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from 'react';
import { authApi } from '@/features/auth/auth.api';
import { usersApi } from '@/features/users/users.api';
import type {
  User,
  UserRole,
  SignupPendingResponse,
  PhoneVerificationRequired,
} from '@/features/auth/types';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { isAxiosError } from 'axios';
import { getErrorMessage } from '@/lib/error-utils';
import {
  storeActivation,
  readActivation,
  clearActivation,
} from '@/lib/activation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  /** Resolves to the pending-verification state; no session is created. */
  signup: (name: string, email: string, password: string, roles: UserRole[], phoneNumber: string, smsConsent: boolean, company?: string) => Promise<SignupPendingResponse>;
  logout: () => void;
  updateUser: (updatedUser: User, newToken?: string) => void;
  deleteAccount: () => Promise<void>;
  verifyActivation: (code: string) => Promise<void>;
  resendActivationCode: () => Promise<void>;
  setActivationPhone: (phoneNumber: string) => Promise<void>;
  sendPhoneVerificationCode: (phoneNumber: string, smsConsent?: boolean) => Promise<{ code?: string }>;
  verifyPhoneCode: (code: string) => Promise<void>;
  requestPasswordReset: (identifier: string) => Promise<void>;
  resetPassword: (identifier: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useIsHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function getStoredUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  if (!token || !storedUser) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedUser) as User & { isOemSeller?: boolean };
    if (!parsed.roles && 'isOemSeller' in parsed) {
      return {
        ...parsed,
        roles: parsed.isOemSeller ? ['OEM'] : ['Reseller'],
      } as User;
    }
    return parsed as User;
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const loading = !useIsHydrated();
  const router = useRouter();

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await authApi.login({ email, password });
      const { user, token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      toast.success('Welcome back!');
      return user;
    } catch (error: unknown) {
      // An account whose phone is not verified has no session yet. Send the
      // user to finish activation rather than showing a dead-end error.
      if (isAxiosError(error) && error.response?.status === 403) {
        const data = error.response.data as Partial<PhoneVerificationRequired>;
        if (data?.code === 'PHONE_VERIFICATION_REQUIRED' && data.activationToken) {
          // The token is a credential, so it goes to sessionStorage rather
          // than into the URL where history and Referer would capture it.
          storeActivation({
            token: data.activationToken,
            email: data.email ?? email,
            phoneHint: data.phoneHint ?? null,
            needsPhoneNumber: Boolean(data.needsPhoneNumber),
            smsSent: false,
          });
          toast.error('Verify your mobile number to finish setting up your account.');
          router.push('/verify-phone');
          throw error;
        }
      }
      toast.error(getErrorMessage(error, 'Login failed'));
      throw error;
    }
  };

  /**
   * Signup no longer logs anyone in. The account is inactive until the SMS
   * code is entered, so there is no token to store here.
   */
  const signup = async (
    name: string,
    email: string,
    password: string,
    roles: UserRole[],
    phoneNumber: string,
    smsConsent: boolean,
    company?: string,
  ): Promise<SignupPendingResponse> => {
    try {
      const response = await authApi.signup({
        name,
        email,
        password,
        roles,
        phoneNumber,
        smsConsent,
        ...(company && { company }),
      });

      storeActivation({
        token: response.data.activationToken,
        email: response.data.email,
        phoneHint: response.data.phoneHint,
        needsPhoneNumber: false,
        smsSent: response.data.smsSent,
      });

      if (response.data.smsSent) {
        toast.success('We sent a code to your mobile. Enter it to activate your account.');
      } else {
        // Never claim a delivery that did not happen.
        toast.error(
          'Account created, but we could not send the code. Use Resend on the next screen.',
        );
      }

      return response.data;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Signup failed'));
      throw error;
    }
  };

  /** Activation: entering the SMS code is what creates the session. */
  const verifyActivation = async (code: string) => {
    const state = readActivation();
    if (!state) throw new Error('Activation expired. Please sign in again.');
    try {
      const response = await authApi.verifyActivation({
        activationToken: state.token,
        code,
      });
      const { user, token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      clearActivation();

      toast.success('Mobile number verified. Your account is active.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Verification failed'));
      throw error;
    }
  };

  const resendActivationCode = async () => {
    const state = readActivation();
    if (!state) throw new Error('Activation expired. Please sign in again.');
    try {
      const response = await authApi.resendActivation({
        activationToken: state.token,
      });
      storeActivation({ ...state, smsSent: true, phoneHint: response.data.phoneHint });
      toast.success('New code sent to your mobile.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to resend code'));
      throw error;
    }
  };

  /** Set or correct the number the code goes to. */
  const setActivationPhone = async (phoneNumber: string) => {
    const state = readActivation();
    if (!state) throw new Error('Activation expired. Please sign in again.');
    try {
      const response = await authApi.setActivationPhone({
        activationToken: state.token,
        phoneNumber,
      });
      storeActivation({
        ...state,
        phoneHint: response.data.phoneHint,
        needsPhoneNumber: false,
        smsSent: true,
      });
      toast.success('Code sent to your mobile.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Could not send the code'));
      throw error;
    }
  };

  const sendPhoneVerificationCode = async (phoneNumber: string, smsConsent?: boolean): Promise<{ code?: string }> => {
    try {
      const response = await authApi.sendPhoneVerificationCode({ phoneNumber, ...(smsConsent !== undefined && { smsConsent }) });
      toast.success('Verification code sent to your phone.');
      return { code: response.data.code };
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to send verification code'));
      throw error;
    }
  };

  const verifyPhoneCode = async (code: string) => {
    try {
      const response = await authApi.verifyPhoneCode({ code });
      const { user: updatedUser, token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast.success('Phone number verified!');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Verification failed'));
      throw error;
    }
  };

  const requestPasswordReset = async (identifier: string) => {
    try {
      await authApi.forgotPassword({ identifier });
      // Deliberately the same wording the API returns: it must not hint at
      // whether the account exists or whether a code actually went out.
      toast.success(
        'If an account exists with a verified mobile number, a reset code has been sent to it.',
      );
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to request password reset'));
      throw error;
    }
  };

  const resetPassword = async (identifier: string, code: string, newPassword: string) => {
    try {
      await authApi.resetPassword({ identifier, code, newPassword });
      toast.success('Password reset successfully!');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to reset password'));
      throw error;
    }
  };

  const updateUser = (updatedUser: User, newToken?: string) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    if (newToken) {
      localStorage.setItem('token', newToken);
    }
  };

  const deleteAccount = async () => {
    try {
      await usersApi.deleteMyAccount();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      toast.success('Account deleted successfully');
      router.push('/login');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to delete account'));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      logout,
      updateUser,
      deleteAccount,
      verifyActivation,
      resendActivationCode,
      setActivationPhone,
      sendPhoneVerificationCode,
      verifyPhoneCode,
      requestPasswordReset,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
