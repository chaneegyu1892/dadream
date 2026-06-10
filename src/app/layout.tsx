import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '다드림 — 제자광성교회 청년부',
  description: '제자광성교회 청년부 다드림 대시보드',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
