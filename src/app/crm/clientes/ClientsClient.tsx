'use client';

import { useState, useTransition } from 'react';
import { CRM_THEME, CRM_THEME as C } from '@/lib/theme';
import type { Customer } from '@/lib/types';
import { StatCard } from '@/components/crm/ui';
import { saveCustomer, deleteCustomer } from '@/app/crm/actions';

export default function ClientsClient({ customers }: { customers: Customer[] }) {
  const [editing, setEditing] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const total = customers.length;
  const recurrentes = customers.filter((c) => c.orders >= 3).length;
  const recurPct = total ? Math.round((recurrentes / total) * 100) : 0;
  const allOrders = customers.reduce((s, c) => s + c.orders, 0);
  const allTotal = customers.reduce((s, c) => s + c.total, 0);
  const ticket = allOrders ? allTotal / allOrders : 0;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await saveCustomer(fd);
      setOpen(false);
    });
  }
  function remove(id: string) {
    const fd = new FormData();
    fd.set('id', id);
    startTransition(() => deleteCustomer(fd));
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        <StatCard label="Clientes totales" value={String(total)} sub="registrados en el CRM" accent={C.amber} />
        <StatCard label="Recurrentes" value={`${recurPct}%`} sub={`${recurrentes} con +3 pedidos`} />
        <StatCard label="Ticket promedio" value={`$${ticket.toFixed(2)}`} sub="USD por pedido" />
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          <div style={{ fontWeight: 600 }}>Clientes</div>
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            style={btn(C)}
          >
            + Añadir cliente
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: C.muted, textAlign: 'left', background: C.bg }}>
              {['Cliente', 'WhatsApp', 'Zona', 'Pedidos', 'Total gastado', 'Último', ''].map((h) => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.map((cl) => (
              <tr key={cl.id} style={{ borderTop: `1px solid ${C.line}` }}>
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: C.cream,
                        color: C.amber,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {cl.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                    </div>
                    <span style={{ fontWeight: 600 }}>{cl.name}</span>
                  </div>
                </td>
                <td style={{ ...td, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.muted }}>{cl.phone}</td>
                <td style={td}>{cl.zone}</td>
                <td style={td}>{cl.orders}</td>
                <td style={{ ...td, fontWeight: 600, color: C.amber }}>${cl.total.toFixed(2)}</td>
                <td style={{ ...td, color: C.muted }}>{cl.last}</td>
                <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    onClick={() => {
                      setEditing(cl);
                      setOpen(true);
                    }}
                    style={iconBtn(C)}
                    title="Editar"
                  >
                    ✎
                  </button>
                  <button onClick={() => remove(cl.id)} style={iconBtn(C, C.red)} title="Eliminar">
                    🗑
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...td, textAlign: 'center', color: C.muted }}>
                  Aún no hay clientes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 420, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600 }}>
                {editing ? 'Editar cliente' : 'Nuevo cliente'}
              </h2>
              <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 0, color: C.muted, fontSize: 20, cursor: 'pointer' }}>
                ×
              </button>
            </div>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <Field label="Nombre">
                <input name="name" required defaultValue={editing?.name} style={inp(C)} />
              </Field>
              <Field label="WhatsApp">
                <input name="phone" required defaultValue={editing?.phone} placeholder="+593 9..." style={inp(C)} />
              </Field>
              <Field label="Zona / sector">
                <input name="zone" defaultValue={editing?.zone === '—' ? '' : editing?.zone} style={inp(C)} />
              </Field>
              <button type="submit" disabled={pending} style={{ ...btn(C), height: 42, opacity: pending ? 0.7 : 1 }}>
                {pending ? 'Guardando…' : 'Guardar cliente'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 12, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      {label}
      <div style={{ marginTop: 6 }}>{children}</div>
    </label>
  );
}

const th: React.CSSProperties = { padding: '12px 20px', fontWeight: 500, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' };
const td: React.CSSProperties = { padding: '12px 20px' };

function btn(c: typeof CRM_THEME): React.CSSProperties {
  return { padding: '8px 14px', background: c.amber, color: c.bg, border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
}
function iconBtn(c: typeof CRM_THEME, color?: string): React.CSSProperties {
  return { background: 'transparent', border: 0, color: color || c.muted, cursor: 'pointer', fontSize: 14, marginLeft: 8 };
}
function inp(c: typeof CRM_THEME): React.CSSProperties {
  return { width: '100%', height: 40, background: c.bg, color: c.ink, border: `1px solid ${c.line}`, borderRadius: 8, padding: '0 12px', fontSize: 14, fontFamily: 'inherit', textTransform: 'none', letterSpacing: 'normal' };
}
