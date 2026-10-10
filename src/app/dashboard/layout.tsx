'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Header, LoadingScreen } from '@/components/ui';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Email verification no longer exists: activation is by SMS, and the API
  // enforces it on every guarded route. Gating on emailVerified here sent
  // legacy users (18 of whom predate any of this) to /verify-email, a route
  // that has been deleted — a dead end with no way forward.
  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Header />
      <div className="bg-grid">{children}</div>
    </div>
  );
}
