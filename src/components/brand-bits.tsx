import { PALETTE_D as P } from '@/lib/theme';

// Wordmark BACON / WAFFLES (texto, escala consistente).
export function BWWordmark({ height = 56, color = P.brand }: { height?: number; color?: string }) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, fontFamily: "'Cormorant Garamond', serif" }}>
      <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: height * 0.18, letterSpacing: '0.22em', fontWeight: 600, color, marginBottom: height * 0.06 }}>
        BACON
      </div>
      <div style={{ fontSize: height * 0.78, letterSpacing: '0.015em', fontWeight: 500, color }}>
        W<span style={{ fontStyle: 'italic' }}>AFF</span>LES
      </div>
    </div>
  );
}

export const WaIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9s-.5-.1-.7.1c-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.5-.8-2.6-1.4-3.6-3.1-.3-.5.3-.5.8-1.5.1-.2.1-.3 0-.5s-.7-1.6-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3 4.8 4.2 1.8.8 2.5.9 3.4.7.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.2-.3-.3-.6-.4z" />
    <path d="M21.1 4.9C19 2.8 16.1 1.6 13 1.6 6.7 1.6 1.6 6.7 1.6 13c0 2 .5 4 1.6 5.7L1.5 24l5.4-1.4c1.7.9 3.6 1.4 5.6 1.4h.1c6.3 0 11.4-5.1 11.4-11.4-.1-3-1.3-5.9-3.4-7.7zM13 22.4h-.1c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.2.8.9-3.1-.2-.4c-1-1.6-1.5-3.4-1.5-5.2 0-5.4 4.4-9.8 9.8-9.8 2.6 0 5.1 1 6.9 2.9s2.9 4.3 2.9 6.9c-.1 5.3-4.5 9.5-9.8 9.5z" />
  </svg>
);

// Sello circular con texto rotando (RECIÉN·HECHO·EN·LOJA, etc.).
export function Stamp({
  id,
  text,
  size = 150,
  color = P.accent,
  center,
}: {
  id: string;
  text: string;
  size?: number;
  color?: string;
  center?: React.ReactNode;
}) {
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', animation: 'bw-spin 20s linear infinite' }}>
        <defs>
          <path id={id} d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
        </defs>
        <text fill={color} fontSize="15" fontWeight={600} letterSpacing="2.5" fontFamily="'JetBrains Mono', monospace">
          <textPath href={`#${id}`} startOffset="0">
            {text}
          </textPath>
        </text>
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          fontSize: size * 0.26,
        }}
      >
        {center ?? '🧇'}
      </div>
    </div>
  );
}
