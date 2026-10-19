import type { Metadata } from 'next';
import Link from 'next/link';
import { SMS_CONSENT_TEXT, SMS_CONSENT_VERSION } from '@/lib/sms-consent';

export const metadata: Metadata = {
  title: 'SMS Terms & Opt-In — Ovrlap',
  description:
    'How Ovrlap collects SMS consent, what messages we send, and how to opt out. Public reference for our A2P 10DLC messaging program.',
};

/**
 * Public, no-login reference for the Ovrlap SMS program.
 *
 * This is the URL given as the campaign's opt-in description, so it must stay
 * an accurate description of the live flow. If the consent wording, templates
 * or keyword behaviour change, change them here too.
 */
export default function SmsOptInPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <header className="mb-10">
          <Link href="/" className="inline-block mb-8">
            <img src="/ovrlap-logo.svg" alt="Ovrlap" className="h-[52px] sm:h-[56px] lg:h-[60px] w-auto object-contain" />
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-3">
            SMS Terms &amp; Opt-In
          </h1>
          <p className="text-ink-2 leading-relaxed">
            Ovrlap sends you a text for one reason only: a one-time code
            verifying that you control the phone number on your account. We
            start no other conversation — no marketing, no promotions, no login
            or activity alerts — and we never message anyone who has not asked
            us to. The only other texts you can receive from us are the
            automatic replies to STOP, START and HELP, which are sent only in
            response to a message you send first.
          </p>
        </header>

        <Section title="Program name">
          <p>
            <strong>Ovrlap Account Verification.</strong> Operated by Ovrlap,
            the account-mapping service at{' '}
            <Link href="/" className="text-accent hover:text-accent-ink font-medium">
              www.ovrlap.app
            </Link>
            .
          </p>
        </Section>

        <Section title="How you opt in">
          <p>
            Consent is collected in three places: the Ovrlap sign-up form, the
            phone verification screen, and profile settings. In each one you
            enter your own mobile number and tick an unchecked box reading:
          </p>
          <blockquote className="my-4 border-l-4 border-accent bg-surface rounded-r-md p-5 text-ink-2 text-sm leading-relaxed shadow-sm">
            {SMS_CONSENT_TEXT}
          </blockquote>
          <ul className="space-y-2.5">
            <Bullet>The box is <strong>unchecked by default</strong>. Nothing is pre-selected.</Bullet>
            <Bullet>
              Consent is <strong>optional</strong>. You can create an Ovrlap
              account, sign in, and use every feature without agreeing to SMS.
            </Bullet>
            <Bullet>
              A phone number is <strong>optional</strong> at sign-up. Leaving it
              blank does not block registration.
            </Bullet>
            <Bullet>
              If you skip it at sign-up, you can give consent later from your
              profile settings.
            </Bullet>
            <Bullet>
              You can withdraw consent at any time, in either of two ways —
              see <strong>How to opt out</strong> below.
            </Bullet>
            <Bullet>
              We record the date, time, page, and the exact wording above
              (version <code className="text-xs bg-surface-2 px-1.5 py-0.5 rounded">{SMS_CONSENT_VERSION}</code>) when you opt in.
            </Bullet>
          </ul>
        </Section>

        <Section title="See the consent screens">
          <p>
            Two of the three screens above are inside a signed-in account.
            Screenshots of all three, exactly as they appear, are on the{' '}
            <Link href="/sms-opt-in/evidence" className="text-accent hover:text-accent-ink font-medium">
              consent screens page
            </Link>
            . No verification code or delivery confirmation appears in them.
          </p>
        </Section>

        <Section title="What we send">
          <p>
            Ovrlap sends exactly one kind of message. This is the complete
            template:
          </p>
          <div className="space-y-3 mt-4">
            <Sample label="Verification code">
              Ovrlap: Your verification code is 123456. It expires in 10
              minutes. Do not share this code. Reply STOP to opt out, HELP for
              help.
            </Sample>
          </div>
          <p className="mt-4">
            It contains no links and no promotional content.
          </p>
          <p>
            Replies to <strong>STOP</strong>, <strong>START</strong> and{' '}
            <strong>HELP</strong> are handled by our messaging provider&apos;s
            standard keyword processing, not by Ovrlap. Whether a confirmation
            message is returned, and its exact wording, are determined by the
            provider and your carrier.
          </p>
        </Section>

        <Section title="Message frequency">
          <p>
            You receive a message only when you request a verification code,
            which is typically once at sign-up and then only if you add or
            change a phone number. Ovrlap never sends scheduled or recurring
            messages, and nothing is sent when you sign in.
          </p>
        </Section>

        <Section title="Cost">
          <p>
            Ovrlap does not charge for text messages.{' '}
            <strong>Standard message and data rates may apply</strong> depending
            on your mobile carrier and plan.
          </p>
        </Section>

        <Section title="How to opt out or get help">
          <p>There are two ways to stop Ovrlap texting you, and they work differently.</p>
          <ul className="space-y-2.5">
            <Bullet>
              <strong>In your Ovrlap profile settings</strong>, use
              &ldquo;Withdraw consent&rdquo;. This changes the consent setting
              Ovrlap holds for you, and Ovrlap stops sending immediately. You do
              not need to have received a text to use it.
            </Bullet>
            <Bullet>
              <strong>Reply STOP</strong> to any Ovrlap message. This is handled
              by our messaging provider&apos;s standard opt-out processing and stops
              delivery at the carrier level. The provider also recognises the
              usual variants, including STOPALL, UNSUBSCRIBE, CANCEL, END and
              QUIT.
            </Bullet>
            <Bullet>
              The two are recorded separately. Replying STOP stops delivery at
              the carrier, but it does not necessarily change the consent
              setting shown in your Ovrlap profile — so if you want both
              switched off, use the profile control as well.
            </Bullet>
            <Bullet>
              To start again, tick the consent box in your Ovrlap profile
              settings. Replying <strong>START</strong> asks the messaging
              provider to resume delivery, but it does not by itself restore
              the consent setting Ovrlap holds.
            </Bullet>
            <Bullet>
              Reply <strong>HELP</strong> for support information, or email{' '}
              <a href="mailto:support@ovrlap.app" className="text-accent hover:text-accent-ink font-medium">
                support@ovrlap.app
              </a>
              .
            </Bullet>
            <Bullet>
              Opting out is honoured immediately and is enforced before any
              further message is generated.
            </Bullet>
          </ul>
        </Section>

        <Section title="Your mobile information is never shared">
          <div className="bg-accent-soft border border-accent-soft rounded-md p-5">
            <p className="text-accent-ink font-medium leading-relaxed">
              No mobile information will be shared with third parties or
              affiliates for marketing or promotional purposes. Text messaging
              originator opt-in data and consent will not be shared with any
              third parties.
            </p>
          </div>
          <p className="mt-4">
            Your number is passed only to our messaging provider for the sole
            purpose of delivering the verification message you requested.
          </p>
        </Section>

        <Section title="Carrier liability">
          <p>
            Carriers are not liable for delayed or undelivered messages.
          </p>
        </Section>

        <footer className="mt-12 pt-8 border-t border-hairline flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/sms-opt-in/evidence" className="text-sm text-ink-3 hover:text-ink-2">
            Consent screens
          </Link>
          <Link href="/privacy" className="text-sm text-ink-3 hover:text-ink-2">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-sm text-ink-3 hover:text-ink-2">
            Terms of Service
          </Link>
          <a href="mailto:support@ovrlap.app" className="text-sm text-ink-3 hover:text-ink-2">
            support@ovrlap.app
          </a>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="text-xl font-semibold text-ink mb-3">{title}</h2>
      <div className="text-ink-2 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-2.5" />
      <span>{children}</span>
    </li>
  );
}

function Sample({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-md border border-hairline overflow-hidden shadow-sm">
      <div className="px-4 py-2 bg-sunken border-b border-hairline">
        <span className="text-xs font-semibold text-ink-3 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="px-4 py-3 text-sm text-ink-2 font-mono leading-relaxed">
        {children}
      </p>
    </div>
  );
}
