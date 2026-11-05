import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ASTEX AI | Automating the Future',
  description: 'WhatsApp automation and CRM for Astex AI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F8F9FA] text-neutral-900 antialiased`}>{children}</body>
    </html>
  );
}
