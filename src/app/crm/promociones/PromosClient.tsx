'use client';

import { useState, useTransition } from 'react';
import { CRM_THEME, CRM_THEME as C } from '@/lib/theme';
import type { Promotion, PromoType, PromoScope } from '@/lib/types';
import {
  savePromotion,
  deletePromotion,
  togglePromotion,
  resetPromotionRedemptions,
} from '@/app/crm/actions';

type Prod = { id: string; name: string; price: number; cat: string };

const CATS = ['Dulces', 'Salados', 'Combos', 'Bebidas'] as const;
const TYPE_LABEL: Record<PromoType, string> = {
  free_item: 'Item gratis',
  percent: '% descuento',
  fixed: '$ descuento',
};
// getDay(): 0=Dom..6=Sáb. Se muestran en orden L→D.
const DAYS: { v: number; l: string }[] = [
  { v: 1, l: 'L' }, { v: 2, l: 'M' }, { v: 3, l: 'X' }, { v: 4, l: 'J' },
  { v: 5, l: 'V' }, { v: 6, l: 'S' }, { v: 0, l: 'D' },
];

export default function PromosClient({ promotions, products }: { promotions: Promotion[]; products: Prod[] }) {
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // Estado local para campos condicionales del form.
  const [type, setType] = useState<PromoType>('free_item');
  const [scope, setScope] = useState<PromoScope>('category');

  const prodName = (id: string | null) => products.find((p) => p.id === id)?.name || '(producto)';

  function openNew() {
    setEditing(null);
    setType('free_item');
    setScope('category');
    setOpen(true);
  }
  function openEdit(p: Promotion) {
    setEditing(p);
    setType(p.type);
    setScope(p.trigger_scope);
    setOpen(true);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await savePromotion(fd);
      setOpen(false);
    });
  }
  function remove(id: string) {
    const fd = new FormData();
    fd.set('id', id);
    startTransition(() => deletePromotion(fd));
  }
  function toggle(p: Promotion) {
    const fd = new FormData();
    fd.set('id', p.id);
    fd.set('active', String(p.active));
    startTransition(() => togglePromotion(fd));
  }
  function resetCanjes(id: string) {
    const fd = new FormData();
    fd.set('id', id);
    startTransition(() => resetPromotionRedemptions(fd));
  }

  // ── Resúmenes para la tabla ──
  function condText(p: Promotion): string {
    if (p.trigger_scope === 'order') return p.min_order_total != null ? `Pedido ≥ $${p.min_order_total}` : 'Cualquier pedido';
    const ref = p.trigger_scope === 'product' ? prodName(p.trigger_ref) : p.trigger_ref || '—';
    return `≥ ${p.trigger_qty}× ${ref}`;
  }
  function rewardText(p: Promotion): string {
    if (p.type === 'free_item') return `${p.reward_qty}× ${p.reward_name || '(item)'} gratis`;
    if (p.type === 'percent') return `${p.reward_value}% off`;
    return `$${p.reward_value} off`;
  }
  function vigenciaText(p: Promotion): string {
    const parts: string[] = [];
    const d = (s: string) => new Date(s).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
    if (p.starts_at || p.ends_at) parts.push(`${p.starts_at ? d(p.starts_at) : '…'}–${p.ends_at ? d(p.ends_at) : '…'}`);
    if (p.days_mask) parts.push(DAYS.filter((x) => (p.days_mask! & (1 << x.v)) !== 0).map((x) => x.l).join(''));
    if (p.time_from || p.time_to) parts.push(`${(p.time_from || '').slice(0, 5)}–${(p.time_to || '').slice(0, 5)}`);
    return parts.join(' · ') || 'Siempre';
  }

  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${C.line}` }}>
        <div>
          <div style={{ fontWeight: 600, color: C.ink }}>Promociones</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
            El regalo se descuenta del inventario y su costo baja el margen automáticamente.
          </div>
        </div>
        <button onClick={openNew} style={btn(C)}>+ Nueva promoción</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ color: C.muted, textAlign: 'left', background: C.bg }}>
            {['Promoción', 'Tipo', 'Condición', 'Recompensa', 'Vigencia', 'Canjes', 'Landing', 'Estado', ''].map((h) => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {promotions.map((p) => {
            const agotada = p.max_redemptions != null && p.redemptions >= p.max_redemptions;
            return (
              <tr key={p.id} style={{ borderTop: `1px solid ${C.line}` }}>
                <td style={{ ...td, fontWeight: 600 }}>{p.name}</td>
                <td style={td}><span style={{ padding: '2px 8px', background: C.bg, borderRadius: 6, fontSize: 12 }}>{TYPE_LABEL[p.type]}</span></td>
                <td style={{ ...td, color: C.muted }}>{condText(p)}</td>
                <td style={{ ...td, color: C.green }}>{rewardText(p)}</td>
                <td style={{ ...td, color: C.muted, fontSize: 12 }}>{vigenciaText(p)}</td>
                <td style={td}>
                  <span style={{ color: agotada ? C.red : C.ink, fontWeight: 600 }}>
                    {p.redemptions}{p.max_redemptions != null ? ` / ${p.max_redemptions}` : ''}
                  </span>
                  {p.reward_cost != null && p.reward_cost > 0 && (
                    <span style={{ color: C.muted, fontSize: 11 }}> · ~${(p.reward_cost * p.redemptions).toFixed(2)}</span>
                  )}
                </td>
                <td style={td}>{p.show_on_landing ? '🌐' : <span style={{ color: C.muted }}>—</span>}</td>
                <td style={td}>
                  <button onClick={() => toggle(p)} style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 0 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: p.active ? C.green : C.muted }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.active ? C.green : C.muted }} />
                      {p.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </button>
                </td>
                <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {agotada && (
                    <button onClick={() => resetCanjes(p.id)} style={iconBtn(C, C.amber2)} title="Reiniciar contador de canjes">↺</button>
                  )}
                  <button onClick={() => openEdit(p)} style={iconBtn(C)} title="Editar">✎</button>
                  <button onClick={() => remove(p.id)} style={iconBtn(C, C.red)} title="Eliminar">🗑</button>
                </td>
              </tr>
            );
          })}
          {promotions.length === 0 && (
            <tr><td colSpan={9} style={{ ...td, textAlign: 'center', color: C.muted }}>Sin promociones. Crea una con “+ Nueva promoción”.</td></tr>
          )}
        </tbody>
      </table>

      {open && (
        <Modal onClose={() => setOpen(false)} title={editing ? 'Editar promoción' : 'Nueva promoción'}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {editing && <input type="hidden" name="id" value={editing.id} />}

            <Field label="Nombre">
              <input name="name" required defaultValue={editing?.name} placeholder="Apertura · té gratis" style={inp(C)} />
            </Field>
            <Field label="Descripción (se muestra en el landing)">
              <textarea name="description" rows={2} defaultValue={editing?.description || ''}
                placeholder="Compra 2 waffles de sal y llévate un té helado de 400 ml gratis."
                style={{ ...inp(C), height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
            </Field>

            <Field label="Tipo de promoción">
              <select name="type" value={type} onChange={(e) => setType(e.target.value as PromoType)} style={inp(C)}>
                <option value="free_item">Item gratis</option>
                <option value="percent">% descuento</option>
                <option value="fixed">$ descuento fijo</option>
              </select>
            </Field>

            <Sub>Condición — qué dispara la promo</Sub>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Aplica sobre">
                <select name="trigger_scope" value={scope} onChange={(e) => setScope(e.target.value as PromoScope)} style={inp(C)}>
                  <option value="category">Una categoría</option>
                  <option value="product">Un producto</option>
                  <option value="order">El pedido entero</option>
                </select>
              </Field>
              {scope !== 'order' && (
                <Field label="Cantidad mínima (N)">
                  <input name="trigger_qty" type="number" min={1} defaultValue={editing?.trigger_qty ?? 2} style={inp(C)} />
                </Field>
              )}
            </div>
            {scope === 'category' && (
              <Field label="Categoría disparadora">
                <select name="trigger_ref" defaultValue={editing?.trigger_ref || 'Salados'} style={inp(C)}>
                  {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            )}
            {scope === 'product' && (
              <Field label="Producto disparador">
                <select name="trigger_ref" defaultValue={editing?.trigger_ref || ''} style={inp(C)}>
                  <option value="" disabled>Selecciona…</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
            )}

            <Sub>Recompensa</Sub>
            {type === 'free_item' ? (
              <>
                <Field label="Producto de regalo">
                  <select name="reward_product_id" required defaultValue={editing?.reward_product_id || ''} style={inp(C)}>
                    <option value="" disabled>Selecciona…</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} — ${p.price.toFixed(2)}</option>)}
                  </select>
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Regalos por gatillo">
                    <input name="reward_qty" type="number" min={1} defaultValue={editing?.reward_qty ?? 1} style={inp(C)} />
                  </Field>
                  <Field label="Tope de regalos / pedido">
                    <input name="reward_max_per_order" type="number" min={1} defaultValue={editing?.reward_max_per_order ?? 1} style={inp(C)} />
                  </Field>
                </div>
              </>
            ) : (
              <Field label={type === 'percent' ? 'Porcentaje de descuento (%)' : 'Monto de descuento ($)'}>
                <input name="reward_value" type="number" step="0.01" min={0} defaultValue={editing?.reward_value ?? 0} style={inp(C)} />
              </Field>
            )}

            <Sub>Restricciones anti-abuso (opcionales)</Sub>
            <Field label="Pedido mínimo ($) — vacío = sin mínimo">
              <input name="min_order_total" type="number" step="0.01" min={0} defaultValue={editing?.min_order_total ?? ''} placeholder="—" style={inp(C)} />
            </Field>
            <Field label="Tope total de canjes — vacío = ilimitado">
              <input name="max_redemptions" type="number" min={1} defaultValue={editing?.max_redemptions ?? ''} placeholder="—" style={inp(C)} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Desde (fecha/hora)">
                <input name="starts_at" type="datetime-local" defaultValue={(editing?.starts_at || '').slice(0, 16)} style={inp(C)} />
              </Field>
              <Field label="Hasta (fecha/hora)">
                <input name="ends_at" type="datetime-local" defaultValue={(editing?.ends_at || '').slice(0, 16)} style={inp(C)} />
              </Field>
            </div>
            <Field label="Días de la semana — ninguno = todos">
              <div style={{ display: 'flex', gap: 6 }}>
                {DAYS.map((d) => {
                  const checked = editing?.days_mask ? (editing.days_mask & (1 << d.v)) !== 0 : false;
                  return (
                    <label key={d.v} style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" name="days" value={d.v} defaultChecked={checked} style={{ display: 'block', margin: '0 auto 4px' }} />
                      <span style={{ fontSize: 12, color: C.muted }}>{d.l}</span>
                    </label>
                  );
                })}
              </div>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Hora desde — vacío = todo el día">
                <input name="time_from" type="time" defaultValue={(editing?.time_from || '').slice(0, 5)} style={inp(C)} />
              </Field>
              <Field label="Hora hasta">
                <input name="time_to" type="time" defaultValue={(editing?.time_to || '').slice(0, 5)} style={inp(C)} />
              </Field>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink }}>
              <input type="checkbox" name="stackable" defaultChecked={editing?.stackable ?? false} />
              Combinable con otras promos en el mismo pedido
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink }}>
              <input type="checkbox" name="show_on_landing" defaultChecked={editing?.show_on_landing ?? false} />
              Anunciar en el landing público
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink }}>
              <input type="checkbox" name="active" defaultChecked={editing ? editing.active : true} />
              Promoción activa
            </label>

            <button type="submit" disabled={pending} style={{ ...btn(C), height: 42, opacity: pending ? 0.7 : 1 }}>
              {pending ? 'Guardando…' : 'Guardar promoción'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 50, padding: 20, overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 24, margin: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600, color: C.ink }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: C.muted, fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
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
function Sub({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, color: C.amber2, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, borderTop: `1px solid ${C.line}`, paddingTop: 12, marginTop: 2 }}>
      {children}
    </div>
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
