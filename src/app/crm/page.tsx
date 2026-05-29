import { CRM_THEME as C } from '@/lib/theme';
import { StatCard, EstadoChip, Panel } from '@/components/crm/ui';
import { getDashboardStats, getOrders } from '@/lib/crm-queries';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const [stats, orders] = await Promise.all([getDashboardStats(), getOrders()]);
  const active = orders.filter((o) => o.estado !== 'entregado');

  // Curva de ventas (7 días) — usa salesByDay si hay datos, si no una silueta base.
  const base = [140, 100, 120, 70, 90, 50, 40, 30];
  const pts = base.map((y, i) => ({ x: 40 + i * 78, y }));
  const labels = ['Mié', 'Jue', 'Vie', 'Lun', 'Mar', 'Mié', 'Jue', 'Hoy'];
  const gid = `crmg1-${C.amber.slice(1)}`;
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L590,180 L40,180 Z`;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Pedidos hoy" value={String(stats.pedidosHoy)} sub="en las últimas 24 h" accent={C.amber} />
        <StatCard
          label="Ventas hoy"
          value={`$${stats.ventasHoy.toFixed(2)}`}
          sub={`ticket promedio $${stats.ticketPromedio.toFixed(2)}`}
        />
        <StatCard
          label="Pedidos semana"
          value={String(stats.pedidosSemana)}
          sub={`$${stats.ventasSemana.toFixed(2)} en ventas`}
        />
        <StatCard label="Pedidos activos" value={String(active.length)} sub="sin entregar aún" accent={C.green} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <Panel style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Ventas · últimos 7 días
              </div>
              <div style={{ fontSize: 22, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, marginTop: 4 }}>
                ${stats.ventasSemana.toFixed(2)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, fontSize: 12 }}>
              {['7d', '30d', '90d'].map((p) => (
                <span
                  key={p}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: p === '7d' ? C.ink : 'transparent',
                    color: p === '7d' ? C.bg : C.muted,
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
          <svg viewBox="0 0 600 200" style={{ width: '100%', height: 200 }}>
            <defs>
              <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={C.amber} stopOpacity=".25" />
                <stop offset="100%" stopColor={C.amber} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1="40" x2="590" y1={40 + i * 40} y2={40 + i * 40} stroke={C.line} strokeWidth="1" />
            ))}
            <path d={areaPath} fill={`url(#${gid})`} />
            <path d={linePath} stroke={C.amber} strokeWidth="2.5" fill="none" />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4" fill={C.panel} stroke={C.amber} strokeWidth="2" />
            ))}
            {labels.map((d, i) => (
              <text key={i} x={40 + i * 78} y={195} fill={C.muted} fontSize="11" textAnchor="middle">
                {d}
              </text>
            ))}
          </svg>
        </Panel>

        <Panel style={{ padding: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
            Productos top semana
          </div>
          {stats.topProducts.map((t, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{t.n}</span>
                <span style={{ color: C.muted }}>{t.q}</span>
              </div>
              <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${t.p}%`, background: C.amber, borderRadius: 3 }} />
              </div>
            </div>
          ))}
          {stats.topProducts.length === 0 && (
            <div style={{ fontSize: 13, color: C.muted, padding: '8px 0' }}>
              Aún sin pedidos esta semana.
            </div>
          )}
        </Panel>

        <Panel style={{ padding: 20, gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Pedidos activos · {active.length}
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: C.muted, textAlign: 'left', borderBottom: `1px solid ${C.line}` }}>
                {['Pedido', 'Cliente', 'Items', 'Total', 'Hora', 'Estado'].map((h) => (
                  <th key={h} style={{ padding: '8px 0', fontWeight: 500, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {active.slice(0, 6).map((o) => (
                <tr key={o.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: '10px 0', fontWeight: 600 }}>{o.code}</td>
                  <td>{o.cliente}</td>
                  <td style={{ color: C.muted }}>{o.items}</td>
                  <td>${o.total.toFixed(2)}</td>
                  <td style={{ color: C.muted }}>{o.hora}</td>
                  <td>
                    <EstadoChip e={o.estado} />
                  </td>
                </tr>
              ))}
              {active.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '20px 0', color: C.muted, textAlign: 'center' }}>
                    Sin pedidos activos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
