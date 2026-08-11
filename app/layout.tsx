import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import type { ReactNode } from 'react';
import '../public/apple-ui-font.css';
import '../public/baba-ui.css';
import '../public/mesa-tatica.css';
import '../public/theme-system.css';
import '../public/baba-aparencia.css';
import './globals.css';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sitey-caixa.vercel.app'),
  title: { default: 'Baba Psyzon', template: '%s | Baba Psyzon' },
  description: 'Gestão completa do Baba Psyzon: times, jogos, gols, pagamentos, rankings e mesa tática.',
  applicationName: 'Baba Psyzon',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Baba Psyzon' },
  icons: {
    icon: '/icons/baba-icon-192.png',
    apple: '/icons/baba-icon-180.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f7fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1120' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className={geist.variable} data-theme="light" suppressHydrationWarning>
      <head><base href="/" /></head>
      <body suppressHydrationWarning>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
