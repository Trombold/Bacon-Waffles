'use client';

import { useState, useMemo, useTransition } from 'react';
import { CRM_THEME, CRM_THEME as C } from '@/lib/theme';
import type { Ingredient, Purchase, RecipeLine, Product } from '@/lib/types';
import { PURCHASE_UNITS, purchaseUnitsFor, formatStock, CANON_LABEL, type CanonUnit } from '@/lib/units';
import {
  saveIngredient,
  deleteIngredient,
  toggleIngredient,
  adjustStock,
  savePurchase,
  deletePurchase,
  saveRecipeLine,
  deleteRecipeLine,
} from '@/app/crm/actions';

type Tab = 'ingredientes' | 'compras' | 'recetas';
const TABS: { id: Tab; label: string }[] = [
  { id: 'ingredientes', label: 'Ingredientes' },
  { id: 'compras', label: 'Compras' },
  { id: 'recetas', label: 'Recetas' },
];

const money = (n: number) => `$${n.toFixed(2)}`;
const isLow = (i: Ingredient) => i.active && i.threshold > 0 && i.stock <= i.threshold;

export default function InventarioClient({
  ingredients,
  purchases,
  recipeLines,
  products,
  monthlyExpense,
}: {
  ingredients: Ingredient[];
  purchases: Purchase[];
  recipeLines: RecipeLine[];
  products: Product[];
  monthlyExpense: number;
}) {
  const [tab, setTab] = useState<Tab>('ingredientes');
  const lowCount = ingredients.filter(isLow).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {lowCount > 0 && (
        <div
          style={{
            background: `${C.red}1a`,
            border: `1px solid ${C.red}55`,
            color: C.red,
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ⚠ {lowCount} ingrediente{lowCount > 1 ? 's' : ''} en o bajo el umbral — toca renovar inventario.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${tab === t.id ? C.amber : C.line}`,
              background: tab === t.id ? C.amber : 'transparent',
              color: tab === t.id ? C.bg : C.muted,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ingredientes' && <IngredientsTab ingredients={ingredients} />}
      {tab === 'compras' && <PurchasesTab purchases={purchases} ingredients={ingredients} monthlyExpense={monthlyExpense} />}
      {tab === 'recetas' && <RecipesTab products={products} ingredients={ingredients} recipeLines={recipeLines} />}
    </div>
  );
}

// ───────────────────────── Ingredientes ─────────────────────────

function IngredientsTab({ ingredients }: { ingredients: Ingredient[] }) {
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [open, setOpen] = useState(false);
  const [adjusting, setAdjusting] = useState<Ingredient | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await saveIngredient(fd);
      setOpen(false);
    });
  }
  function submitAdjust(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await adjustStock(fd);
      setAdjusting(null);
    });
  }
  function remove(id: string) {
    const fd = new FormData();
    fd.set('id', id);
    startTransition(() => deleteIngredient(fd));
  }
  function toggle(i: Ingredient) {
    const fd = new FormData();
    fd.set('id', i.id);
    fd.set('active', String(i.active));
    startTransition(() => toggleIngredient(fd));
  }

  return (
    <Panel>
      <Toolbar>
        <span style={{ fontSize: 13, color: C.muted }}>{ingredients.length} ingredientes</span>
        <button onClick={() => { setEditing(null); setOpen(true); }} style={btn(C)}>
          + Nuevo ingrediente
        </button>
      </Toolbar>

      <table style={tableStyle}>
        <thead>
          <tr style={trHead}>
            {['Ingrediente', 'Unidad', 'Stock', 'Umbral', 'Costo prom.', 'Estado', ''].map((h) => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ingredients.map((i) => (
            <tr key={i.id} style={{ borderTop: `1px solid ${C.line}`, background: isLow(i) ? `${C.red}12` : undefined }}>
              <td style={{ ...td, fontWeight: 600 }}>
                {i.name}
                {isLow(i) && <span style={{ color: C.red, marginLeft: 8, fontSize: 11 }}>● renovar</span>}
              </td>
              <td style={{ ...td, color: C.muted }}>{CANON_LABEL[i.unit]}</td>
              <td style={{ ...td, fontWeight: 600, color: isLow(i) ? C.red : C.ink }}>{formatStock(i.stock, i.unit)}</td>
              <td style={{ ...td, color: C.muted }}>{i.threshold > 0 ? formatStock(i.threshold, i.unit) : '—'}</td>
              <td style={{ ...td, color: C.muted }}>{i.avg_cost > 0 ? `${money(i.avg_cost)}/${CANON_LABEL[i.unit]}` : '—'}</td>
              <td style={td}>
                <button onClick={() => toggle(i)} style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 0 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: i.active ? C.green : C.muted }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: i.active ? C.green : C.muted }} />
                    {i.active ? 'Activo' : 'Inactivo'}
                  </span>
                </button>
              </td>
              <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <button onClick={() => setAdjusting(i)} style={iconBtn(C)} title="Ajustar stock">±</button>
                <button onClick={() => { setEditing(i); setOpen(true); }} style={iconBtn(C)} title="Editar">✎</button>
                <button onClick={() => remove(i.id)} style={iconBtn(C, C.red)} title="Eliminar">🗑</button>
              </td>
            </tr>
          ))}
          {ingredients.length === 0 && (
            <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: C.muted }}>Sin ingredientes. Agrega el primero.</td></tr>
          )}
        </tbody>
      </table>

      {open && (
        <Modal onClose={() => setOpen(false)} title={editing ? 'Editar ingrediente' : 'Nuevo ingrediente'}>
          <form onSubmit={submit} style={formCol}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Field label="Nombre">
              <input name="name" required defaultValue={editing?.name} placeholder="Fresas, Harina, Nutella…" style={inp(C)} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Unidad de medida">
                <select name="unit" defaultValue={editing?.unit ?? 'g'} style={inp(C)}>
                  <option value="g">Gramos (g)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="unidad">Unidades</option>
                </select>
              </Field>
              <Field label="Umbral de aviso">
                <input name="threshold" type="number" step="0.01" defaultValue={editing?.threshold ?? 0} style={inp(C)} />
              </Field>
            </div>
            {!editing && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Stock inicial (opcional)">
                  <input name="stock" type="number" step="0.01" defaultValue={0} style={inp(C)} />
                </Field>
                <Field label="Costo x unidad (opcional)">
                  <input name="avg_cost" type="number" step="0.0001" defaultValue={0} style={inp(C)} />
                </Field>
              </div>
            )}
            <SubmitBtn pending={pending} label="Guardar ingrediente" />
          </form>
        </Modal>
      )}

      {adjusting && (
        <Modal onClose={() => setAdjusting(null)} title={`Ajustar stock — ${adjusting.name}`}>
          <form onSubmit={submitAdjust} style={formCol}>
            <input type="hidden" name="id" value={adjusting.id} />
            <div style={{ fontSize: 13, color: C.muted }}>
              Stock actual: <strong style={{ color: C.ink }}>{formatStock(adjusting.stock, adjusting.unit)}</strong>
            </div>
            <Field label={`Cambio (en ${CANON_LABEL[adjusting.unit]}, negativo para restar)`}>
              <input name="delta" type="number" step="0.01" required placeholder="-500 o 500" style={inp(C)} />
            </Field>
            <Field label="Nota">
              <input name="note" placeholder="Merma, conteo físico…" style={inp(C)} />
            </Field>
            <SubmitBtn pending={pending} label="Aplicar ajuste" />
          </form>
        </Modal>
      )}
    </Panel>
  );
}

// ───────────────────────── Compras ─────────────────────────

function PurchasesTab({
  purchases,
  ingredients,
  monthlyExpense,
}: {
  purchases: Purchase[];
  ingredients: Ingredient[];
  monthlyExpense: number;
}) {
  const [open, setOpen] = useState(false);
  const [ingId, setIngId] = useState<string>(ingredients.find((i) => i.active)?.id || '');
  const [pending, startTransition] = useTransition();

  const selected = ingredients.find((i) => i.id === ingId);
  const unitOpts = selected ? purchaseUnitsFor(selected.unit as CanonUnit) : ['g'];

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await savePurchase(fd);
      setOpen(false);
    });
  }
  function remove(id: string) {
    const fd = new FormData();
    fd.set('id', id);
    startTransition(() => deletePurchase(fd));
  }

  return (
    <Panel>
      <Toolbar>
        <span style={{ fontSize: 14 }}>
          <span style={{ color: C.muted }}>Gasto del mes: </span>
          <strong style={{ color: C.amber, fontSize: 18 }}>{money(monthlyExpense)}</strong>
        </span>
        <button onClick={() => setOpen(true)} style={btn(C)} disabled={ingredients.length === 0}>
          + Nueva compra
        </button>
      </Toolbar>

      <table style={tableStyle}>
        <thead>
          <tr style={trHead}>
            {['Fecha', 'Ingrediente', 'Cantidad', 'Costo', ''].map((h) => (<th key={h} style={th}>{h}</th>))}
          </tr>
        </thead>
        <tbody>
          {purchases.map((p) => (
            <tr key={p.id} style={{ borderTop: `1px solid ${C.line}` }}>
              <td style={{ ...td, color: C.muted, fontSize: 12 }}>{new Date(p.created_at).toLocaleDateString('es-EC')}</td>
              <td style={{ ...td, fontWeight: 600 }}>{p.ingredient_name}</td>
              <td style={{ ...td, color: C.muted }}>{p.qty_display} {p.unit}</td>
              <td style={{ ...td, color: C.amber, fontWeight: 600 }}>{money(p.total_cost)}</td>
              <td style={{ ...td, textAlign: 'right' }}>
                <button onClick={() => remove(p.id)} style={iconBtn(C, C.red)} title="Eliminar">🗑</button>
              </td>
            </tr>
          ))}
          {purchases.length === 0 && (
            <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: C.muted }}>Sin compras registradas.</td></tr>
          )}
        </tbody>
      </table>

      {open && (
        <Modal onClose={() => setOpen(false)} title="Registrar compra">
          <form onSubmit={submit} style={formCol}>
            <Field label="Ingrediente">
              <select name="ingredient_id" value={ingId} onChange={(e) => setIngId(e.target.value)} required style={inp(C)}>
                {ingredients.filter((i) => i.active).map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Cantidad">
                <input name="qty_display" type="number" step="0.001" required placeholder="1" style={inp(C)} />
              </Field>
              <Field label="Unidad">
                <select name="unit" style={inp(C)}>
                  {unitOpts.map((u) => (<option key={u} value={u}>{PURCHASE_UNITS[u].label}</option>))}
                </select>
              </Field>
            </div>
            <Field label="Costo total (USD)">
              <input name="total_cost" type="number" step="0.01" required placeholder="2.50" style={inp(C)} />
            </Field>
            <div style={{ fontSize: 11, color: C.muted }}>
              La compra suma al stock del ingrediente y recalcula su costo promedio.
            </div>
            <SubmitBtn pending={pending} label="Guardar compra" />
          </form>
        </Modal>
      )}
    </Panel>
  );
}

// ───────────────────────── Recetas ─────────────────────────

function RecipesTab({
  products,
  ingredients,
  recipeLines,
}: {
  products: Product[];
  ingredients: Ingredient[];
  recipeLines: RecipeLine[];
}) {
  const [productId, setProductId] = useState<string>(products[0]?.id || '');
  const [pending, startTransition] = useTransition();

  const linesByProduct = useMemo(() => {
    const m = new Map<string, RecipeLine[]>();
    recipeLines.forEach((l) => {
      const arr = m.get(l.product_id) || [];
      arr.push(l);
      m.set(l.product_id, arr);
    });
    return m;
  }, [recipeLines]);

  const lines = linesByProduct.get(productId) || [];
  const usedIngIds = new Set(lines.map((l) => l.ingredient_id));
  const availableIngredients = ingredients.filter((i) => i.active && !usedIngIds.has(i.id));

  function addLine(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      await saveRecipeLine(fd);
      form.reset();
    });
  }
  function removeLine(id: string) {
    const fd = new FormData();
    fd.set('id', id);
    startTransition(() => deleteRecipeLine(fd));
  }

  return (
    <Panel>
      <Toolbar>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: C.muted }}>
          Producto
          <select value={productId} onChange={(e) => setProductId(e.target.value)} style={{ ...inp(C), width: 'auto', minWidth: 220 }}>
            {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
        </label>
        <span style={{ fontSize: 12, color: C.muted }}>{lines.length} ingrediente(s) en la receta</span>
      </Toolbar>

      <table style={tableStyle}>
        <thead>
          <tr style={trHead}>
            {['Ingrediente', 'Cantidad por preparación', ''].map((h) => (<th key={h} style={th}>{h}</th>))}
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id} style={{ borderTop: `1px solid ${C.line}` }}>
              <td style={{ ...td, fontWeight: 600 }}>{l.ingredient_name}</td>
              <td style={td}>{l.qty} {CANON_LABEL[l.unit]}</td>
              <td style={{ ...td, textAlign: 'right' }}>
                <button onClick={() => removeLine(l.id)} style={iconBtn(C, C.red)} title="Quitar">🗑</button>
              </td>
            </tr>
          ))}
          {lines.length === 0 && (
            <tr><td colSpan={3} style={{ ...td, textAlign: 'center', color: C.muted }}>Sin ingredientes. Agrega abajo.</td></tr>
          )}
        </tbody>
      </table>

      <form onSubmit={addLine} style={{ display: 'flex', gap: 10, padding: '16px 20px', borderTop: `1px solid ${C.line}`, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <input type="hidden" name="product_id" value={productId} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <Field label="Ingrediente">
            <select name="ingredient_id" required style={inp(C)} key={productId + availableIngredients.length}>
              {availableIngredients.length === 0 && <option value="">— sin ingredientes disponibles —</option>}
              {availableIngredients.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({CANON_LABEL[i.unit]})</option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ width: 160 }}>
          <Field label="Cantidad">
            <input name="qty" type="number" step="0.001" required placeholder="50" style={inp(C)} />
          </Field>
        </div>
        <button type="submit" disabled={pending || availableIngredients.length === 0} style={{ ...btn(C), height: 40, opacity: pending ? 0.7 : 1 }}>
          {pending ? '…' : 'Agregar'}
        </button>
      </form>
    </Panel>
  );
}

// ───────────────────────── Reusables ─────────────────────────

function Panel({ children }: { children: React.ReactNode }) {
  return <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>{children}</div>;
}

function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${C.line}`, gap: 12, flexWrap: 'wrap' }}>
      {children}
    </div>
  );
}

function SubmitBtn({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button type="submit" disabled={pending} style={{ ...btn(C), height: 42, opacity: pending ? 0.7 : 1 }}>
      {pending ? 'Guardando…' : label}
    </button>
  );
}

function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 24 }}>
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

const formCol: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 13 };
const trHead: React.CSSProperties = { color: C.muted, textAlign: 'left', background: C.bg };
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
