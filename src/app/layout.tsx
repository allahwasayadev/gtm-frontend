import type { Metadata } from 'next';
import { Lato } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { MotionProvider } from '@/components/ui/MotionProvider';

const lato = Lato({
  weight: ['100', '300', '400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ovrlap - Account Mapping Made Simple',
  description: 'Find overlapping accounts instantly with your sales partners',
  icons: {
    icon: '/ovrlap-mark.svg',
    shortcut: '/ovrlap-mark.svg',
    apple: '/ovrlap-mark.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${lato.className} antialiased`}>
        <MotionProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              /* Toasts are the success and failure treatment for every route, so
                 they read from the same tokens as the rest of Harbour rather
                 than the near-black default they shipped with. */
              style: {
                background: 'var(--color-surface)',
                color: 'var(--color-ink)',
                border: '1px solid var(--color-hairline)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-e3)',
                fontSize: '13.5px',
                lineHeight: '1.45',
                maxWidth: '420px',
              },
              success: {
                style: {
                  background: 'var(--color-ok-soft)',
                  color: 'var(--color-ok)',
                  border: '1px solid var(--color-ok-soft)',
                },
                iconTheme: {
                  primary: 'var(--color-ok)',
                  secondary: 'var(--color-ok-soft)',
                },
              },
              error: {
                style: {
                  background: 'var(--color-danger-soft)',
                  color: 'var(--color-danger)',
                  border: '1px solid var(--color-danger-soft)',
                },
                iconTheme: {
                  primary: 'var(--color-danger)',
                  secondary: 'var(--color-danger-soft)',
                },
              },
            }}
          />
          {children}
        </AuthProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
