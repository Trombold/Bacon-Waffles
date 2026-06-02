import { createClient } from '@/lib/supabase/server';
import type { Product, Customer, Order, Review, Ingredient, Purchase, RecipeLine, Promotion } from '@/lib/types';
import type { OrderStatus, PaymentMethod } from '@/lib/theme';

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('products').select('*').order('sku');
  return (data || []) as Product[];
}

export async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  const { data: orders } = await supabase.from('orders').select('cliente, total, created_at');

  const agg = new Map<string, { orders: number; total: number; last: string | null }>();
  (orders || []).forEach((o) => {
    const cur = agg.get(o.cliente) || { orders: 0, total: 0, last: null };
    cur.orders += 1;
    cur.total += Number(o.total);
    if (!cur.last || o.created_at > cur.last) cur.last = o.created_at;
    agg.set(o.cliente, cur);
  });

  return (customers || []).map((c) => {
    const a = agg.get(c.name) || { orders: 0, total: 0, last: null };
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      zone: c.zone || '—',
      orders: a.orders,
      total: a.total,
      last: a.last ? new Date(a.last).toLocaleDateString('es-EC') : '—',
    } as Customer;
  });
}

// Todas las reseñas (activas e inactivas) para el panel del CRM.
export async function getReviews(): Promise<Review[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .order('sort')
    .order('created_at');
  return (data || []) as Review[];
}

export async function getOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  return (data || []).map((o) => ({
    id: o.id,
    code: o.code,
    cliente: o.cliente,
    items: o.items,
    total: Number(o.total),
    estado: o.estado as OrderStatus,
    metodo_pago: (o.metodo_pago === 'transferencia' ? 'transferencia' : 'efectivo') as PaymentMethod,
    archived: Boolean(o.archived),
    hora: hora(o.created_at),
    created_at: o.created_at,
  }));
}

// Nombres de clientes para autocompletar al crear un pedido manual.
export async function getCustomerNames(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('customers').select('name').order('name');
  return (data || []).map((c) => c.name);
}

// Productos activos (id, nombre, precio, categoría) para construir un pedido con
// total automático. La categoría la consume el motor de promos (gatillo por cat).
export async function getActiveProducts(): Promise<{ id: string; name: string; price: number; cat: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select('id, name, price, cat')
    .eq('active', true)
    .order('cat')
    .order('name');
  return (data || []).map((p) => ({ id: p.id as string, name: p.name, price: Number(p.price), cat: String(p.cat) }));
}

// ───────── Promociones ─────────

// Mapea una fila cruda de promotions a Promotion, enriqueciendo con el nombre y
// precio del producto recompensa (productMap) y, opcionalmente, su costo de receta.
type RawPromo = Record<string, unknown>;
function mapPromo(
  p: RawPromo,
  productMap: Map<string, { name: string; price: number }>,
  rewardCost?: Map<string, number>
): Promotion {
  const rid = (p.reward_product_id as string) || null;
  const prod = rid ? productMap.get(rid) : undefined;
  return {
    id: p.id as string,
    name: p.name as string,
    description: (p.description as string) ?? null,
    type: p.type as Promotion['type'],
    trigger_scope: p.trigger_scope as Promotion['trigger_scope'],
    trigger_ref: (p.trigger_ref as string) ?? null,
    trigger_qty: Number(p.trigger_qty),
    reward_product_id: rid,
    reward_name: prod?.name ?? null,
    reward_price: prod?.price ?? 0,
    reward_qty: Number(p.reward_qty),
    reward_value: Number(p.reward_value),
    reward_max_per_order: Number(p.reward_max_per_order),
    min_order_total: p.min_order_total != null ? Number(p.min_order_total) : null,
    starts_at: (p.starts_at as string) ?? null,
    ends_at: (p.ends_at as string) ?? null,
    days_mask: p.days_mask != null ? Number(p.days_mask) : null,
    time_from: (p.time_from as string) ?? null,
    time_to: (p.time_to as string) ?? null,
    max_redemptions: p.max_redemptions != null ? Number(p.max_redemptions) : null,
    redemptions: Number(p.redemptions),
    stackable: Boolean(p.stackable),
    active: Boolean(p.active),
    show_on_landing: Boolean(p.show_on_landing),
    created_at: p.created_at as string,
    reward_cost: rewardCost && rid ? rewardCost.get(rid) ?? 0 : undefined,
  };
}

// Mapa id→{name,price} de TODOS los productos (incluye inactivos: un regalo puede
// no estar en carta pero seguir teniendo nombre/precio para mostrar y consumir).
async function productMap(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Map<string, { name: string; price: number }>> {
  const { data } = await supabase.from('products').select('id, name, price');
  return new Map((data || []).map((p) => [p.id as string, { name: p.name as string, price: Number(p.price) }]));
}

// Todas las promos (activas e inactivas) para el panel del CRM, con el costo de
// receta del regalo (presupuesto): reward_cost = Σ receta.qty × ingrediente.avg_cost.
export async function getPromotions(): Promise<Promotion[]> {
  const supabase = await createClient();
  const [{ data: promos }, pmap, { data: recipes }, { data: ings }] = await Promise.all([
    supabase.from('promotions').select('*').order('created_at', { ascending: false }),
    productMap(supabase),
    supabase.from('recipes').select('product_id, ingredient_id, qty'),
    supabase.from('ingredients').select('id, avg_cost'),
  ]);

  const avg = new Map((ings || []).map((i) => [i.id as string, Number(i.avg_cost)]));
  const rewardCost = new Map<string, number>();
  (recipes || []).forEach((r) => {
    const c = (rewardCost.get(r.product_id) || 0) + Number(r.qty) * (avg.get(r.ingredient_id) || 0);
    rewardCost.set(r.product_id, Math.round(c * 100) / 100);
  });

  return (promos || []).map((p) => mapPromo(p as RawPromo, pmap, rewardCost));
}

// Promos activas (para el motor: preview en pedidos y re-evaluación server-side).
export async function getActivePromotions(): Promise<Promotion[]> {
  const supabase = await createClient();
  const [{ data: promos }, pmap] = await Promise.all([
    supabase.from('promotions').select('*').eq('active', true),
    productMap(supabase),
  ]);
  return (promos || []).map((p) => mapPromo(p as RawPromo, pmap));
}

// ───────── Inventario ─────────

export async function getIngredients(): Promise<Ingredient[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('ingredients').select('*').order('name');
  return (data || []).map((i) => ({
    id: i.id,
    name: i.name,
    unit: i.unit,
    stock: Number(i.stock),
    threshold: Number(i.threshold),
    avg_cost: Number(i.avg_cost),
    active: Boolean(i.active),
  })) as Ingredient[];
}

// Ingredientes activos cuyo stock cayó al umbral o por debajo (umbral > 0).
export async function getLowStock(): Promise<Ingredient[]> {
  const all = await getIngredients();
  return all.filter((i) => i.active && i.threshold > 0 && i.stock <= i.threshold);
}

export async function getPurchases(limit = 100): Promise<Purchase[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('purchases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data || []).map((p) => ({
    id: p.id,
    ingredient_id: p.ingredient_id,
    ingredient_name: p.ingredient_name,
    qty_display: Number(p.qty_display),
    unit: p.unit,
    qty_canon: Number(p.qty_canon),
    total_cost: Number(p.total_cost),
    created_at: p.created_at,
  })) as Purchase[];
}

// Todas las líneas de receta (join con ingredientes) para el editor de recetas.
export async function getRecipeLines(): Promise<RecipeLine[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('recipes')
    .select('id, product_id, ingredient_id, qty, ingredients(name, unit)');
  return (data || []).map((r) => {
    const ing = r.ingredients as unknown as { name: string; unit: 'g' | 'ml' | 'unidad' } | null;
    return {
      id: r.id,
      product_id: r.product_id,
      ingredient_id: r.ingredient_id,
      ingredient_name: ing?.name || '—',
      unit: ing?.unit || 'g',
      qty: Number(r.qty),
    };
  }) as RecipeLine[];
}

// Gasto en compras del mes en curso (para Reportes / margen).
export async function getMonthlyExpense(): Promise<number> {
  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { data } = await supabase
    .from('purchases')
    .select('total_cost')
    .gte('created_at', monthStart.toISOString());
  return (data || []).reduce((s, p) => s + Number(p.total_cost), 0);
}

export type DashboardStats = {
  pedidosHoy: number;
  ventasHoy: number;
  ventasHoyEfectivo: number;
  ventasHoyTransferencia: number;
  pedidosSemana: number;
  ventasSemana: number;
  ticketPromedio: number;
  topProducts: { n: string; q: number; p: number }[];
  salesByDay: { label: string; value: number }[];
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: orders } = await supabase
    .from('orders')
    .select('items, total, created_at, metodo_pago')
    .gte('created_at', weekAgo);

  const today = startOfToday().getTime();
  let pedidosHoy = 0,
    ventasHoy = 0,
    ventasHoyEfectivo = 0,
    ventasHoyTransferencia = 0,
    pedidosSemana = 0,
    ventasSemana = 0;

  const byDay = new Map<string, number>();
  (orders || []).forEach((o) => {
    const t = new Date(o.created_at).getTime();
    const tot = Number(o.total);
    const esTransf = o.metodo_pago === 'transferencia';
    pedidosSemana += 1;
    ventasSemana += tot;
    if (t >= today) {
      pedidosHoy += 1;
      ventasHoy += tot;
      if (esTransf) ventasHoyTransferencia += tot;
      else ventasHoyEfectivo += tot;
    }
    const key = new Date(o.created_at).toLocaleDateString('es-EC', { weekday: 'short' });
    byDay.set(key, (byDay.get(key) || 0) + tot);
  });

  // Top productos: parsea el texto de items de los pedidos de la semana
  // (formato "2× King Kong, 1× Mocca") y suma cantidades por producto del catálogo.
  const { data: products } = await supabase.from('products').select('name');
  const names = (products || []).map((p) => String(p.name));
  const prodAgg = new Map<string, number>();
  (orders || []).forEach((o) => {
    const text = String(o.items || '').toLowerCase();
    for (const name of names) {
      const ln = name.toLowerCase();
      if (!ln || !text.includes(ln)) continue;
      // cantidad: número que precede al nombre (ej. "2× king kong"), por defecto 1
      const re = new RegExp('(\\d+)\\s*[x×]?\\s*' + ln.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const m = text.match(re);
      const qty = m ? parseInt(m[1], 10) : 1;
      prodAgg.set(name, (prodAgg.get(name) || 0) + qty);
    }
  });
  const sorted = [...prodAgg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxQ = sorted[0]?.[1] || 1;
  const topProducts = sorted.map(([n, q]) => ({ n, q, p: Math.round((q / maxQ) * 100) }));

  const salesByDay = [...byDay.entries()].map(([label, value]) => ({ label, value }));

  return {
    pedidosHoy,
    ventasHoy,
    ventasHoyEfectivo,
    ventasHoyTransferencia,
    pedidosSemana,
    ventasSemana,
    ticketPromedio: pedidosSemana ? ventasSemana / pedidosSemana : 0,
    topProducts,
    salesByDay,
  };
}

export type ReportStats = {
  ventasMes: number;
  ventasMesEfectivo: number;
  ventasMesTransferencia: number;
  pedidosMes: number;
  ticketMes: number;
  gastoMes: number;
  margenMes: number;
  mejorDia: string;
  horaPico: string;
  weekday: { d: string; v: number }[];
  categoryMix: { n: string; v: number; p: number }[];
};

export async function getReports(): Promise<ReportStats> {
  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: orders } = await supabase
    .from('orders')
    .select('items, total, created_at, metodo_pago')
    .gte('created_at', monthStart.toISOString());

  // Gasto del mes = compras de inventario registradas este mes.
  const { data: monthPurchases } = await supabase
    .from('purchases')
    .select('total_cost')
    .gte('created_at', monthStart.toISOString());
  const gastoMes = (monthPurchases || []).reduce((s, p) => s + Number(p.total_cost), 0);

  let ventasMes = 0;
  let ventasMesEfectivo = 0;
  let ventasMesTransferencia = 0;
  const pedidosMes = (orders || []).length;
  const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const wd = new Map<string, number>();
  const hourCount = new Map<number, number>();

  (orders || []).forEach((o) => {
    const tot = Number(o.total);
    ventasMes += tot;
    if (o.metodo_pago === 'transferencia') ventasMesTransferencia += tot;
    else ventasMesEfectivo += tot;
    const dt = new Date(o.created_at);
    const dname = DIAS[dt.getDay()];
    wd.set(dname, (wd.get(dname) || 0) + tot);
    const h = dt.getHours();
    hourCount.set(h, (hourCount.get(h) || 0) + 1);
  });

  const weekdayOrder = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
  const weekday = weekdayOrder.map((d) => ({ d, v: Math.round(wd.get(d) || 0) }));
  const mejorDia = weekday.length
    ? weekday.reduce((a, b) => (b.v > a.v ? b : a), weekday[0]).d
    : 'Viernes';
  const horaPico = hourCount.size
    ? `${[...hourCount.entries()].sort((a, b) => b[1] - a[1])[0][0]}:00`
    : '20:00';

  // Mix de categorías REAL: atribuye el total de cada pedido a la(s) categoría(s)
  // de los productos detectados en su texto de items (los pedidos manuales no
  // tienen order_items estructurados). Si un pedido toca varias categorías, el
  // total se reparte equitativamente entre ellas.
  const { data: products } = await supabase.from('products').select('name, cat');
  const nameCat: { name: string; cat: string }[] = (products || []).map((p) => ({
    name: String(p.name).toLowerCase(),
    cat: p.cat,
  }));

  const cats = ['Dulces', 'Salados', 'Bebidas'] as const;
  const catAgg = new Map<string, number>(cats.map((c) => [c, 0]));
  (orders || []).forEach((o) => {
    const text = String(o.items || '').toLowerCase();
    const matched = new Set<string>();
    for (const { name, cat } of nameCat) {
      if (name && text.includes(name)) matched.add(cat);
    }
    if (matched.size === 0) return; // sin coincidencia → no se atribuye
    const share = Number(o.total) / matched.size;
    matched.forEach((cat) => catAgg.set(cat, (catAgg.get(cat) || 0) + share));
  });

  const totalMix = [...catAgg.values()].reduce((a, b) => a + b, 0);
  const categoryMix: ReportStats['categoryMix'] = cats.map((n) => {
    const v = Math.round((catAgg.get(n) || 0) * 100) / 100;
    return { n, v, p: totalMix > 0 ? Math.round((v / totalMix) * 100) : 0 };
  });
  // Normaliza el redondeo para que los porcentajes sumen exactamente 100.
  if (totalMix > 0) {
    const sumP = categoryMix.reduce((s, m) => s + m.p, 0);
    const top = categoryMix.reduce((a, b) => (b.v > a.v ? b : a), categoryMix[0]);
    top.p += 100 - sumP;
  }

  return {
    ventasMes,
    ventasMesEfectivo,
    ventasMesTransferencia,
    pedidosMes,
    ticketMes: pedidosMes ? ventasMes / pedidosMes : 0,
    gastoMes,
    margenMes: ventasMes - gastoMes,
    mejorDia,
    horaPico,
    weekday,
    categoryMix,
  };
}
