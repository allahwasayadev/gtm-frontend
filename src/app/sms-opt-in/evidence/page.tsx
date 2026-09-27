import type { Metadata } from 'next';
import Link from 'next/link';
import { SMS_CONSENT_TEXT, SMS_CONSENT_VERSION } from '@/lib/sms-consent';

export const metadata: Metadata = {
  title: 'SMS Consent — Screens & Evidence — Ovrlap',
  description:
    'Screenshots of every screen where Ovrlap collects or withdraws SMS consent, including the screens that sit behind sign-in.',
};

/**
 * Public evidence page for messaging-campaign review.
 *
 * Two of Ovrlap's three consent surfaces sit behind sign-in, so a reviewer
 * cannot reach them from the public site. These are screenshots of the real
 * screens, captured from the deployed build.
 *
 * Deliberately shows no verification code and no delivery confirmation: no SMS
 * is sent to produce these, and nothing here should imply one was.
 */
export default function SmsEvidencePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-indigo-50">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <header className="mb-10">
          <Link href="/" className="inline-block mb-8">
            <img src="/ovrlap-logo.svg" alt="Ovrlap" className="h-10 w-auto" />
          </Link>
          <p className="text-sm font-medium text-indigo-600 mb-2">
            <Link href="/sms-opt-in" className="hover:text-indigo-700">
              ← SMS Terms &amp; Opt-In
            </Link>
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Consent screens
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Ovrlap collects SMS consent in three places. The first is on the
            public sign-up page; the other two are inside a signed-in account,
            so they are shown here as screenshots of the real screens.
          </p>
          <p className="text-slate-600 leading-relaxed mt-3">
            The same wording is used in all three, version{' '}
            <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
              {SMS_CONSENT_VERSION}
            </code>
            :
          </p>
          <blockquote className="my-4 border-l-4 border-indigo-300 bg-white rounded-r-xl p-5 text-slate-700 text-sm leading-relaxed shadow-sm">
            {SMS_CONSENT_TEXT}
          </blockquote>
        </header>

        <Shot
          n={1}
          title="Sign-up form"
          href="/signup"
          notes={[
            'The box is unchecked. Nothing is pre-selected.',
            'Leaving it unchecked still creates the account — this is verifiable live at /signup.',
            'A phone number is optional here.',
          ]}
          src="/sms-evidence/1-signup-consent.png"
          alt="The SMS consent checkbox on the Ovrlap sign-up form, unchecked, with the consent wording and links to Terms, Privacy Policy and SMS Terms."
        />

        <Shot
          n={2}
          title="Phone verification screen"
          notes={[
            'Shown once after sign-up, to a signed-in user.',
            'The same unchecked consent box. No code is sent until it is ticked and the button pressed.',
            'The step is optional: "Skip for now — continue without SMS".',
          ]}
          src="/sms-evidence/2-phone-verification.png"
          alt="The Ovrlap phone verification screen, showing an unchecked SMS consent box, a Send verification code button, and a Skip for now option."
        />

        <Shot
          n={3}
          title="Profile settings"
          notes={[
            'Where a user gives consent later, or withdraws it.',
            'Shows the current consent state and the date it was recorded.',
            '"Withdraw consent" stops Ovrlap sending immediately — no text has to be received first.',
          ]}
          src="/sms-evidence/3-profile-consent.png"
          alt="Ovrlap profile settings showing the recorded SMS consent state and a Withdraw consent button."
        />

        <section className="mt-10 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            About these screenshots
          </h2>
          <ul className="space-y-2.5 text-slate-600 text-sm leading-relaxed">
            <li className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-2" />
              <span>
                Captured from the deployed build. Screen 1 can be checked
                directly at{' '}
                <Link href="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  /signup
                </Link>
                .
              </span>
            </li>
            <li className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-2" />
              <span>
                No verification code and no delivery confirmation appears in any
                of them. No message was sent to produce them.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-2" />
              <span>
                The phone numbers shown are fictional test numbers in the
                reserved 555-01xx range.
              </span>
            </li>
          </ul>
        </section>

        <footer className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/sms-opt-in" className="text-sm text-slate-500 hover:text-slate-700">
            SMS Terms &amp; Opt-In
          </Link>
          <Link href="/privacy" className="text-sm text-slate-500 hover:text-slate-700">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-sm text-slate-500 hover:text-slate-700">
            Terms of Service
          </Link>
          <a href="mailto:support@ovrlap.app" className="text-sm text-slate-500 hover:text-slate-700">
            support@ovrlap.app
          </a>
        </footer>
      </div>
    </div>
  );
}

function Shot({
  n,
  title,
  href,
  notes,
  src,
  alt,
}: {
  n: number;
  title: string;
  href?: string;
  notes: string[];
  src: string;
  alt: string;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-slate-900 mb-1">
        {n}. {title}
        {href && (
          <>
            {' '}
            <Link href={href} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              (live)
            </Link>
          </>
        )}
      </h2>
      <ul className="mb-4 space-y-1.5">
        {notes.map((t) => (
          <li key={t} className="flex gap-3 text-slate-600 text-sm leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-2" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
      <a href={src} target="_blank" rel="noopener noreferrer">
        <img
          src={src}
          alt={alt}
          className="w-full rounded-xl border border-slate-200 shadow-sm bg-white"
        />
      </a>
    </section>
  );
}
