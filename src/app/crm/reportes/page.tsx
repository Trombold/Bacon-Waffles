import { CRM_THEME as C } from '@/lib/theme';
import { StatCard, Panel } from '@/components/crm/ui';
import { getReports } from '@/lib/crm-queries';

export const dynamic = 'force-dynamic';

const money = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function Reportes() {
  const r = await getReports();
  const maxV = Math.max(1, ...r.weekday.map((w) => w.v));
  const barColors = [C.amber, C.amber2, C.blue];

  // Donut: strokeDasharray sobre circunferencia (2πr, r=48 → ~301).
  const CIRC = 301;
  let offset = 0;
  const segs = r.categoryMix.map((m, i) => {
    const len = (m.p / 100) * CIRC;
    const seg = { color: barColors[i % barColors.length], len, off: -offset };
    offset += len;
    return seg;
  });

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <StatCard
          label="Ventas mes"
          value={money(r.ventasMes)}
          sub="mes en curso"
          extra={
            <div style={{ display: 'flex', gap: 14, fontSize: 12, flexWrap: 'wrap' }}>
              <span style={{ color: C.green, fontWeight: 600 }}>💵 {money(r.ventasMesEfectivo)}</span>
              <span style={{ color: C.blue, fontWeight: 600 }}>🏦 {money(r.ventasMesTransferencia)}</span>
            </div>
          }
        />
        <StatCard label="Gasto mes" value={money(r.gastoMes)} sub="compras de inventario" accent={C.red} />
        <StatCard
          label="Margen mes"
          value={money(r.margenMes)}
          sub="ventas − gasto"
          accent={r.margenMes >= 0 ? C.green : C.red}
        />
        <StatCard label="Pedidos mes" value={String(r.pedidosMes)} sub={`ticket prom. ${money(r.ticketMes)}`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
        <StatCard label="Mejor día" value={r.mejorDia} sub="por ventas acumuladas" accent={C.amber} />
        <StatCard label="Hora pico" value={r.horaPico} sub="mayor volumen de pedidos" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Panel style={{ padding: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
            Ventas por día de la semana
          </div>
          <svg viewBox="0 0 500 220" style={{ width: '100%', height: 220 }}>
            {r.weekday.map((w, i) => {
              const h = Math.round((w.v / maxV) * 170) || 4;
              return (
                <g key={w.d}>
                  <rect x={40 + i * 90} y={200 - h} width="60" height={h} fill={C.amber} rx="4" />
                  <text x={70 + i * 90} y={215} fill={C.muted} fontSize="12" textAnchor="middle">
                    {w.d}
                  </text>
                  <text x={70 + i * 90} y={196 - h} fill={C.ink} fontSize="11" textAnchor="middle" fontWeight="600">
                    ${w.v}
                  </text>
                </g>
              );
            })}
          </svg>
        </Panel>

        <Panel style={{ padding: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
            Mix de categorías
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <svg viewBox="0 0 120 120" style={{ width: 160, height: 160 }}>
              {segs.map((s, i) => (
                <circle
                  key={i}
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke={s.color}
                  strokeWidth="20"
                  strokeDasharray={`${s.len} ${CIRC}`}
                  strokeDashoffset={s.off}
                  transform="rotate(-90 60 60)"
                />
              ))}
            </svg>
            <div style={{ flex: 1 }}>
              {r.categoryMix.map((m, i) => (
                <div
                  key={m.n}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.line}` }}
                >
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: barColors[i % barColors.length] }} />
                  <span style={{ flex: 1, fontWeight: 600 }}>{m.n}</span>
                  <span style={{ color: C.muted, fontSize: 12 }}>{m.p}%</span>
                  <span style={{ width: 84, textAlign: 'right', fontWeight: 600 }}>{money(m.v)}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
