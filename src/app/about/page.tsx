'use client';

import { motion } from 'framer-motion';
import { Mail, Check, X, ArrowRight, Zap, RefreshCw, Eye } from 'lucide-react';
import { Header } from '@/components/ui';

export default function AboutPage() {
  const oldWay = [
    'Exchange spreadsheets',
    'Compare accounts once',
    'Discuss a few shared targets',
    'Lose the rest',
    'Start over when lists change',
  ];

  const newWay = [
    'You upload your list',
    'You connect with the people you want to map with',
    'You only see matches between your list and your connections',
    'You never see their full list, and they never see yours',
    'When either list changes, Ovrlap automatically re-runs the mapping and updates the matches',
  ];

  const benefits = [
    'See where alignment is strongest',
    'Decide where to spend your time',
    'Plan go-to-market efforts with real data',
    'Support MDF conversations with clarity',
    'Track your progress in top accounts tied to your channel relationships',
  ];

  const highlights = [
    {
      icon: Eye,
      title: 'Real-time visibility',
      description: 'Always see the current state of your overlap',
    },
    {
      icon: RefreshCw,
      title: 'Auto-updating',
      description: 'When lists change, mapping updates automatically',
    },
    {
      icon: Zap,
      title: 'Instant alignment',
      description: 'Connect with someone new and alignment is already there',
    },
  ];

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
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                  About Ovrlap
                </h1>
                <p className="text-xl sm:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                  Built by someone who mapped one too many times and finally thought, &quot;I know this is important, but there has to be a better way.&quot;
                </p>
              </motion.div>
            </div>
          </section>

          {/* Main Content */}
          <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-12 sm:py-16">
            <motion.div
              className="max-w-4xl mx-auto space-y-12"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
              }}
            >
              {/* The Problem Section */}
              <motion.section
                className="bg-white rounded-2xl p-8 sm:p-10 shadow-card border border-slate-200/60"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  The Problem
                </h2>
                <div className="text-slate-600 leading-relaxed space-y-4 text-lg">
                  <p>We all know mapping matters. It&apos;s part of the job.</p>
                  <p className="text-slate-800 font-medium">But it&apos;s broken.</p>
                  <p>We exchange spreadsheets. We talk about whatever is compelling in the moment. At best, we focus on one or two shared targets. At worst, we talk and then never do anything about it.</p>
                  <p className="italic text-slate-500">What do we actually retain from that? What do we have to show for it?</p>
                  <p>The broader alignment disappears. The rest of the overlap is forgotten. And as soon as someone&apos;s list changes, anything we captured is outdated anyway.</p>
                  <p>The frequency of those changes made it feel like this was just a fact of channel sales.</p>
                  <div className="pt-4 border-t border-slate-100 mt-6">
                    <p className="font-semibold text-slate-800">It was. But it doesn&apos;t have to be.</p>
                    <p className="text-indigo-600 font-bold text-xl mt-2">So we changed how mapping works.</p>
                  </div>
                </div>
              </motion.section>

              {/* Old Way vs New Way Section */}
              <motion.section
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
              >
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Old Way */}
                  <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <X className="w-5 h-5 text-red-500" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">
                        The old way
                      </h2>
                    </div>
                    <ul className="space-y-4">
                      {oldWay.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-slate-600">
                          <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* New Way */}
                  <div className="bg-linear-to-br from-indigo-50 to-white rounded-2xl p-8 shadow-card border border-indigo-200/60">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Check className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">
                        The Ovrlap way
                      </h2>
                    </div>
                    <ul className="space-y-4">
                      {newWay.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-slate-700">
                          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-6 bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-slate-200/60 text-center">
                  <p className="text-lg text-slate-700">
                    Instead of separate spreadsheets floating around in email threads, you have <span className="font-semibold text-indigo-600">one view</span> of your accounts and how they align across your connections.
                  </p>
                  <p className="text-slate-900 font-bold mt-2 text-xl">All in one place. Always current.</p>
                </div>
              </motion.section>

              {/* Highlights */}
              <motion.section
                className="grid sm:grid-cols-3 gap-6"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
              >
                {highlights.map((highlight, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-card border border-slate-200/60 text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                      <highlight.icon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{highlight.title}</h3>
                    <p className="text-slate-600 text-sm">{highlight.description}</p>
                  </div>
                ))}
              </motion.section>

              {/* What This Allows Section */}
              <motion.section
                className="bg-white rounded-2xl p-8 sm:p-10 shadow-card border border-slate-200/60"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  What that allows you to do
                </h2>
                <div className="text-slate-600 leading-relaxed space-y-4 text-lg">
                  <p>At the most basic level, it makes mapping easier.</p>
                  <p>You don&apos;t exchange spreadsheets. You don&apos;t repeat the same comparisons. You don&apos;t wonder whether the data is current.</p>
                  <p className="font-semibold text-slate-800 text-xl">You have a real-time view of your overlap.</p>
                  <p>But more importantly, <span className="font-medium">the work doesn&apos;t reset.</span></p>
                  <p>When lists change, mapping updates automatically.</p>
                  <p>List changes used to break alignment. <span className="text-indigo-600 font-medium">Now they create new signal.</span></p>
                  <p>Your match counts update. New alignment appears. Existing alignment shifts. You immediately see the current state without starting over.</p>
                  <p>When you connect with someone new, alignment is already there. When relationships evolve, visibility improves instead of restarting.</p>
                  <p className="font-bold text-indigo-600 text-xl pt-4">You&apos;re not rebuilding context every time. You&apos;re building on it.</p>
                </div>
              </motion.section>

              {/* Benefits Section */}
              <motion.section
                className="bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl p-8 sm:p-10 shadow-xl"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
              >
                <h2 className="text-2xl font-bold text-white mb-6">
                  From there, you can:
                </h2>
                <ul className="space-y-4 mb-8">
                  {benefits.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-slate-200">
                      <ArrowRight className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-6 border-t border-slate-700">
                  <p className="text-white font-bold text-xl text-center">
                    Going to market is hard. At minimum, we should be able to see where we overlap.
                  </p>
                </div>
              </motion.section>

              {/* Contact Section */}
              <motion.div
                className="text-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
              >
                <div className="bg-white rounded-2xl p-10 shadow-card border border-slate-200/60">
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">
                    Get in Touch
                  </h2>
                  <p className="text-slate-600 mb-6 text-lg">
                    Have questions or feedback? We&apos;d love to hear from you.
                  </p>
                  <a
                    href="mailto:contact@ovrlap.com"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    contact@ovrlap.com
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
