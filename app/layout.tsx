import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'BulkerTrack',
  description: 'Fleet & trip manager',
  applicationName: 'BulkerTrack',
  appleWebApp: { capable: true, title: 'BulkerTrack', statusBarStyle: 'default' },
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
