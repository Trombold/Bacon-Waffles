// Conversión de unidades de compra a la unidad canónica del ingrediente.
// Cada ingrediente tiene una unidad canónica (g | ml | unidad); las compras se
// teclean en unidades cómodas (lb, kg, l, docena…) y se convierten a la canónica.

export type CanonUnit = 'g' | 'ml' | 'unidad';

type Conv = { canon: CanonUnit; factor: number; label: string };

// factor = cuántas unidades canónicas equivale 1 de la unidad de compra.
export const PURCHASE_UNITS: Record<string, Conv> = {
  g: { canon: 'g', factor: 1, label: 'gramos (g)' },
  kg: { canon: 'g', factor: 1000, label: 'kilos (kg)' },
  lb: { canon: 'g', factor: 453.592, label: 'libras (lb)' },
  oz: { canon: 'g', factor: 28.3495, label: 'onzas (oz)' },
  ml: { canon: 'ml', factor: 1, label: 'mililitros (ml)' },
  l: { canon: 'ml', factor: 1000, label: 'litros (l)' },
  unidad: { canon: 'unidad', factor: 1, label: 'unidades' },
  docena: { canon: 'unidad', factor: 12, label: 'docenas' },
};

export const CANON_LABEL: Record<CanonUnit, string> = {
  g: 'g',
  ml: 'ml',
  unidad: 'u',
};

// Unidades de compra válidas para una unidad canónica dada.
export function purchaseUnitsFor(canon: CanonUnit): string[] {
  return Object.entries(PURCHASE_UNITS)
    .filter(([, c]) => c.canon === canon)
    .map(([k]) => k);
}

// Convierte una cantidad en unidad de compra a la unidad canónica del ingrediente.
// Si la unidad de compra no corresponde a la canónica, devuelve la cantidad tal cual.
export function toCanonical(qty: number, purchaseUnit: string, canon: CanonUnit): number {
  const conv = PURCHASE_UNITS[purchaseUnit];
  if (!conv || conv.canon !== canon) return qty;
  return qty * conv.factor;
}

// Formatea una cantidad canónica para mostrar (g→kg, ml→l cuando es grande).
export function formatStock(qty: number, canon: CanonUnit): string {
  if (canon === 'unidad') return `${round(qty)} u`;
  if (canon === 'g') return qty >= 1000 ? `${round(qty / 1000)} kg` : `${round(qty)} g`;
  return qty >= 1000 ? `${round(qty / 1000)} l` : `${round(qty)} ml`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
