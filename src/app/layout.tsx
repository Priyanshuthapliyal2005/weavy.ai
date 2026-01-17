import type { Metadata } from 'next';
import { DM_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { ErrorBoundary } from '@/components/error-boundary';

const dmMono = DM_Mono({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dm-mono',
});

export const metadata: Metadata = {
  title: 'Weavy - Galaxy.ai',
  description: 'Build and execute AI workflows',
  icons: {
    icon: '/images/weavy-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={dmMono.variable}>
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
