import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { AuthProvider } from '@/lib/firebase/auth-context';
import { Toaster } from 'sonner';
import { RecaptchaProvider } from '@/components/auth/RecaptchaProvider';

const isDev = process.env.NEXT_PUBLIC_SITE_ENVIRONMENT === 'dev';

export const metadata: Metadata = {
  title: 'Next.js SaaS Starter',
  description: 'Get started quickly with Next.js, Postgres, and Stripe.',
  ...(isDev && {
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }),
};

export const viewport: Viewport = {
  maximumScale: 1
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
    >
      <body className="min-h-[100dvh] bg-gray-50">
        <RecaptchaProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </RecaptchaProvider>
      </body>
    </html>
  );
}
