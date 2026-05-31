'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/supabase/server';
import { nextStatus, type OrderStatus } from '@/lib/theme';
import { toCanonical, type CanonUnit } from '@/lib/units';

// ───────── Productos ─────────

const PREFIX_CAT: Record<string, 'Dulces' | 'Salados' | 'Combos' | 'Bebidas'> = {
  DLC: 'Dulces',
  SLD: 'Salados',
  CMB: 'Combos',
  BBD: 'Bebidas',
};

// Genera el siguiente SKU correlativo y único para un prefijo (DLC-007, etc.).
async function nextSku(
  supabase: Awaited<ReturnType<typeof requireUser>>['supabase'],
  prefix: string
): Promise<string> {
  const { data } = await supabase.from('products').select('sku').like('sku', `${prefix}-%`);
  const max = (data || []).reduce((m: number, r: { sku: string }) => {
    const n = parseInt(String(r.sku).split('-')[1] || '0', 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

export async function saveProduct(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id') || '');
  const sweetRaw = formData.get('sweet');
  const tagRaw = String(formData.get('tag') || '').trim();

  // SKU/categoría: en edición se conservan (el SKU es identidad); en creación
  // el prefijo elegido define la categoría y el SKU se autogenera único.
  let sku: string;
  let cat: string;
  if (id) {
    sku = String(formData.get('sku') || '');
    cat = String(formData.get('cat') || 'Dulces');
  } else {
    const prefix = String(formData.get('prefix') || 'DLC');
    cat = PREFIX_CAT[prefix] || 'Dulces';
    sku = await nextSku(supabase, PREFIX_CAT[prefix] ? prefix : 'DLC');
  }

  const payload = {
    sku,
    name: String(formData.get('name') || ''),
    cat,
    price: Number(formData.get('price') || 0),
    active: formData.get('active') === 'on',
    description: String(formData.get('description') || '').trim() || null,
    sweet: sweetRaw && Number(sweetRaw) > 0 ? Number(sweetRaw) : null,
    tag: tagRaw || null,
  };

  if (id) {
    await supabase.from('products').update(payload).eq('id', id);
  } else {
    await supabase.from('products').insert(payload);
  }
  revalidatePath('/crm/productos');
  revalidatePath('/crm');
  revalidatePath('/'); // menú del landing
}

export async function deleteProduct(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from('products').delete().eq('id', String(formData.get('id')));
  revalidatePath('/crm/productos');
  revalidatePath('/');
}

export async function toggleProduct(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id'));
  const active = formData.get('active') === 'true';
  await supabase.from('products').update({ active: !active }).eq('id', id);
  revalidatePath('/crm/productos');
  revalidatePath('/');
}

// ───────── Comentarios / reseñas ─────────

export async function saveReview(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id') || '');
  const starsRaw = Number(formData.get('stars') || 5);
  const payload = {
    name: String(formData.get('name') || '').trim(),
    text: String(formData.get('text') || '').trim(),
    stars: starsRaw >= 1 && starsRaw <= 5 ? starsRaw : 5,
    sort: Number(formData.get('sort') || 0),
    active: formData.get('active') === 'on',
  };
  if (id) {
    await supabase.from('reviews').update(payload).eq('id', id);
  } else {
    await supabase.from('reviews').insert(payload);
  }
  revalidatePath('/crm/comentarios');
  revalidatePath('/'); // sección de reseñas del landing
}

export async function deleteReview(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from('reviews').delete().eq('id', String(formData.get('id')));
  revalidatePath('/crm/comentarios');
  revalidatePath('/');
}

export async function toggleReview(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id'));
  const active = formData.get('active') === 'true';
  await supabase.from('reviews').update({ active: !active }).eq('id', id);
  revalidatePath('/crm/comentarios');
  revalidatePath('/');
}

// ───────── Inventario: ingredientes ─────────

export async function saveIngredient(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id') || '');
  const unit = (String(formData.get('unit') || 'g') as CanonUnit);
  const name = String(formData.get('name') || '').trim();
  const threshold = Number(formData.get('threshold') || 0);

  if (id) {
    // Edición: no se toca el stock (eso va por compras/ajustes), solo datos.
    await supabase.from('ingredients').update({ name, unit, threshold }).eq('id', id);
  } else {
    // Alta: stock inicial opcional → se asienta como ajuste para dejar rastro.
    const stock = Number(formData.get('stock') || 0);
    const avgCost = Number(formData.get('avg_cost') || 0);
    const { data: created } = await supabase
      .from('ingredients')
      .insert({ name, unit, threshold, stock, avg_cost: avgCost })
      .select('id')
      .single();
    if (created && stock > 0) {
      await supabase.from('inventory_movements').insert({
        ingredient_id: created.id,
        type: 'adjustment',
        qty: stock,
        cost: avgCost > 0 ? Math.round(stock * avgCost * 100) / 100 : null,
        ref: 'Stock inicial',
      });
    }
  }
  revalidatePath('/crm/inventario');
  revalidatePath('/crm');
}

export async function deleteIngredient(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from('ingredients').delete().eq('id', String(formData.get('id')));
  revalidatePath('/crm/inventario');
  revalidatePath('/crm');
}

export async function toggleIngredient(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id'));
  const active = formData.get('active') === 'true';
  await supabase.from('ingredients').update({ active: !active }).eq('id', id);
  revalidatePath('/crm/inventario');
}

// Ajuste manual de stock (merma, conteo físico, corrección). delta puede ser +/-.
export async function adjustStock(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id'));
  const delta = Number(formData.get('delta') || 0);
  const note = String(formData.get('note') || '').trim() || 'Ajuste manual';
  if (!id || delta === 0) return;

  const { data: ing } = await supabase.from('ingredients').select('stock').eq('id', id).single();
  if (!ing) return;
  await supabase.from('ingredients').update({ stock: Number(ing.stock) + delta }).eq('id', id);
  await supabase.from('inventory_movements').insert({
    ingredient_id: id,
    type: 'adjustment',
    qty: delta,
    ref: note,
  });
  revalidatePath('/crm/inventario');
  revalidatePath('/crm');
}

// ───────── Inventario: compras (gasto + entrada de stock) ─────────

export async function savePurchase(formData: FormData) {
  const { supabase } = await requireUser();
  const ingredientId = String(formData.get('ingredient_id') || '');
  const qtyDisplay = Number(formData.get('qty_display') || 0);
  const unit = String(formData.get('unit') || 'g');
  const totalCost = Number(formData.get('total_cost') || 0);
  if (!ingredientId || qtyDisplay <= 0) return;

  const { data: ing } = await supabase
    .from('ingredients')
    .select('name, unit, stock, avg_cost')
    .eq('id', ingredientId)
    .single();
  if (!ing) return;

  const qtyCanon = toCanonical(qtyDisplay, unit, ing.unit as CanonUnit);
  const stockOld = Number(ing.stock);
  const avgOld = Number(ing.avg_cost);
  const stockNew = stockOld + qtyCanon;
  // Costo promedio ponderado por unidad canónica.
  const avgNew = stockNew > 0 ? (stockOld * avgOld + totalCost) / stockNew : avgOld;

  await supabase.from('purchases').insert({
    ingredient_id: ingredientId,
    ingredient_name: ing.name,
    qty_display: qtyDisplay,
    unit,
    qty_canon: qtyCanon,
    total_cost: totalCost,
  });
  await supabase.from('inventory_movements').insert({
    ingredient_id: ingredientId,
    type: 'purchase',
    qty: qtyCanon,
    cost: totalCost,
    ref: `Compra ${qtyDisplay} ${unit}`,
  });
  await supabase
    .from('ingredients')
    .update({ stock: stockNew, avg_cost: Math.round(avgNew * 10000) / 10000 })
    .eq('id', ingredientId);

  revalidatePath('/crm/inventario');
  revalidatePath('/crm');
  revalidatePath('/crm/reportes');
}

export async function deletePurchase(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id'));
  // Revierte el stock que sumó esta compra (avg_cost no se recalcula hacia atrás).
  const { data: p } = await supabase
    .from('purchases')
    .select('ingredient_id, qty_canon')
    .eq('id', id)
    .single();
  if (p?.ingredient_id) {
    const { data: ing } = await supabase.from('ingredients').select('stock').eq('id', p.ingredient_id).single();
    if (ing) {
      await supabase
        .from('ingredients')
        .update({ stock: Number(ing.stock) - Number(p.qty_canon) })
        .eq('id', p.ingredient_id);
    }
  }
  await supabase.from('purchases').delete().eq('id', id);
  revalidatePath('/crm/inventario');
  revalidatePath('/crm');
  revalidatePath('/crm/reportes');
}

// ───────── Inventario: recetas (BOM) ─────────

export async function saveRecipeLine(formData: FormData) {
  const { supabase } = await requireUser();
  const productId = String(formData.get('product_id') || '');
  const ingredientId = String(formData.get('ingredient_id') || '');
  const qty = Number(formData.get('qty') || 0);
  if (!productId || !ingredientId || qty <= 0) return;
  // Upsert por (product_id, ingredient_id) — la tabla tiene unique.
  await supabase
    .from('recipes')
    .upsert({ product_id: productId, ingredient_id: ingredientId, qty }, { onConflict: 'product_id,ingredient_id' });
  revalidatePath('/crm/inventario');
}

export async function deleteRecipeLine(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from('recipes').delete().eq('id', String(formData.get('id')));
  revalidatePath('/crm/inventario');
}

// Descuenta del inventario los ingredientes consumidos por un pedido.
// Idempotente: usa orders.inventory_consumed para no descontar dos veces.
// Empareja el texto libre de items con los productos (mismo enfoque que Reportes).
async function consumeForOrder(
  supabase: Awaited<ReturnType<typeof requireUser>>['supabase'],
  orderId: string
) {
  const { data: ord } = await supabase
    .from('orders')
    .select('items, code, inventory_consumed')
    .eq('id', orderId)
    .single();
  if (!ord || ord.inventory_consumed) return;

  const text = String(ord.items || '').toLowerCase();
  const { data: products } = await supabase.from('products').select('id, name');
  const { data: recipes } = await supabase.from('recipes').select('product_id, ingredient_id, qty');

  const recByProd = new Map<string, { ingredient_id: string; qty: number }[]>();
  (recipes || []).forEach((r) => {
    const arr = recByProd.get(r.product_id) || [];
    arr.push({ ingredient_id: r.ingredient_id, qty: Number(r.qty) });
    recByProd.set(r.product_id, arr);
  });

  // Acumula consumo por ingrediente (cantidad de la receta × cantidad pedida).
  const consume = new Map<string, number>();
  for (const p of products || []) {
    const ln = String(p.name).toLowerCase();
    if (!ln || !text.includes(ln)) continue;
    const rec = recByProd.get(p.id);
    if (!rec || rec.length === 0) continue;
    const re = new RegExp('(\\d+)\\s*[x×]?\\s*' + ln.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const m = text.match(re);
    const qty = m ? parseInt(m[1], 10) : 1;
    for (const r of rec) consume.set(r.ingredient_id, (consume.get(r.ingredient_id) || 0) + r.qty * qty);
  }

  if (consume.size > 0) {
    const ids = [...consume.keys()];
    const { data: ings } = await supabase.from('ingredients').select('id, stock, avg_cost').in('id', ids);
    const movements = (ings || []).map((ing) => {
      const used = consume.get(ing.id) || 0;
      return {
        ingredient_id: ing.id,
        type: 'consumption' as const,
        qty: -used,
        cost: Math.round(used * Number(ing.avg_cost) * 100) / 100,
        ref: ord.code,
        newStock: Number(ing.stock) - used,
      };
    });
    for (const mv of movements) {
      await supabase.from('ingredients').update({ stock: mv.newStock }).eq('id', mv.ingredient_id);
    }
    await supabase.from('inventory_movements').insert(
      movements.map(({ newStock, ...mv }) => { void newStock; return mv; })
    );
  }

  await supabase.from('orders').update({ inventory_consumed: true }).eq('id', orderId);
  revalidatePath('/crm/inventario');
}

// ───────── Clientes ─────────

export async function saveCustomer(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id') || '');
  const payload = {
    name: String(formData.get('name') || ''),
    phone: String(formData.get('phone') || ''),
    zone: String(formData.get('zone') || ''),
  };
  if (id) {
    await supabase.from('customers').update(payload).eq('id', id);
  } else {
    await supabase.from('customers').insert(payload);
  }
  revalidatePath('/crm/clientes');
}

export async function deleteCustomer(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from('customers').delete().eq('id', String(formData.get('id')));
  revalidatePath('/crm/clientes');
}

// ───────── Pedidos ─────────

export async function advanceOrder(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id'));
  const current = String(formData.get('estado')) as OrderStatus;
  const next = nextStatus(current);
  if (next) {
    await supabase.from('orders').update({ estado: next }).eq('id', id);
    // Al pasar a "cocinando" se descuenta el inventario (consumo confirmado).
    if (next === 'cocinando') await consumeForOrder(supabase, id);
    revalidatePath('/crm/pedidos');
    revalidatePath('/crm');
  }
}

// Genera el siguiente código #NNNN a partir del máximo numérico existente.
async function nextOrderCode(
  supabase: Awaited<ReturnType<typeof requireUser>>['supabase']
): Promise<string> {
  const { data } = await supabase.from('orders').select('code');
  const max = (data || []).reduce((m: number, r: { code: string }) => {
    const n = parseInt(String(r.code).replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 1287);
  return `#${max + 1}`;
}

export async function createOrder(formData: FormData) {
  const { supabase } = await requireUser();
  const estado = String(formData.get('estado') || 'recibido') as OrderStatus;
  const code = await nextOrderCode(supabase);
  const finalEstado = ['recibido', 'cocinando', 'en_camino', 'entregado'].includes(estado) ? estado : 'recibido';
  const { data: created } = await supabase
    .from('orders')
    .insert({
      code,
      cliente: String(formData.get('cliente') || '').trim() || 'Cliente WhatsApp',
      items: String(formData.get('items') || '').trim(),
      total: Number(formData.get('total') || 0),
      estado: finalEstado,
    })
    .select('id')
    .single();
  // Si nace ya en "cocinando" (o más avanzado), descuenta inventario de una vez.
  if (created && finalEstado !== 'recibido') await consumeForOrder(supabase, created.id);
  revalidatePath('/crm/pedidos');
  revalidatePath('/crm');
}

export async function archiveOrder(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from('orders').update({ archived: true }).eq('id', String(formData.get('id')));
  revalidatePath('/crm/pedidos');
  revalidatePath('/crm');
}

export async function unarchiveOrder(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from('orders').update({ archived: false }).eq('id', String(formData.get('id')));
  revalidatePath('/crm/pedidos');
  revalidatePath('/crm');
}

// Archiva de golpe todos los entregados visibles → limpia el Kanban.
export async function archiveDelivered() {
  const { supabase } = await requireUser();
  await supabase.from('orders').update({ archived: true }).eq('estado', 'entregado').eq('archived', false);
  revalidatePath('/crm/pedidos');
  revalidatePath('/crm');
}
