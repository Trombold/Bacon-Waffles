-- Bacon Waffles — inventario por ingredientes, compras (gasto mensual) y recetas (BOM).
-- Solo CRM (authenticated). El landing no lee estas tablas.
-- Idempotente: seguro re-ejecutar.

-- ── 1. Ingredientes ──
-- stock y umbral en la UNIDAD CANÓNICA del ingrediente (g | ml | unidad).
create table if not exists public.ingredients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  unit        text not null default 'g' check (unit in ('g', 'ml', 'unidad')),
  stock       numeric(12,3) not null default 0,   -- existencia actual (canónica)
  threshold   numeric(12,3) not null default 0,   -- umbral para "renovar"
  avg_cost    numeric(12,4) not null default 0,   -- costo promedio ponderado por unidad canónica
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── 2. Compras (gasto + entrada de inventario) ──
-- qty_canon = cantidad ya convertida a la unidad canónica del ingrediente.
-- qty_display + unit guardan lo que el usuario tecleó (p. ej. 1 lb).
create table if not exists public.purchases (
  id              uuid primary key default gen_random_uuid(),
  ingredient_id   uuid references public.ingredients(id) on delete set null,
  ingredient_name text not null,                  -- denormalizado (sobrevive borrados)
  qty_display     numeric(12,3) not null default 0,
  unit            text not null default 'g',      -- unidad de compra original (display)
  qty_canon       numeric(12,3) not null default 0,
  total_cost      numeric(12,2) not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists idx_purchases_created on public.purchases(created_at);

-- ── 3. Recetas (BOM): producto → ingrediente + consumo por preparación ──
-- qty en la unidad canónica del ingrediente.
create table if not exists public.recipes (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  qty           numeric(12,3) not null default 0,
  unique (product_id, ingredient_id)
);
create index if not exists idx_recipes_product on public.recipes(product_id);

-- ── 4. Movimientos (libro mayor del stock) ──
-- qty: positivo = entrada, negativo = salida (siempre en unidad canónica).
create table if not exists public.inventory_movements (
  id            uuid primary key default gen_random_uuid(),
  ingredient_id uuid references public.ingredients(id) on delete cascade,
  type          text not null check (type in ('purchase', 'consumption', 'adjustment')),
  qty           numeric(12,3) not null,
  cost          numeric(12,2),            -- costo asociado (compras) o valoración del consumo
  ref           text,                     -- código de pedido / nota
  created_at    timestamptz not null default now()
);
create index if not exists idx_movements_ingredient on public.inventory_movements(ingredient_id);
create index if not exists idx_movements_created on public.inventory_movements(created_at);

-- ── 5. Bandera de consumo en pedidos (idempotencia del descuento) ──
alter table public.orders add column if not exists inventory_consumed boolean not null default false;

-- ── 6. RLS — todo solo para staff autenticado ──
alter table public.ingredients         enable row level security;
alter table public.purchases           enable row level security;
alter table public.recipes             enable row level security;
alter table public.inventory_movements enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'ingredients' and policyname = 'auth_all_ingredients') then
    create policy auth_all_ingredients on public.ingredients
      for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'purchases' and policyname = 'auth_all_purchases') then
    create policy auth_all_purchases on public.purchases
      for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'recipes' and policyname = 'auth_all_recipes') then
    create policy auth_all_recipes on public.recipes
      for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'inventory_movements' and policyname = 'auth_all_inventory_movements') then
    create policy auth_all_inventory_movements on public.inventory_movements
      for all to authenticated using (true) with check (true);
  end if;
end $$;
