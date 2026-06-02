'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CRM_THEME as C } from '@/lib/theme';
import { logout } from '@/app/login/actions';

const NAV = [
  { href: '/crm', label: 'Dashboard', icon: '◧' },
  { href: '/crm/pedidos', label: 'Pedidos', icon: '🛵' },
  { href: '/crm/productos', label: 'Productos', icon: '🧇' },
  { href: '/crm/promociones', label: 'Promociones', icon: '🎁' },
  { href: '/crm/inventario', label: 'Inventario', icon: '📦' },
  { href: '/crm/clientes', label: 'Clientes', icon: '👥' },
  { href: '/crm/comentarios', label: 'Comentarios', icon: '💬' },
  { href: '/crm/reportes', label: 'Reportes', icon: '📊' },
];

export default function Sidebar({ email, lowStock = 0 }: { email: string; lowStock?: number }) {
  const path = usePathname();

  return (
    <aside
      style={{
        width: 240,
        background: C.sidebar,
        color: C.sidebarTxt,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '0 22px 24px', borderBottom: '1px solid #ffffff15' }}>
        <Link href="/" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', lineHeight: 1 }}>
            <div
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: 11,
                letterSpacing: '0.22em',
                fontWeight: 600,
                color: C.amber,
                marginBottom: 3,
              }}
            >
              BACON
            </div>
            <div style={{ fontSize: 40, letterSpacing: '0.015em', fontWeight: 500, color: C.amber }}>
              W<span style={{ fontStyle: 'italic' }}>AFF</span>LES
            </div>
          </div>
          <div
            style={{
              fontSize: 10,
              color: C.sidebarMuted,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginTop: 10,
            }}
          >
            CRM · v0.3
          </div>
        </Link>
      </div>

      <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV.map((n) => {
          const active = n.href === '/crm' ? path === '/crm' : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                background: active ? '#ffffff15' : 'transparent',
                color: active ? '#ffffff' : C.sidebarMuted,
                textDecoration: 'none',
                fontSize: 14,
              }}
            >
              <span style={{ width: 18, textAlign: 'center' }}>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.href === '/crm/inventario' && lowStock > 0 && (
                <span
                  style={{
                    minWidth: 18,
                    height: 18,
                    padding: '0 5px',
                    borderRadius: 9,
                    background: C.amber,
                    color: C.bg,
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={`${lowStock} ingrediente(s) a renovar`}
                >
                  {lowStock}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '12px 16px', borderTop: '1px solid #ffffff15', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: C.cream,
            color: C.ink,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          BW
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: '#fff' }}>Admin obrador</div>
          <div style={{ fontSize: 11, opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email}
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            title="Cerrar sesión"
            style={{ background: 'transparent', border: 0, color: C.sidebarMuted, cursor: 'pointer', fontSize: 16 }}
          >
            ⎋
          </button>
        </form>
      </div>
    </aside>
  );
}
