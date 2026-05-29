'use client';

import { useState, useTransition } from 'react';
import { CRM_THEME, CRM_THEME as C } from '@/lib/theme';
import type { Product } from '@/lib/types';
import { saveProduct, deleteProduct, toggleProduct } from '@/app/crm/actions';

const CATS = ['Todos', 'Dulces', 'Salados', 'Bebidas', 'Inactivos'] as const;

export default function ProductsClient({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<(typeof CATS)[number]>('Todos');
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const shown = products.filter((p) => {
    if (filter === 'Todos') return true;
    if (filter === 'Inactivos') return !p.active;
    return p.cat === filter;
  });

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setOpen(true);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await saveProduct(fd);
      setOpen(false);
    });
  }
  function remove(id: string) {
    const fd = new FormData();
    fd.set('id', id);
    startTransition(() => deleteProduct(fd));
  }
  function toggle(p: Product) {
    const fd = new FormData();
    fd.set('id', p.id);
    fd.set('active', String(p.active));
    startTransition(() => toggleProduct(fd));
  }

  return (
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
        <div style={{ display: 'flex', gap: 8 }}>
          {CATS.map((cn) => (
            <button
              key={cn}
              onClick={() => setFilter(cn)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 0,
                background: filter === cn ? C.ink : 'transparent',
                color: filter === cn ? C.bg : C.muted,
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 600,
                fontFamily: 'inherit',
              }}
            >
              {cn}
            </button>
          ))}
        </div>
        <button onClick={openNew} style={btn(C)}>
          + Nuevo producto
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ color: C.muted, textAlign: 'left', background: C.bg }}>
            {['SKU', 'Producto', 'Categoría', 'Precio', 'Stock', 'Estado', ''].map((h) => (
              <th key={h} style={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((p) => (
            <tr key={p.id} style={{ borderTop: `1px solid ${C.line}` }}>
              <td style={{ ...td, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.muted }}>{p.sku}</td>
              <td style={{ ...td, fontWeight: 600 }}>{p.name}</td>
              <td style={td}>
                <span style={{ padding: '2px 8px', background: C.bg, borderRadius: 6, fontSize: 12 }}>{p.cat}</span>
              </td>
              <td style={{ ...td, color: C.amber, fontWeight: 600 }}>${Number(p.price).toFixed(2)}</td>
              <td style={td}>
                {p.stock} <span style={{ fontSize: 11, color: C.muted }}>u.</span>
              </td>
              <td style={td}>
                <button onClick={() => toggle(p)} style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 0 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: p.active ? C.green : C.muted }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.active ? C.green : C.muted }} />
                    {p.active ? 'Activo' : 'Inactivo'}
                  </span>
                </button>
              </td>
              <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <button onClick={() => openEdit(p)} style={iconBtn(C)} title="Editar">
                  ✎
                </button>
                <button onClick={() => remove(p.id)} style={iconBtn(C, C.red)} title="Eliminar">
                  🗑
                </button>
              </td>
            </tr>
          ))}
          {shown.length === 0 && (
            <tr>
              <td colSpan={7} style={{ ...td, textAlign: 'center', color: C.muted }}>
                Sin productos en esta categoría.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {open && (
        <Modal onClose={() => setOpen(false)} title={editing ? 'Editar producto' : 'Nuevo producto'}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Field label="Nombre">
              <input name="name" required defaultValue={editing?.name} style={inp(C)} />
            </Field>
            {editing ? (
              <Field label="Código (SKU) — fijo">
                <input value={editing.sku} disabled style={{ ...inp(C), opacity: 0.6 }} />
                <input type="hidden" name="sku" value={editing.sku} />
                <input type="hidden" name="cat" value={editing.cat} />
              </Field>
            ) : (
              <Field label="Tipo de producto (define categoría y código)">
                <select name="prefix" defaultValue="DLC" style={inp(C)}>
                  <option value="DLC">Dulces (DLC)</option>
                  <option value="SLD">Salados (SLD)</option>
                  <option value="BBD">Bebidas (BBD)</option>
                </select>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                  El código SKU se genera automático y único (p. ej. DLC-009).
                </div>
              </Field>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Precio (USD)">
                <input name="price" type="number" step="0.01" required defaultValue={editing?.price} style={inp(C)} />
              </Field>
              <Field label="Stock">
                <input name="stock" type="number" required defaultValue={editing?.stock ?? 0} style={inp(C)} />
              </Field>
            </div>
            <Field label="Descripción (se muestra en el landing)">
              <textarea
                name="description"
                rows={2}
                defaultValue={editing?.description || ''}
                placeholder="Ingredientes, p. ej. Plátano, manjar, Nutella…"
                style={{ ...inp(C), height: 'auto', padding: '10px 12px', resize: 'vertical' }}
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Dulzura (0–5)">
                <select name="sweet" defaultValue={String(editing?.sweet ?? 0)} style={inp(C)}>
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? '— (sin medir)' : '★'.repeat(n)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Etiqueta">
                <input name="tag" defaultValue={editing?.tag || ''} placeholder="TOP, NUEVO…" style={inp(C)} />
              </Field>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink }}>
              <input type="checkbox" name="active" defaultChecked={editing ? editing.active : true} />
              Producto activo
            </label>
            <button type="submit" disabled={pending} style={{ ...btn(C), height: 42, opacity: pending ? 0.7 : 1 }}>
              {pending ? 'Guardando…' : 'Guardar producto'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
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
        style={{ width: '100%', maxWidth: 440, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 24 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600, color: C.ink }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: C.muted, fontSize: 20, cursor: 'pointer' }}>
            ×
          </button>
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
