'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/supabase/server';
import { nextStatus, type OrderStatus } from '@/lib/theme';
import { toCanonical, type CanonUnit } from '@/lib/units';
import { getActiveProducts, getActivePromotions } from '@/lib/crm-queries';
import { evalPromos, type CartLine } from '@/lib/promo-engine';

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

// ───────── Promociones ─────────

function numOrNull(fd: FormData, key: string): number | null {
  const raw = String(fd.get(key) ?? '').trim();
  if (raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
function strOrNull(fd: FormData, key: string): string | null {
  const raw = String(fd.get(key) ?? '').trim();
  return raw === '' ? null : raw;
}

export async function savePromotion(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id') || '');

  // Días: checkboxes name="days" con valores 0..6 (getDay). Sin marcar → null (todos).
  const days = formData.getAll('days').map((d) => Number(d)).filter((d) => d >= 0 && d <= 6);
  const daysMask = days.length ? days.reduce((m, d) => m | (1 << d), 0) : null;

  const type = String(formData.get('type') || 'free_item');
  const payload = {
    name: String(formData.get('name') || '').trim(),
    description: strOrNull(formData, 'description'),
    type,
    trigger_scope: String(formData.get('trigger_scope') || 'category'),
    trigger_ref: strOrNull(formData, 'trigger_ref'),
    trigger_qty: Math.max(1, numOrNull(formData, 'trigger_qty') ?? 1),
    // El producto regalo solo aplica a free_item.
    reward_product_id: type === 'free_item' ? strOrNull(formData, 'reward_product_id') : null,
    reward_qty: Math.max(1, numOrNull(formData, 'reward_qty') ?? 1),
    reward_value: numOrNull(formData, 'reward_value') ?? 0,
    reward_max_per_order: Math.max(1, numOrNull(formData, 'reward_max_per_order') ?? 1),
    min_order_total: numOrNull(formData, 'min_order_total'),
    starts_at: strOrNull(formData, 'starts_at'),
    ends_at: strOrNull(formData, 'ends_at'),
    days_mask: daysMask,
    time_from: strOrNull(formData, 'time_from'),
    time_to: strOrNull(formData, 'time_to'),
    max_redemptions: numOrNull(formData, 'max_redemptions'),
    stackable: formData.get('stackable') === 'on',
    active: formData.get('active') === 'on',
    show_on_landing: formData.get('show_on_landing') === 'on',
  };

  if (id) {
    await supabase.from('promotions').update(payload).eq('id', id);
  } else {
    await supabase.from('promotions').insert(payload);
  }
  revalidatePath('/crm/promociones');
  revalidatePath('/crm');
  revalidatePath('/'); // sección de promos del landing
}

export async function deletePromotion(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from('promotions').delete().eq('id', String(formData.get('id')));
  revalidatePath('/crm/promociones');
  revalidatePath('/');
}

export async function togglePromotion(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id'));
  const active = formData.get('active') === 'true';
  await supabase.from('promotions').update({ active: !active }).eq('id', id);
  revalidatePath('/crm/promociones');
  revalidatePath('/');
}

// Reinicia el contador de canjes (p. ej. para reabrir una promo agotada).
export async function resetPromotionRedemptions(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from('promotions').update({ redemptions: 0 }).eq('id', String(formData.get('id')));
  revalidatePath('/crm/promociones');
  revalidatePath('/');
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

// Re-evalúa las promos del lado servidor (FUENTE DE VERDAD) a partir del carrito
// estructurado que envía el cliente. Devuelve el texto de items final (con líneas
// regalo), el total ya descontado y las promos aplicadas (para contabilizar canjes).
// Nunca confía en el total calculado por el navegador.
async function buildOrderFromCart(
  cart: { id: string; qty: number }[]
): Promise<{ items: string; total: number; appliedPromoIds: string[] } | null> {
  if (!Array.isArray(cart) || cart.length === 0) return null;

  const [products, promos] = await Promise.all([getActiveProducts(), getActivePromotions()]);
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: CartLine[] = [];
  for (const c of cart) {
    const p = byId.get(c.id);
    const qty = Math.max(1, Math.floor(Number(c.qty) || 0));
    if (p) lines.push({ id: p.id, name: p.name, cat: p.cat, price: p.price, qty });
  }
  if (lines.length === 0) return null;

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const result = evalPromos(lines, promos);

  const baseText = lines.map((l) => `${l.qty}× ${l.name}`);
  const rewardText = result.rewardLines.map((r) => `${r.qty}× ${r.name} 🎁`);
  const items = [...baseText, ...rewardText].join(', ');
  const total = Math.round((subtotal - result.discount) * 100) / 100;

  return { items, total, appliedPromoIds: result.applied.map((a) => a.promo_id) };
}

// Suma 1 canje a cada promo aplicada (una vez por pedido). Read-modify-write:
// la baja concurrencia del obrador lo hace seguro sin transacción.
async function tallyRedemptions(
  supabase: Awaited<ReturnType<typeof requireUser>>['supabase'],
  promoIds: string[]
) {
  if (promoIds.length === 0) return;
  const { data } = await supabase.from('promotions').select('id, redemptions').in('id', promoIds);
  for (const p of data || []) {
    await supabase.from('promotions').update({ redemptions: Number(p.redemptions) + 1 }).eq('id', p.id);
  }
}

export async function createOrder(formData: FormData) {
  const { supabase } = await requireUser();
  const estado = String(formData.get('estado') || 'recibido') as OrderStatus;
  const code = await nextOrderCode(supabase);
  const finalEstado = ['recibido', 'cocinando', 'en_camino', 'entregado'].includes(estado) ? estado : 'recibido';
  const metodoPago = String(formData.get('metodo_pago') || 'efectivo') === 'transferencia' ? 'transferencia' : 'efectivo';

  // Si el cliente envía el carrito estructurado, el servidor recalcula items/total
  // aplicando promos (autoritativo). Si no, cae al texto/total legados.
  let cart: { id: string; qty: number }[] = [];
  try {
    cart = JSON.parse(String(formData.get('cart') || '[]'));
  } catch {
    cart = [];
  }
  const built = await buildOrderFromCart(cart);
  const items = built ? built.items : String(formData.get('items') || '').trim();
  const total = built ? built.total : Number(formData.get('total') || 0);

  const { data: created } = await supabase
    .from('orders')
    .insert({
      code,
      cliente: String(formData.get('cliente') || '').trim() || 'Cliente WhatsApp',
      items,
      total,
      estado: finalEstado,
      metodo_pago: metodoPago,
    })
    .select('id')
    .single();

  if (built) await tallyRedemptions(supabase, built.appliedPromoIds);
  // Si nace ya en "cocinando" (o más avanzado), descuenta inventario de una vez.
  if (created && finalEstado !== 'recibido') await consumeForOrder(supabase, created.id);
  revalidatePath('/crm/pedidos');
  revalidatePath('/crm');
  revalidatePath('/crm/promociones');
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
