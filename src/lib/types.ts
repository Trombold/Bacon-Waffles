import type { OrderStatus } from './theme';

export type Product = {
  id: string;
  sku: string;
  name: string;
  cat: 'Dulces' | 'Salados' | 'Bebidas';
  price: number;
  stock: number;
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
