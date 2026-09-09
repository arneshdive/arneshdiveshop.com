import type { Metadata } from 'next';
import { Archivo, Instrument_Serif, Caveat } from 'next/font/google';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-archivo',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument',
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-caveat',
});

export const metadata: Metadata = {
  title: 'Lab — Homepage Experiment',
  robots: { index: false, follow: false },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`lab-root ${archivo.variable} ${instrumentSerif.variable} ${caveat.variable} font-[family-name:var(--font-archivo)] min-h-screen bg-[#F5F4F0] text-[#111110] antialiased`}
    >
      {children}
    </div>
  );
}
