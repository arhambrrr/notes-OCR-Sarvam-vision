import type { Metadata } from 'next';
import { Noto_Sans } from 'next/font/google';
import './globals.css';

const notoSans = Noto_Sans({
  subsets: ['latin', 'devanagari'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-sans',
});

export const metadata: Metadata = {
  title: 'Indian Language Notes OCR | Sarvam Vision',
  description:
    'Convert handwritten Indian language notes to digital text. Supports Hindi, Marathi, Kannada, Tamil, Telugu, Bengali, and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={notoSans.variable}>
      <body className={`${notoSans.className} antialiased`}>{children}</body>
    </html>
  );
}
