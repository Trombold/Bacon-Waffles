'use client';

import { useState, useTransition } from 'react';
import { CRM_THEME, CRM_THEME as C } from '@/lib/theme';
import type { Review } from '@/lib/types';
import { saveReview, deleteReview, toggleReview } from '@/app/crm/actions';

const FILTERS = ['Todos', 'Activos', 'Inactivos'] as const;

export default function ReviewsClient({ reviews }: { reviews: Review[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Todos');
  const [editing, setEditing] = useState<Review | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const shown = reviews.filter((r) => {
    if (filter === 'Activos') return r.active;
    if (filter === 'Inactivos') return !r.active;
    return true;
  });

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(r: Review) {
    setEditing(r);
    setOpen(true);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await saveReview(fd);
      setOpen(false);
    });
  }
  function remove(id: string) {
    const fd = new FormData();
    fd.set('id', id);
    startTransition(() => deleteReview(fd));
  }
  function toggle(r: Review) {
    const fd = new FormData();
    fd.set('id', r.id);
    fd.set('active', String(r.active));
    startTransition(() => toggleReview(fd));
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
          {FILTERS.map((fn) => (
            <button
              key={fn}
              onClick={() => setFilter(fn)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 0,
                background: filter === fn ? C.ink : 'transparent',
                color: filter === fn ? C.bg : C.muted,
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 600,
                fontFamily: 'inherit',
              }}
            >
              {fn}
            </button>
          ))}
        </div>
        <button onClick={openNew} style={btn(C)}>
          + Nuevo comentario
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ color: C.muted, textAlign: 'left', background: C.bg }}>
            {['Orden', 'Autor', 'Comentario', 'Estrellas', 'Estado', ''].map((h) => (
              <th key={h} style={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr key={r.id} style={{ borderTop: `1px solid ${C.line}` }}>
              <td style={{ ...td, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.muted }}>{r.sort}</td>
              <td style={{ ...td, fontWeight: 600, whiteSpace: 'nowrap' }}>{r.name}</td>
              <td style={{ ...td, color: C.muted, maxWidth: 420 }}>{r.text}</td>
              <td style={{ ...td, color: C.amber, whiteSpace: 'nowrap' }}>{'★'.repeat(r.stars)}</td>
              <td style={td}>
                <button onClick={() => toggle(r)} style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 0 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: r.active ? C.green : C.muted }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.active ? C.green : C.muted }} />
                    {r.active ? 'Visible' : 'Oculto'}
                  </span>
                </button>
              </td>
              <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <button onClick={() => openEdit(r)} style={iconBtn(C)} title="Editar">
                  ✎
                </button>
                <button onClick={() => remove(r.id)} style={iconBtn(C, C.red)} title="Eliminar">
                  🗑
                </button>
              </td>
            </tr>
          ))}
          {shown.length === 0 && (
            <tr>
              <td colSpan={6} style={{ ...td, textAlign: 'center', color: C.muted }}>
                Sin comentarios en este filtro.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {open && (
        <Modal onClose={() => setOpen(false)} title={editing ? 'Editar comentario' : 'Nuevo comentario'}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Field label="Autor">
              <input name="name" required defaultValue={editing?.name} placeholder="Camila R." style={inp(C)} />
            </Field>
            <Field label="Comentario (se muestra en el landing)">
              <textarea
                name="text"
                rows={3}
                required
                defaultValue={editing?.text || ''}
                placeholder="El King Kong es absurdamente bueno…"
                style={{ ...inp(C), height: 'auto', padding: '10px 12px', resize: 'vertical' }}
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Estrellas">
                <select name="stars" defaultValue={String(editing?.stars ?? 5)} style={inp(C)}>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {'★'.repeat(n)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Orden (menor = primero)">
                <input name="sort" type="number" defaultValue={editing?.sort ?? 0} style={inp(C)} />
              </Field>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink }}>
              <input type="checkbox" name="active" defaultChecked={editing ? editing.active : true} />
              Visible en el landing
            </label>
            <button type="submit" disabled={pending} style={{ ...btn(C), height: 42, opacity: pending ? 0.7 : 1 }}>
              {pending ? 'Guardando…' : 'Guardar comentario'}
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
