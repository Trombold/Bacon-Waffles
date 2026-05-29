-- Bacon Waffles CRM — esquema inicial.
-- Ejecutar en Supabase: SQL Editor → pegar y Run, o `supabase db push`.

-- ───────────────────────── Tablas ─────────────────────────

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  sku         text unique not null,
  name        text not null,
  cat         text not null check (cat in ('Dulces', 'Salados', 'Bebidas')),
  price       numeric(10,2) not null default 0,
  stock       integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null,
  zone        text,
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  customer_id uuid references public.customers(id) on delete set null,
  cliente     text not null,             -- nombre denormalizado para listados rápidos
  items       text not null default '',  -- resumen legible de items
  total       numeric(10,2) not null default 0,
  estado      text not null default 'recibido'
              check (estado in ('recibido', 'cocinando', 'en_camino', 'entregado')),
  created_at  timestamptz not null default now()
);

create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  name        text not null,
  qty         integer not null default 1,
  price       numeric(10,2) not null default 0
);

create index if not exists idx_orders_estado on public.orders(estado);
create index if not exists idx_orders_created on public.orders(created_at);
create index if not exists idx_order_items_order on public.order_items(order_id);

-- ───────────────────────── RLS ─────────────────────────
-- Solo usuarios autenticados (staff del obrador) acceden al CRM.

alter table public.products    enable row level security;
alter table public.customers   enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

do $$
begin
  -- products
  if not exists (select 1 from pg_policies where tablename = 'products' and policyname = 'auth_all_products') then
    create policy auth_all_products on public.products
      for all to authenticated using (true) with check (true);
  end if;
  -- customers
  if not exists (select 1 from pg_policies where tablename = 'customers' and policyname = 'auth_all_customers') then
    create policy auth_all_customers on public.customers
      for all to authenticated using (true) with check (true);
  end if;
  -- orders
  if not exists (select 1 from pg_policies where tablename = 'orders' and policyname = 'auth_all_orders') then
    create policy auth_all_orders on public.orders
      for all to authenticated using (true) with check (true);
  end if;
  -- order_items
  if not exists (select 1 from pg_policies where tablename = 'order_items' and policyname = 'auth_all_order_items') then
    create policy auth_all_order_items on public.order_items
      for all to authenticated using (true) with check (true);
  end if;
end $$;

-- ───────────────────────── Seed ─────────────────────────
-- Datos de ejemplo (los mismos del prototipo) para que el CRM no salga vacío.

insert into public.products (sku, name, cat, price, stock, active) values
  ('DLC-001', 'King Kong',        'Dulces',  4.75, 24, true),
  ('DLC-002', 'S.Berry Fields',   'Dulces',  5.00, 18, true),
  ('DLC-003', 'Tiramisu',         'Dulces',  5.25, 12, true),
  ('DLC-004', 'Frutella',         'Dulces',  4.75, 20, true),
  ('DLC-005', 'Maracuyá Passion', 'Dulces',  5.00,  8, true),
  ('SLD-001', 'Chicken Cream',    'Salados', 6.00, 10, true),
  ('SLD-002', 'Cheddar Bacon',    'Salados', 5.50, 14, true),
  ('BBD-001', 'Mocca',            'Bebidas', 3.75, 30, true),
  ('BBD-002', 'Pink Coconut',     'Bebidas', 3.50, 22, false)
on conflict (sku) do nothing;

insert into public.customers (name, phone, zone) values
  ('Camila Reyes',         '+593 99 482 1130', 'San Sebastián'),
  ('Andrés Valdivieso',    '+593 98 273 9921', 'Centro'),
  ('Doménica Pinos',       '+593 96 412 5589', 'La Pradera'),
  ('Mateo Cueva',          '+593 97 552 1187', 'Yaguarcuna'),
  ('Valentina Jiménez',    '+593 99 110 3478', 'Capulí'),
  ('Sebastián Maldonado',  '+593 98 996 2104', 'San Sebastián')
on conflict do nothing;

insert into public.orders (code, cliente, items, total, estado, created_at) values
  ('#1287', 'Camila Reyes',        '2× King Kong, 1× Mocca',          13.25, 'recibido',  now() - interval '5 minutes'),
  ('#1286', 'Andrés Valdivieso',   '1× Carbonatta, 1× Pink Coconut',   9.00, 'recibido',  now() - interval '12 minutes'),
  ('#1285', 'Doménica Pinos',      '1× S.Berry Fields + helado',       6.00, 'cocinando', now() - interval '26 minutes'),
  ('#1284', 'Mateo Cueva',         '1× Cheddar Bacon, 1× Smoothie',    8.50, 'cocinando', now() - interval '39 minutes'),
  ('#1283', 'Valentina Jiménez',   '2× Tiramisu',                     10.50, 'en_camino', now() - interval '53 minutes'),
  ('#1282', 'Sebastián Maldonado', '1× Tutti Frutti',                  4.75, 'en_camino', now() - interval '67 minutes'),
  ('#1281', 'Camila Reyes',        '1× Chicken Cream',                 6.00, 'entregado', now() - interval '95 minutes'),
  ('#1280', 'Andrés Valdivieso',   '1× King Kong, 1× Mocca',           8.50, 'entregado', now() - interval '112 minutes')
on conflict (code) do nothing;
