import './globals.css';
import type { Metadata, Viewport } from 'next';
import Sidebar from '@/components/Sidebar';
import { ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shadow — AI Social Commerce OS',
  description: 'The AI operating system for your Meesho reselling business: products, content, ads, orders, payouts — from one screen.',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#0B0B12',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const openMode = !process.env.APP_PASSWORD;
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Sidebar />
        <main className="min-h-screen lg:pl-[240px]">
          {openMode && (
            <div className="flex items-center justify-center gap-2 border-b border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5 text-[10.5px] font-medium text-amber-200/90">
              <ShieldAlert size={12} />
              <span>Open mode — set the <code className="rounded bg-black/40 px-1 py-0.5 text-[10px]">APP_PASSWORD</code> env var before deploying publicly, or anyone with the link can see your store.</span>
            </div>
          )}
          <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
