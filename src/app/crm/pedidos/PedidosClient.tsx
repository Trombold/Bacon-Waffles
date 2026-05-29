'use client';

import { useState, useTransition } from 'react';
import { CRM_THEME, CRM_THEME as C, ESTADOS, STATUS_ORDER, type OrderStatus } from '@/lib/theme';
import type { Order } from '@/lib/types';
import { EstadoChip } from '@/components/crm/ui';
import { advanceOrder, archiveOrder, unarchiveOrder, archiveDelivered, createOrder } from '@/app/crm/actions';

type View = 'kanban' | 'lista' | 'historial';

export default function PedidosClient({ orders, customers }: { orders: Order[]; customers: string[] }) {
  const [view, setView] = useState<View>('kanban');
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const active = orders.filter((o) => !o.archived);
  const archived = orders.filter((o) => o.archived);
  const deliveredActive = active.filter((o) => o.estado === 'entregado');

  const run = (fn: () => Promise<void>) => startTransition(() => void fn());

  function submitNew(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createOrder(fd);
      setOpen(false);
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13 }}>
        {(['kanban', 'lista', 'historial'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 0,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 600,
              background: view === v ? C.ink : 'transparent',
              color: view === v ? C.bg : C.muted,
              textTransform: 'capitalize',
            }}
          >
            {v}
            {v === 'historial' && archived.length > 0 ? ` · ${archived.length}` : ''}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {view === 'kanban' && deliveredActive.length > 0 && (
          <button
            onClick={() => run(() => archiveDelivered())}
            disabled={pending}
            style={{ ...ghost(C), color: C.muted }}
            title="Mover entregados al historial"
          >
            Archivar entregados ({deliveredActive.length})
          </button>
        )}
        <button onClick={() => setOpen(true)} style={btn(C)}>
          + Nuevo pedido
        </button>
      </div>

      {view === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {STATUS_ORDER.map((col) => {
            const items = active.filter((o) => o.estado === col);
            const est = ESTADOS[col];
            return (
              <div key={col} style={{ background: est.bg, borderRadius: 12, padding: 14, minHeight: 480 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{est.icon}</span>
                    <span style={{ fontWeight: 600, color: est.color }}>{est.label}</span>
                  </div>
                  <span style={{ fontSize: 12, color: C.muted, background: `${C.cardOnSoft}cc`, padding: '2px 8px', borderRadius: 999 }}>
                    {items.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map((o) => (
                    <div key={o.id} style={{ background: C.cardOnSoft, borderRadius: 10, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,.25)', color: C.ink }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <strong>{o.code}</strong>
                        <span style={{ fontSize: 11, color: C.muted }}>{o.hora}</span>
                      </div>
                      <div style={{ fontSize: 13, marginBottom: 4 }}>{o.cliente}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{o.items}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${C.line}`, paddingTop: 6 }}>
                        <strong style={{ color: C.amber }}>${o.total.toFixed(2)}</strong>
                        {col !== 'entregado' ? (
                          <button onClick={() => run(() => advance(o))} disabled={pending} style={linkBtn(C, C.amber)}>
                            Avanzar →
                          </button>
                        ) : (
                          <button onClick={() => run(() => archive(o.id))} disabled={pending} style={linkBtn(C, C.muted)} title="Mover al historial">
                            Archivar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div style={{ fontSize: 12, color: C.muted, textAlign: 'center', padding: '20px 0' }}>—</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'lista' && (
        <OrdersTable
          rows={active}
          empty="No hay pedidos activos. Crea uno con “+ Nuevo pedido”."
          renderActions={(o) => (
            <>
              {o.estado !== 'entregado' && (
                <button onClick={() => run(() => advance(o))} disabled={pending} style={linkBtn(C, C.amber)}>
                  Avanzar
                </button>
              )}
              <button onClick={() => run(() => archive(o.id))} disabled={pending} style={linkBtn(C, C.muted)}>
                Archivar
              </button>
            </>
          )}
        />
      )}

      {view === 'historial' && (
        <OrdersTable
          rows={archived}
          empty="El historial está vacío. Los pedidos archivados aparecerán aquí."
          renderActions={(o) => (
            <button onClick={() => run(() => unarchive(o.id))} disabled={pending} style={linkBtn(C, C.amber)}>
              Restaurar
            </button>
          )}
        />
      )}

      {open && (
        <div onClick={() => setOpen(false)} style={overlay}>
          <div onClick={(e) => e.stopPropagation()} style={modal(C)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600 }}>Nuevo pedido</h2>
              <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 0, color: C.muted, fontSize: 20, cursor: 'pointer' }}>
                ×
              </button>
            </div>
            <p style={{ color: C.muted, fontSize: 12, margin: '0 0 16px', lineHeight: 1.5 }}>
              Registra manualmente un pedido recibido por WhatsApp.
            </p>
            <form onSubmit={submitNew} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Cliente">
                <select name="cliente" required defaultValue="" style={inp(C)}>
                  <option value="" disabled>
                    Selecciona un cliente
                  </option>
                  {customers.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Items (resumen)">
                <input name="items" required placeholder="2× King Kong, 1× Mocca" style={inp(C)} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Total (USD)">
                  <input name="total" type="number" step="0.01" required placeholder="0.00" style={inp(C)} />
                </Field>
                <Field label="Estado inicial">
                  <select name="estado" defaultValue="recibido" style={inp(C)}>
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {ESTADOS[s].label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <button type="submit" disabled={pending} style={{ ...btn(C), height: 42, opacity: pending ? 0.7 : 1 }}>
                {pending ? 'Creando…' : 'Crear pedido'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // ── helpers de acción ──
  function advance(o: Order) {
    const fd = new FormData();
    fd.set('id', o.id);
    fd.set('estado', o.estado);
    return advanceOrder(fd);
  }
  function archive(id: string) {
    const fd = new FormData();
    fd.set('id', id);
    return archiveOrder(fd);
  }
  function unarchive(id: string) {
    const fd = new FormData();
    fd.set('id', id);
    return unarchiveOrder(fd);
  }
}

function OrdersTable({
  rows,
  empty,
  renderActions,
}: {
  rows: Order[];
  empty: string;
  renderActions: (o: Order) => React.ReactNode;
}) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ color: C.muted, textAlign: 'left', background: C.bg }}>
            {['Pedido', 'Cliente', 'Items', 'Total', 'Hora', 'Estado', ''].map((h) => (
              <th key={h} style={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id} style={{ borderTop: `1px solid ${C.line}` }}>
              <td style={{ ...td, fontWeight: 600 }}>{o.code}</td>
              <td style={td}>{o.cliente}</td>
              <td style={{ ...td, color: C.muted }}>{o.items}</td>
              <td style={{ ...td, color: C.amber, fontWeight: 600 }}>${o.total.toFixed(2)}</td>
              <td style={{ ...td, color: C.muted }}>{o.hora}</td>
              <td style={td}>
                <EstadoChip e={o.estado as OrderStatus} />
              </td>
              <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{renderActions(o)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} style={{ ...td, textAlign: 'center', color: C.muted }}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 };

function modal(c: typeof CRM_THEME): React.CSSProperties {
  return { width: '100%', maxWidth: 440, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 14, padding: 24 };
}
function btn(c: typeof CRM_THEME): React.CSSProperties {
  return { padding: '8px 14px', background: c.amber, color: c.bg, border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
}
function ghost(c: typeof CRM_THEME): React.CSSProperties {
  return { padding: '6px 12px', background: 'transparent', border: `1px solid ${c.line}`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
}
function linkBtn(c: typeof CRM_THEME, color: string): React.CSSProperties {
  return { background: 'transparent', border: 0, fontSize: 11, color, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', marginLeft: 10 };
}
function inp(c: typeof CRM_THEME): React.CSSProperties {
  return { width: '100%', height: 40, background: c.bg, color: c.ink, border: `1px solid ${c.line}`, borderRadius: 8, padding: '0 12px', fontSize: 14, fontFamily: 'inherit', textTransform: 'none', letterSpacing: 'normal' };
}
