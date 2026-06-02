-- Bacon Waffles — modificadores de línea en pedidos: exclusiones de ingrediente
-- ("Frutella sin fresas") y add-ons pagos ("+ Bola de helado $1").
-- Reactiva order_items (existe desde 0001 pero estaba sin uso) y le añade
-- modifiers (JSONB) + line_total. Crea catálogo de add-ons. Idempotente.

-- ── 1. order_items: modificadores por línea + total snapshot ──
-- modifiers shape: { "exclude": [ingredient_id...], "addons": [{ "id": addon_id, "qty": n }] }
alter table public.order_items add column if not exists modifiers  jsonb         not null default '{}'::jsonb;
alter table public.order_items add column if not exists line_total numeric(10,2) not null default 0;

-- ── 2. Catálogo de add-ons (extras pagos reutilizables) ──
create table if not exists public.addons (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  price_delta numeric(10,2) not null default 0,
  scope       text not null default 'Dulces' check (scope in ('Dulces','Salados','Bebidas','all')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── 3. Mini-BOM del add-on: qué ingredientes consume por unidad ──
create table if not exists public.addon_recipes (
  id            uuid primary key default gen_random_uuid(),
  addon_id      uuid not null references public.addons(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  qty           numeric(12,3) not null default 0,
  unique (addon_id, ingredient_id)
);
create index if not exists idx_addon_recipes_addon on public.addon_recipes(addon_id);

-- ── 4. RLS — solo staff autenticado (patrón del repo) ──
alter table public.addons        enable row level security;
alter table public.addon_recipes enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename='addons' and policyname='auth_all_addons') then
    create policy auth_all_addons on public.addons
      for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='addon_recipes' and policyname='auth_all_addon_recipes') then
    create policy auth_all_addon_recipes on public.addon_recipes
      for all to authenticated using (true) with check (true);
  end if;
end $$;

-- ── 5. Seed: ingrediente Helado + add-on Bola de helado (Dulces, $1, 1 unidad) ──
-- avg_cost queda 0 hasta la primera compra registrada en Inventario.
insert into public.ingredients (name, unit, stock, threshold, avg_cost, active)
  values ('Helado', 'unidad', 0, 0, 0, true)
  on conflict (name) do nothing;

do $$
declare v_addon uuid; v_ing uuid;
begin
  select id into v_ing   from public.ingredients where name = 'Helado';
  select id into v_addon from public.addons      where name = 'Bola de helado';
  if v_addon is null then
    insert into public.addons (name, price_delta, scope, active)
      values ('Bola de helado', 1.00, 'Dulces', true)
      returning id into v_addon;
  end if;
  if v_addon is not null and v_ing is not null then
    insert into public.addon_recipes (addon_id, ingredient_id, qty)
      values (v_addon, v_ing, 1)
      on conflict (addon_id, ingredient_id) do nothing;
  end if;
end $$;
