import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Hygienix - Pest Control Management',
  description: 'Sistema di gestione per aziende di disinfestazione',
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
