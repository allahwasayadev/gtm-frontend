'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, LoadingScreen } from '@/components/ui';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Smartphone, CloudUpload, Users, BarChart3, ArrowRight } from 'lucide-react';
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
    return <LoadingScreen />;
  }

  if (user) {
    return null;
  }

  const steps = [
    { icon: CloudUpload, title: 'Upload Lists', desc: 'Upload your account lists in CSV or Excel format' },
    { icon: Users, title: 'Connect', desc: 'Connect with colleagues to compare account lists' },
    { icon: BarChart3, title: 'Find Overlaps', desc: 'Instantly see matching accounts and opportunities' },
  ];

  const features = [
    { icon: Zap, color: 'emerald', title: 'Lightning Fast', desc: 'Get results in seconds, not minutes. Real-time matching powered by smart algorithms.' },
    { icon: ShieldCheck, color: 'blue', title: 'Private & Secure', desc: 'Your data stays yours, always. Enterprise-grade security and privacy.' },
    { icon: Smartphone, color: 'purple', title: 'Works Anywhere', desc: 'Mobile-friendly design. Access your matches from anywhere, anytime.' },
  ];

  const colorMap: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-sky-50">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <img src="/ovrlap-logo.png" alt="Ovrlap" className="h-20 sm:h-24 md:h-28 w-auto" />
          </motion.div>
          <motion.p
            className="text-xl md:text-2xl font-medium text-slate-600 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Find Account Overlaps in Real-Time
          </motion.p>
          <motion.p
            className="text-base text-slate-500 max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            The lightweight tool for sales reps to instantly identify account overlaps
            at events, meetings, and networking sessions.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Link href="/signup">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-8">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                Sign In
              </Button>
            </Link>
          </motion.div>

          {/* Steps */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-20"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.4 } },
            }}
          >
            {steps.map((step) => (
              <motion.div
                key={step.title}
                className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/60 hover:shadow-card-hover transition-all duration-200"
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
                }}
              >
                <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Features */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.7 } },
          }}
        >
          {features.map((feature) => {
            const colors = colorMap[feature.color];
            return (
              <motion.div
                key={feature.title}
                className="text-center p-6"
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
                }}
              >
                <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className={`w-7 h-7 ${colors.text}`} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500">{feature.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Dark Footer */}
      <div className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <p className="text-sm text-slate-400">
              &copy; 2026 Ovrlap. Built for sales professionals.
            </p>
            <Link href="/about" className="text-sm text-slate-400 hover:text-slate-300 transition-colors">
              About
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
