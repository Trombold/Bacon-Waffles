import { CRM_THEME as C, ESTADOS, type OrderStatus } from '@/lib/theme';

export function StatCard({
  label,
  value,
  sub,
  accent,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  trend?: string;
}) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
      <div
        style={{
          fontSize: 34,
          fontFamily: 'Cormorant Garamond, serif',
          fontWeight: 500,
          marginTop: 4,
          color: accent || C.ink,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        {trend && <span style={{ color: C.green, fontWeight: 600 }}>↑ {trend}</span>}
        {sub}
      </div>
    </div>
  );
}

export function EstadoChip({ e }: { e: OrderStatus }) {
  const s = ESTADOS[e];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span>{s.icon}</span>
      {s.label}
    </span>
  );
}

export function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, ...style }}>{children}</div>
  );
}
