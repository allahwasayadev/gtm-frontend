'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen, ButtonLink } from '@/components/ui';
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
    emerald: { bg: 'bg-ok-soft', text: 'text-ok' },
    blue: { bg: 'bg-accent-soft', text: 'text-accent' },
    purple: { bg: 'bg-accent', text: 'text-accent' },
  };

  return (
    <div className="min-h-screen via-white">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <img src="/ovrlap-logo.svg" alt="Ovrlap" className="h-20 sm:h-24 md:h-28 w-auto" />
          </motion.div>
          <motion.p
            className="text-xl md:text-2xl font-medium text-ink-2 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.06, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Find Account Overlaps in Real-Time
          </motion.p>
          <motion.p
            className="text-base text-ink-3 max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.06, ease: [0.25, 0.1, 0.25, 1] }}
          >
            The lightweight tool for sales reps to instantly identify account overlaps
            at events, meetings, and networking sessions.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.06, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <ButtonLink href="/signup" variant="primary" size="lg" className="w-full sm:w-auto px-8">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </ButtonLink>
            <ButtonLink href="/login" variant="outline" size="lg" className="w-full sm:w-auto px-8">
                Sign In
              </ButtonLink>
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
                className="bg-surface rounded-lg p-6 shadow-card border border-hairline hover:shadow-card-hover transition-all duration-200"
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
                }}
              >
                <div className="w-12 h-12 bg-accent rounded-md flex items-center justify-center mx-auto mb-4 shadow-e2">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-ink mb-2">{step.title}</h3>
                <p className="text-sm text-ink-3">{step.desc}</p>
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
                  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
                }}
              >
                <div className={`w-14 h-14 ${colors.bg} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className={`w-7 h-7 ${colors.text}`} />
                </div>
                <h3 className="font-semibold text-ink mb-2">{feature.title}</h3>
                <p className="text-sm text-ink-3">{feature.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Dark Footer */}
      <div className="bg-ink border-t border-ink">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <p className="text-sm text-ink-3">
              &copy; 2026 Ovrlap. Built for sales professionals.
            </p>
            <Link href="/about" className="text-sm text-ink-3 hover:text-ink-3 transition-colors">
              About
            </Link>
            <Link href="/privacy" className="text-sm text-ink-3 hover:text-ink-3 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-ink-3 hover:text-ink-3 transition-colors">
              Terms
            </Link>
                  <Link href="/sms-opt-in" className="text-sm text-ink-3 hover:text-ink-3 transition-colors">SMS Terms</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
