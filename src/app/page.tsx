'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-gradient">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">
            GTM Account Mapper
          </h1>
          <p className="text-2xl text-white/90 mb-8 drop-shadow">
            Find Account Overlaps in Real-Time
          </p>
          <p className="text-lg text-white/80 max-w-2xl mx-auto drop-shadow">
            The lightweight tool for sales reps to instantly identify account overlaps
            at events, meetings, and networking sessions.
          </p>
        </div>

        <div className="glass rounded-2xl p-12 max-w-md mx-auto">
          <div className="space-y-4">
            <Link
              href="/login"
              className="block w-full bg-white text-purple-600 py-4 rounded-lg font-semibold text-center hover:bg-purple-50 transition-all transform hover:scale-105 shadow-lg"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="block w-full bg-purple-600 text-white py-4 rounded-lg font-semibold text-center hover:bg-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Sign Up
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-white/20">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-white">1</div>
                <div className="text-sm text-white/80">Upload Lists</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">2</div>
                <div className="text-sm text-white/80">Connect</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">3</div>
                <div className="text-sm text-white/80">Find Overlaps</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
          <div className="glass rounded-xl p-6 text-center transform hover:scale-105 transition-all">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-semibold mb-2">Lightning Fast</h3>
            <p className="text-sm text-white/80">Get results in seconds, not minutes</p>
          </div>
          <div className="glass rounded-xl p-6 text-center transform hover:scale-105 transition-all">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="font-semibold mb-2">Private & Secure</h3>
            <p className="text-sm text-white/80">Your data stays yours, always</p>
          </div>
          <div className="glass rounded-xl p-6 text-center transform hover:scale-105 transition-all">
            <div className="text-4xl mb-3">📱</div>
            <h3 className="font-semibold mb-2">Works Anywhere</h3>
            <p className="text-sm text-white/80">Mobile-friendly for on-the-go</p>
          </div>
        </div>
      </div>
    </div>
  );
}
