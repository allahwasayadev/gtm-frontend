'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  User,
  Smartphone,
  FileText,
  Database,
  Share2,
  Clock,
  Server,
  Lock,
  Settings,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { Header } from '@/components/ui';

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface PolicySectionProps {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}

function PolicySection({ icon: Icon, iconBg, iconColor, title, children }: PolicySectionProps) {
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

export default function PrivacyPage() {
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
                  <Shield className="w-8 h-8 text-indigo-600" />
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                  Privacy Policy
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                  Ovrlap respects your privacy and is committed to protecting the information you provide when using the platform.
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
              {/* Introduction */}
              <motion.div
                className="bg-linear-to-br from-indigo-50 to-white rounded-2xl p-8 sm:p-10 shadow-card border border-indigo-200/60"
                variants={sectionVariants}
              >
                <p className="text-lg text-slate-700 leading-relaxed">
                  Ovrlap (&quot;Ovrlap&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;the Service&quot;) is a software service that allows users to upload lists of business accounts and identify overlapping companies with trusted partners for collaboration purposes. This Privacy Policy explains what information we collect, how it is used, and how we protect it.
                </p>
              </motion.div>

              {/* Information We Collect */}
              <PolicySection
                icon={Database}
                iconBg="bg-violet-100"
                iconColor="text-violet-600"
                title="Information We Collect"
              >
                <p className="font-medium text-slate-800">
                  We collect only the information necessary to operate the service.
                </p>
              </PolicySection>

              {/* Account Information */}
              <PolicySection
                icon={User}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
                title="Account Information"
              >
                <p>When you create an account, we collect:</p>
                <ul className="space-y-2 ml-1">
                  {['Name', 'Email address', 'Company name'].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p>This information is used to identify users within the platform.</p>
              </PolicySection>

              {/* Phone Number Verification */}
              <PolicySection
                icon={Smartphone}
                iconBg="bg-emerald-100"
                iconColor="text-emerald-600"
                title="Phone Number Verification"
              >
                <p>
                  Ovrlap uses phone number verification to confirm user identity and secure accounts.
                </p>
                <div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-slate-100">
                  {[
                    'Your phone number is used only for authentication purposes through SMS verification.',
                    'Ovrlap does not send marketing text messages.',
                    'Message frequency varies based on login or verification activity.',
                    'Standard message and data rates may apply depending on your mobile carrier.',
                  ].map((item, i) => (
                    <p key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-2" />
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </PolicySection>

              {/* Account List Data */}
              <PolicySection
                icon={FileText}
                iconBg="bg-amber-100"
                iconColor="text-amber-600"
                title="Account List Data"
              >
                <p>
                  Users may upload lists of company accounts in order to identify overlaps with other users.
                </p>
                <p>
                  Ovrlap processes these lists solely to determine matching company names between connected users.
                </p>
                <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100">
                  <p className="font-medium text-slate-800 text-sm">
                    Ovrlap is designed to process business account names only and does not require or request personal customer data.
                  </p>
                </div>
                <p>
                  Full account lists are not publicly displayed and are not distributed to other users.
                </p>
              </PolicySection>

              {/* How We Use Your Information */}
              <PolicySection
                icon={Settings}
                iconBg="bg-indigo-100"
                iconColor="text-indigo-600"
                title="How We Use Your Information"
              >
                <p>We use the information collected to:</p>
                <ul className="space-y-2.5 ml-1">
                  {[
                    'Create and manage user accounts',
                    'Verify identity through SMS authentication',
                    'Process uploaded account lists to identify overlapping companies',
                    'Display matched accounts between connected users',
                    'Maintain and improve the platform',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100 mt-2">
                  <p className="font-semibold text-indigo-900">
                    Ovrlap does not sell, rent, or trade user data.
                  </p>
                </div>
              </PolicySection>

              {/* Data Sharing */}
              <PolicySection
                icon={Share2}
                iconBg="bg-sky-100"
                iconColor="text-sky-600"
                title="Data Sharing"
              >
                <p className="font-medium text-slate-800">
                  Ovrlap is designed to limit data exposure.
                </p>
                <ul className="space-y-3 ml-1">
                  {[
                    'Users only see overlapping accounts with individuals they explicitly connect with.',
                    'Only the matched company names between two connected users are displayed.',
                    'Full account lists are not shared.',
                    'Users may revoke connections at any time, which immediately removes overlap visibility between both parties.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </PolicySection>

              {/* Data Retention */}
              <PolicySection
                icon={Clock}
                iconBg="bg-orange-100"
                iconColor="text-orange-600"
                title="Data Retention"
              >
                <p>
                  Ovrlap stores account overlap data only as long as it is required to operate the service.
                </p>
                <ul className="space-y-3 ml-1">
                  {[
                    'When a connection between users is revoked, the associated overlap visibility between those users is removed.',
                    'If a user deletes their account, their profile and associated mapping data are removed from the platform.',
                    'Certain limited technical records may be temporarily retained for system integrity, security monitoring, and operational purposes.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </PolicySection>

              {/* Third-Party Services */}
              <PolicySection
                icon={Server}
                iconBg="bg-purple-100"
                iconColor="text-purple-600"
                title="Third-Party Services"
              >
                <p>
                  Ovrlap may use third-party providers to support the platform, including services for:
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Cloud infrastructure and hosting', icon: Server },
                    { label: 'Authentication', icon: Lock },
                    { label: 'SMS verification', icon: Smartphone },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 border border-slate-100 text-center"
                    >
                      <item.icon className="w-5 h-5 text-purple-500" />
                      <span className="text-sm text-slate-600">{item.label}</span>
                    </div>
                  ))}
                </div>
                <p>
                  These providers may process limited information as required to operate the service.
                </p>
              </PolicySection>

              {/* Data Security */}
              <PolicySection
                icon={Lock}
                iconBg="bg-emerald-100"
                iconColor="text-emerald-600"
                title="Data Security"
              >
                <p>
                  Ovrlap takes reasonable technical and administrative measures to protect user information from unauthorized access, loss, or misuse.
                </p>
                <p className="text-sm text-slate-500 italic">
                  However, no online service can guarantee absolute security.
                </p>
              </PolicySection>

              {/* User Control */}
              <motion.section
                className="bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl p-8 sm:p-10 shadow-xl"
                variants={sectionVariants}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Settings className="w-5 h-5 text-indigo-300" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">User Control</h2>
                </div>
                <p className="text-slate-300 mb-6">Users may:</p>
                <ul className="space-y-4 mb-6">
                  {[
                    'Remove connections with other users',
                    'Update their account information',
                    'Delete their account and associated data directly within the platform',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-slate-200">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-5 border-t border-slate-700">
                  <p className="text-slate-300 text-sm">
                    Deleting an account removes the user&apos;s profile and associated mapping data from the Ovrlap service.
                  </p>
                </div>
              </motion.section>

              {/* Changes to This Policy */}
              <PolicySection
                icon={RefreshCw}
                iconBg="bg-teal-100"
                iconColor="text-teal-600"
                title="Changes to This Policy"
              >
                <p>
                  This Privacy Policy may be updated periodically to reflect improvements or changes to the service.
                </p>
                <p>
                  Continued use of Ovrlap after changes to this policy indicates acceptance of the updated terms.
                </p>
              </PolicySection>

              {/* Contact */}
              <motion.div className="text-center" variants={sectionVariants}>
                <div className="bg-white rounded-2xl p-10 shadow-card border border-slate-200/60">
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">Contact</h2>
                  <p className="text-slate-600 mb-6 text-lg">
                    If you have questions regarding this Privacy Policy, please contact:
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
              <div className="max-w-4xl mx-auto text-center">
                <p className="text-slate-500 text-sm">
                  &copy; {new Date().getFullYear()} Ovrlap. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
