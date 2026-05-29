'use client';

import { usePathname } from 'next/navigation';
import { CRM_THEME as C } from '@/lib/theme';

const TITLES: Record<string, string> = {
  '/crm': 'Dashboard',
  '/crm/pedidos': 'Pedidos',
  '/crm/productos': 'Productos',
  '/crm/clientes': 'Clientes',
  '/crm/reportes': 'Reportes',
};

export default function Topbar() {
  const path = usePathname();
  const title = TITLES[path] || 'CRM';
  const fecha = new Date().toLocaleDateString('es-EC', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header
      style={{
        height: 64,
        borderBottom: `1px solid ${C.line}`,
        background: C.panel,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        flexShrink: 0,
      }}
    >
      <div>
        <h1 style={{ fontSize: 18, margin: 0, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500 }}>{title}</h1>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>
          Hoy · {fecha}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <input
            placeholder="Buscar pedido, cliente o producto..."
            style={{
              width: 320,
              height: 36,
              border: `1px solid ${C.line}`,
              borderRadius: 8,
              padding: '0 12px 0 36px',
              fontSize: 13,
              background: C.searchBg,
              color: C.ink,
              fontFamily: 'inherit',
            }}
          />
          <span style={{ position: 'absolute', left: 12, top: 9, color: C.muted }}>⌕</span>
        </div>
      </div>
    </header>
  );
}
