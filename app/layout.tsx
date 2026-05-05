import '@/styles/globals.css';
import { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import clsx from 'clsx';
import { Toaster } from '@/components/ui/sonner';

import { Providers } from './providers';

import { siteConfig } from '@/config/site';
import { fontSans } from '@/config/fonts';

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`
  },
  description: siteConfig.description,
  icons: {
    icon: '/favicon.ico'
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ]
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cspNonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html suppressHydrationWarning lang='en' className="dark">
      <head />
      <body
        className={clsx(
          'min-h-screen min-h-[100dvh] bg-black text-white font-sans antialiased',
          fontSans.variable,
          fontSans.className
        )}
      >
        <Providers
          themeProps={{ attribute: 'class', defaultTheme: 'dark' }}
          cspNonce={cspNonce}
        >
          <main role="main" className="min-h-screen min-h-[100dvh] bg-black">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
