import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FabrikaFiyat',
  description: 'Üretici fiyatına mobilya'
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="tr">
      <body>
        <main className="mx-auto min-h-screen max-w-md bg-zinc-50 pb-24">{children}</main>
      </body>
    </html>
  );
}
