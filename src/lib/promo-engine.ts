// Motor de promociones — puro e isomórfico (corre igual en cliente y servidor).
// El cliente lo usa para PREVISUALIZAR el efecto al armar un pedido; el servidor
// lo re-ejecuta como FUENTE DE VERDAD en createOrder (nunca se confía el total
// calculado por el navegador). Sin imports de servidor: solo lógica de datos.

import type { Promotion } from './types';

// Línea del carrito tal como la arma el operador (producto + cantidad).
export type CartLine = { id: string; name: string; cat: string; price: number; qty: number };

// Línea de regalo resultante (precio 0). El `name` debe coincidir con el nombre
// del producto en catálogo para que el descuento de inventario (consumeForOrder)
// lo empareje por texto.
export type RewardLine = { name: string; qty: number };

export type AppliedPromo = {
  promo_id: string;
  name: string;
  rewardLines: RewardLine[];
  discount: number;
};

export type PromoResult = {
  applied: AppliedPromo[];
  rewardLines: RewardLine[]; // unión de todas las líneas regalo
  discount: number;          // descuento total en dinero ($)
};

const r2 = (n: number) => Math.round(n * 100) / 100;

// ¿La promo está vigente AHORA? Verifica todas las restricciones temporales y de
// presupuesto. No mira el carrito (eso lo hace el cálculo del gatillo).
export function isPromoLive(p: Promotion, now: Date = new Date()): boolean {
  if (!p.active) return false;
  if (p.starts_at && now < new Date(p.starts_at)) return false;
  if (p.ends_at && now > new Date(p.ends_at)) return false;
  if (p.max_redemptions != null && p.redemptions >= p.max_redemptions) return false;

  // Día de la semana (bitmask 1<<getDay(); Dom=0..Sáb=6). null/0 = todos los días.
  if (p.days_mask && p.days_mask > 0) {
    if ((p.days_mask & (1 << now.getDay())) === 0) return false;
  }

  // Franja horaria diaria recurrente (HH:MM[:SS]). Soporta franjas que cruzan
  // medianoche (time_from > time_to → válido si hora >= from O hora <= to).
  if (p.time_from || p.time_to) {
    const cur = now.getHours() * 60 + now.getMinutes();
    const toMin = (t: string | null, def: number) => {
      if (!t) return def;
      const [h, m] = t.split(':');
      return Number(h) * 60 + Number(m || 0);
    };
    const from = toMin(p.time_from, 0);
    const to = toMin(p.time_to, 24 * 60);
    const inWindow = from <= to ? cur >= from && cur <= to : cur >= from || cur <= to;
    if (!inWindow) return false;
  }

  return true;
}

// Cantidad de unidades del carrito que cuentan para el gatillo de la promo.
function triggerCount(p: Promotion, cart: CartLine[]): number {
  if (p.trigger_scope === 'order') return 1; // el pedido entero gatilla una vez
  return cart.reduce((sum, l) => {
    const match = p.trigger_scope === 'product' ? l.id === p.trigger_ref : l.cat === p.trigger_ref;
    return match ? sum + l.qty : sum;
  }, 0);
}

// Subtotal sobre el que se calcula un descuento porcentual/fijo según el scope.
function discountBase(p: Promotion, cart: CartLine[], subtotal: number): number {
  if (p.trigger_scope === 'category') {
    return cart.reduce((s, l) => (l.cat === p.trigger_ref ? s + l.price * l.qty : s), 0);
  }
  return subtotal; // 'order' y 'product' → sobre el total
}

// Evalúa UNA promo contra el carrito. Devuelve null si no aplica.
function evalOne(p: Promotion, cart: CartLine[], subtotal: number): AppliedPromo | null {
  if (p.min_order_total != null && subtotal < p.min_order_total) return null;

  const count = triggerCount(p, cart);
  const times = Math.floor(count / Math.max(1, p.trigger_qty));
  if (times < 1) return null;

  if (p.type === 'free_item') {
    if (!p.reward_name) return null;
    const qty = Math.min(times * p.reward_qty, p.reward_max_per_order);
    if (qty < 1) return null;
    return { promo_id: p.id, name: p.name, rewardLines: [{ name: p.reward_name, qty }], discount: 0 };
  }

  if (p.type === 'percent') {
    const discount = r2(discountBase(p, cart, subtotal) * (p.reward_value / 100));
    if (discount <= 0) return null;
    return { promo_id: p.id, name: p.name, rewardLines: [], discount: Math.min(discount, subtotal) };
  }

  // fixed
  const discount = Math.min(p.reward_value, subtotal);
  if (discount <= 0) return null;
  return { promo_id: p.id, name: p.name, rewardLines: [], discount: r2(discount) };
}

// Valor retail aproximado de una promo aplicada (para rankear cuando no son
// apilables y hay que elegir la mejor para el cliente).
function promoValue(a: AppliedPromo, p: Promotion): number {
  return a.discount + a.rewardLines.reduce((s, rl) => s + rl.qty * p.reward_price, 0);
}

// Evalúa TODAS las promos vigentes contra el carrito y combina el resultado.
// Reglas de apilado: si todas las aplicables son `stackable`, se aplican todas;
// si alguna NO es apilable, se aplica una sola (la de mayor valor para el cliente).
export function evalPromos(
  cart: CartLine[],
  promos: Promotion[],
  now: Date = new Date()
): PromoResult {
  const subtotal = r2(cart.reduce((s, l) => s + l.price * l.qty, 0));
  const empty: PromoResult = { applied: [], rewardLines: [], discount: 0 };
  if (cart.length === 0) return empty;

  const candidates: { applied: AppliedPromo; promo: Promotion }[] = [];
  for (const p of promos) {
    if (!isPromoLive(p, now)) continue;
    const a = evalOne(p, cart, subtotal);
    if (a) candidates.push({ applied: a, promo: p });
  }
  if (candidates.length === 0) return empty;

  const allStackable = candidates.every((c) => c.promo.stackable);
  const chosen = allStackable
    ? candidates
    : [candidates.reduce((best, c) =>
        promoValue(c.applied, c.promo) > promoValue(best.applied, best.promo) ? c : best
      )];

  const applied = chosen.map((c) => c.applied);
  const rewardLines = applied.flatMap((a) => a.rewardLines);
  const discount = r2(Math.min(applied.reduce((s, a) => s + a.discount, 0), subtotal));
  return { applied, rewardLines, discount };
}
