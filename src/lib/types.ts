import type { OrderStatus } from './theme';

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

export type Order = {
  id: string;
  code: string;
  cliente: string;
  items: string;
  total: number;
  hora: string;
  estado: OrderStatus;
  archived: boolean;
  created_at: string;
};
