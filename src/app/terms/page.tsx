'use client';

import { motion } from 'framer-motion';
import {
  Scale,
  FileText,
  UserCheck,
  KeyRound,
  Upload,
  Link2,
  Smartphone,
  Trash2,
  Cloud,
  ShieldAlert,
  RefreshCw,
  Mail,
  Clock,
} from 'lucide-react';
import { Header } from '@/components/ui';
import Link from 'next/link';

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface TermsSectionProps {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}

function TermsSection({ icon: Icon, iconBg, iconColor, title, children }: TermsSectionProps) {
  return (
    <motion.section
      className="bg-white rounded-2xl p-8 sm:p-10 shadow-card border border-slate-200/60"
      variants={sectionVariants}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h2>
      </div>
      <div className="text-slate-600 leading-relaxed space-y-4">{children}</div>
    </motion.section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <Header />
      <div className="bg-grid flex-1 flex flex-col">
        <main className="w-full flex-1">
          {/* Hero Section */}
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-indigo-50 via-white to-slate-50" />
            <div className="relative px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-16 sm:py-24">
              <motion.div
                className="max-w-4xl mx-auto text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 mb-6">
                  <Scale className="w-8 h-8 text-indigo-600" />
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                  Terms &amp; Conditions
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                  These Terms and Conditions govern your use of Ovrlap. By accessing or using Ovrlap, you agree to be bound by these terms.
                </p>
                <motion.div
                  className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">Last Updated: March 13, 2026</span>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Content */}
          <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-12 sm:py-16">
            <motion.div
              className="max-w-4xl mx-auto space-y-8"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
              }}
            >
              {/* Agreement Notice */}
              <motion.div
                className="bg-linear-to-br from-amber-50 to-white rounded-2xl p-8 sm:p-10 shadow-card border border-amber-200/60"
                variants={sectionVariants}
              >
                <p className="text-lg text-slate-700 leading-relaxed">
                  If you do not agree to these terms, you should not use the service. Continued use of Ovrlap constitutes acceptance of these Terms and Conditions.
                </p>
              </motion.div>

              {/* Description of the Service */}
              <TermsSection
                icon={FileText}
                iconBg="bg-indigo-100"
                iconColor="text-indigo-600"
                title="Description of the Service"
              >
                <p>
                  Ovrlap is a software platform that allows users to upload lists of business accounts and identify overlapping companies with trusted partners.
                </p>
                <p>
                  The service is designed to simplify account mapping between professionals and organizations.
                </p>
              </TermsSection>

              {/* Eligibility */}
              <TermsSection
                icon={UserCheck}
                iconBg="bg-emerald-100"
                iconColor="text-emerald-600"
                title="Eligibility"
              >
                <p>
                  By using Ovrlap, you represent that you are authorized to upload and manage the account data you provide to the platform and that your use of the service complies with applicable laws and your organization&apos;s policies.
                </p>
              </TermsSection>

              {/* Account Responsibilities */}
              <TermsSection
                icon={KeyRound}
                iconBg="bg-violet-100"
                iconColor="text-violet-600"
                title="Account Responsibilities"
              >
                <p>
                  Users are responsible for maintaining the confidentiality of their account credentials and for all activity associated with their account.
                </p>
                <div className="bg-violet-50/50 rounded-xl p-5 border border-violet-100">
                  <p className="font-medium text-slate-800 text-sm">
                    You agree to provide accurate and complete information when creating an account.
                  </p>
                </div>
              </TermsSection>

              {/* Uploading Account Lists */}
              <TermsSection
                icon={Upload}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
                title="Uploading Account Lists"
              >
                <ul className="space-y-3 ml-1">
                  {[
                    'Users may upload lists of company names or accounts for the purpose of identifying overlaps with other users.',
                    'Users agree that they have the right to upload the data they provide.',
                    'Ovrlap processes uploaded account lists only to identify overlapping companies between connected users.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </TermsSection>

              {/* User Connections */}
              <TermsSection
                icon={Link2}
                iconBg="bg-sky-100"
                iconColor="text-sky-600"
                title="User Connections"
              >
                <ul className="space-y-3 ml-1">
                  {[
                    'Users may connect with other users to identify overlapping accounts.',
                    'Only matched accounts between two connected users will be visible.',
                    'Full account lists are not shared.',
                    'Users may revoke connections at any time, which will remove shared visibility between the users.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </TermsSection>

              {/* SMS Verification */}
              <TermsSection
                icon={Smartphone}
                iconBg="bg-teal-100"
                iconColor="text-teal-600"
                title="SMS Verification"
              >
                <p>
                  Ovrlap uses SMS verification to authenticate user accounts and improve platform security.
                </p>
                <p>
                  Consent is collected on the required phone number verification screen during sign-up, where users agree to receive automated SMS verification codes for account security.
                </p>
                <p>
                  By providing your phone number, you consent to receive verification messages related to account authentication.
                </p>
                <div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-slate-100">
                  {[
                    'Message frequency varies depending on login and verification activity.',
                    'Message and data rates may apply depending on your carrier.',
                    'Users may reply STOP to opt out or HELP for assistance.',
                  ].map((item, i) => (
                    <p key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 mt-2" />
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </TermsSection>

              {/* Account Deletion */}
              <TermsSection
                icon={Trash2}
                iconBg="bg-red-100"
                iconColor="text-red-600"
                title="Account Deletion"
              >
                <p>Users may delete their account at any time within the platform.</p>
                <p>
                  Deleting an account removes the user profile and associated mapping data from the service.
                </p>
              </TermsSection>

              {/* Service Availability */}
              <TermsSection
                icon={Cloud}
                iconBg="bg-orange-100"
                iconColor="text-orange-600"
                title="Service Availability"
              >
                <p>
                  Ovrlap strives to maintain reliable service but does not guarantee uninterrupted or error-free operation.
                </p>
                <p>
                  The service may be modified, updated, or discontinued at any time without notice.
                </p>
              </TermsSection>

              {/* Limitation of Liability */}
              <motion.section
                className="bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl p-8 sm:p-10 shadow-xl"
                variants={sectionVariants}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-amber-300" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Limitation of Liability</h2>
                </div>
                <div className="space-y-4">
                  <p className="text-slate-300">
                    Ovrlap is provided on an &quot;as is&quot; basis without warranties of any kind.
                  </p>
                  <div className="pt-5 border-t border-slate-700">
                    <p className="text-slate-200 text-sm leading-relaxed">
                      To the fullest extent permitted by law, Ovrlap shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of the service.
                    </p>
                  </div>
                </div>
              </motion.section>

              {/* Changes to Terms */}
              <TermsSection
                icon={RefreshCw}
                iconBg="bg-purple-100"
                iconColor="text-purple-600"
                title="Changes to Terms"
              >
                <p>
                  These Terms and Conditions may be updated from time to time.
                </p>
                <p>
                  Continued use of the service after updates indicates acceptance of the revised terms.
                </p>
              </TermsSection>

              {/* Contact */}
              <motion.div className="text-center" variants={sectionVariants}>
                <div className="bg-white rounded-2xl p-10 shadow-card border border-slate-200/60">
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">Contact</h2>
                  <p className="text-slate-600 mb-6 text-lg">
                    Questions regarding these Terms and Conditions can be directed to:
                  </p>
                  <a
                    href="mailto:support@ovrlap.app"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    support@ovrlap.app
                  </a>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-white mt-auto">
            <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                <p className="text-slate-500 text-sm">
                  &copy; {new Date().getFullYear()} Ovrlap. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                  <Link href="/about" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">About</Link>
                  <Link href="/privacy" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">Privacy</Link>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
