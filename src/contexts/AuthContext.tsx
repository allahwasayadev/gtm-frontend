'use client';

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from 'react';
import { authApi } from '@/features/auth/auth.api';
import type { User } from '@/features/auth/types';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/error-utils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string, isOemSeller: boolean, company?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User, newToken?: string) => void;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
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
    return JSON.parse(storedUser) as User;
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
      toast.error(getErrorMessage(error, 'Login failed'));
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string, isOemSeller: boolean, company?: string) => {
    try {
      const response = await authApi.signup({ name, email, password, isOemSeller, ...(company && { company }) });
      const { user, token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      // Clear onboarding flag so new users see the tour
      localStorage.removeItem('gtm_onboarding_complete');
      setUser(user);

      toast.success('Account created! Please check your email for verification code.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Signup failed'));
      throw error;
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    try {
      const response = await authApi.verifyEmail({ email, code });
      const { user, token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      toast.success('Email verified successfully!');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Verification failed'));
      throw error;
    }
  };

  const resendVerificationCode = async (email: string) => {
    try {
      await authApi.resendVerification({ email });
      toast.success('New verification code sent!');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to resend code'));
      throw error;
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      await authApi.forgotPassword({ email });
      toast.success('If an account exists, a reset link has been sent.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to request password reset'));
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await authApi.resetPassword({ token, newPassword });
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
      verifyEmail,
      resendVerificationCode,
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
