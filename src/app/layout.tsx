import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  icons: {
    apple: '/apple-touch-icon.png',
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
manifest: '/manifest.webmanifest',
title: 'Springfield Command Center',
  description: 'Mission Control for Springfield',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
