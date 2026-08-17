import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Nunito } from 'next/font/google';
import type { Metadata } from 'next';

const nunito = Nunito({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Портал БИжЭМ',
    template: '%s · Портал БИжЭМ',
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ru" className={nunito.variable} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
