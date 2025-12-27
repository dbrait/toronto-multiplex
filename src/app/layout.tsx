import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Toronto Multiplex & ADU Dashboard',
  description:
    'Track building permits for multiplexes, duplexes, triplexes, laneway suites, and garden suites across Toronto neighbourhoods.',
  keywords: [
    'Toronto',
    'multiplex',
    'duplex',
    'triplex',
    'laneway suite',
    'garden suite',
    'building permits',
    'housing',
    'gentle density',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
