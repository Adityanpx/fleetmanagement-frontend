import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const SITE_NAME = 'Patil Logistics';
const DESCRIPTION = 'Trips, diesel, expenses and payments for the Patil Logistics fleet.';
// Link previews (WhatsApp, Telegram, X…) need absolute image URLs, so set NEXT_PUBLIC_SITE_URL to the live domain.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(SITE_URL && { metadataBase: new URL(SITE_URL) }),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: 'default' },
  openGraph: { type: 'website', siteName: SITE_NAME, title: SITE_NAME, description: DESCRIPTION, locale: 'en_IN' },
  twitter: { card: 'summary_large_image', title: SITE_NAME, description: DESCRIPTION },
  formatDetection: { telephone: false },
};
// viewportFit 'cover' lets the app draw under the notch/home bar; env(safe-area-inset-*) keeps content clear of them.
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#ffffff' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        {children}
        <Toaster position="top-center" toastOptions={{ style: { fontSize: 14 } }} />
      </body>
    </html>
  );
}
