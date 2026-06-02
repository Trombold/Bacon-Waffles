import type { OrderStatus, PaymentMethod } from './theme';

export type Product = {
  id: string;
  sku: string;
  name: string;
  cat: 'Dulces' | 'Salados' | 'Combos' | 'Bebidas';
  price: number;
  active: boolean;
  description: string | null;
  sweet: number | null;
  tag: string | null;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  zone: string;
  orders: number;
  total: number;
  last: string | null;
};

export type Review = {
  id: string;
  name: string;
  text: string;
  stars: number;
  active: boolean;
  sort: number;
  created_at: string;
};

export type Ingredient = {
  id: string;
  name: string;
  unit: 'g' | 'ml' | 'unidad';
  stock: number;
  threshold: number;
  avg_cost: number;
  active: boolean;
};

export type Purchase = {
  id: string;
  ingredient_id: string | null;
  ingredient_name: string;
  qty_display: number;
  unit: string;
  qty_canon: number;
  total_cost: number;
  created_at: string;
};

// Línea de receta con datos del ingrediente para mostrar.
export type RecipeLine = {
  id: string;
  product_id: string;
  ingredient_id: string;
  ingredient_name: string;
  unit: 'g' | 'ml' | 'unidad';
  qty: number;
};

// Modificadores de una línea de pedido. `exclude` quita ingredientes de la receta
// (sin cambio de precio); `addons` agrega extras pagos (suma precio + inventario).
export type LineModifiers = {
  exclude: string[];                       // ingredient_ids quitados de la receta
  addons: { id: string; qty: number }[];   // addon_id + cantidad (absoluta por línea)
};

// Add-on (extra pago) reutilizable. `scope` limita a qué categoría aplica
// ('all' = cualquier producto). `recipe` es su mini-BOM (qué ingredientes consume).
export type Addon = {
  id: string;
  name: string;
  price_delta: number;
  scope: 'Dulces' | 'Salados' | 'Bebidas' | 'all';
  active: boolean;
  recipe: { ingredient_id: string; qty: number }[];
};

export type PromoType = 'free_item' | 'percent' | 'fixed';
export type PromoScope = 'product' | 'category' | 'order';

// Fila completa de la tabla promotions, enriquecida con datos del producto
// recompensa (nombre + precio) para que el motor pueda mostrar la línea regalo
// sin un join adicional en tiempo de evaluación.
export type Promotion = {
  id: string;
  name: string;
  description: string | null;
  type: PromoType;
  trigger_scope: PromoScope;
  trigger_ref: string | null;
  trigger_qty: number;
  reward_product_id: string | null;
  reward_name: string | null;   // join products.name (denormalizado en query)
  reward_price: number;         // join products.price (valor retail del regalo)
  reward_qty: number;
  reward_value: number;
  reward_max_per_order: number;
  min_order_total: number | null;
  starts_at: string | null;
  ends_at: string | null;
  days_mask: number | null;
  time_from: string | null;
  time_to: string | null;
  max_redemptions: number | null;
  redemptions: number;
  stackable: boolean;
  active: boolean;
  show_on_landing: boolean;
  created_at: string;
  // Calculado (solo en getPromotions del CRM): costo de receta del regalo.
  reward_cost?: number;
};

export type Order = {
  id: string;
  code: string;
  cliente: string;
  items: string;
  total: number;
  hora: string;
  estado: OrderStatus;
  metodo_pago: PaymentMethod;
  archived: boolean;
  created_at: string;
};
