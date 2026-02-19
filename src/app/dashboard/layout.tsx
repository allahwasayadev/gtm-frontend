'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header, LoadingScreen } from '@/components/ui';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !user.emailVerified) {
      router.push(`/verify-email?email=${encodeURIComponent(user.email)}`);
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  // If user email is not verified, show loading while redirecting
  if (user && !user.emailVerified) {
    return <LoadingScreen message="Redirecting to verification..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Header />
      <div className="bg-grid">{children}</div>
    </div>
  );
}
