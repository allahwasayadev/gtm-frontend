'use client';

import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Header } from '@/components/ui';

export default function AboutPage() {
  const sections = [
    {
      title: 'What is GTM Mapper?',
      content: 'Placeholder content for this section. Describe what GTM Mapper is and its core purpose.',
    },
    {
      title: 'How It Works',
      content: 'Placeholder content explaining the process. Walk users through uploading lists, connecting with partners, and finding overlaps.',
    },
    {
      title: 'Why Use GTM Mapper?',
      content: 'Placeholder content for benefits. Explain the value proposition and key advantages.',
    },
    {
      title: 'Privacy & Security',
      content: 'Placeholder content about data handling. Describe how user data is protected and privacy is maintained.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Header />
      <div className="bg-grid">
        <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8">
          {/* Page Title */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              About GTM Mapper
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Placeholder subtitle describing the purpose of this page.
            </p>
          </motion.div>

          {/* Body Sections */}
          <motion.div
            className="max-w-4xl mx-auto space-y-8"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
            }}
          >
            {sections.map((section) => (
              <motion.section
                key={section.title}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-slate-200/60"
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                }}
              >
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  {section.title}
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  {section.content}
                </p>
              </motion.section>
            ))}

            {/* Contact Section */}
            <motion.div
              className="text-center"
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
            >
              <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-200/60">
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  Get in Touch
                </h2>
                <p className="text-slate-600 mb-4">
                  Have questions or feedback? We&apos;d love to hear from you.
                </p>
                <a
                  href="mailto:contact@gtmmapper.com"
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  contact@gtmmapper.com
                </a>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
