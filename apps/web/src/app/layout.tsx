import type { Metadata } from 'next';
import { Lexend } from 'next/font/google';
import './globals.css';

// Lexend está diseñada para facilitar la lectura: encaja con un público que incluye adultos mayores.
const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend' });

export const metadata: Metadata = {
  title: 'Manta — Tai chi en el espacio que tengas',
  description:
    'Tai chi sentado, de pie en un metro cuadrado o con la forma completa. Clases que funcionan sin internet.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={lexend.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
