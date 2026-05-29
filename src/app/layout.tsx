import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bacon Waffles — Obrador artesanal en Loja',
  description:
    'Waffles belgas hechos a mano, solo entrega a domicilio en Loja. Pide por WhatsApp.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
