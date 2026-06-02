-- Bacon Waffles — promociones configurables (item gratis / % / $ fijo) con
-- restricciones anti-abuso (ventana, días, horario, mínimo de compra, topes,
-- presupuesto por canjes). Editables desde el CRM y anunciables en el landing.
-- Mismo patrón que reviews: escritura solo authenticated, lectura pública de las
-- promos activas marcadas para el landing. Idempotente: seguro re-ejecutar.

-- ── 1. Tabla ──
create table if not exists public.promotions (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  description          text,                              -- copy mostrado en el landing
  type                 text not null default 'free_item'
                         check (type in ('free_item', 'percent', 'fixed')),

  -- Condición disparadora.
  trigger_scope        text not null default 'category'
                         check (trigger_scope in ('product', 'category', 'order')),
  trigger_ref          text,                              -- product_id (uuid) o categoría ('Salados')
  trigger_qty          integer not null default 1,        -- N requeridos para gatillar

  -- Recompensa.
  reward_product_id    uuid references public.products(id) on delete set null, -- item regalado (free_item)
  reward_qty           integer not null default 1,        -- cuántos se regalan por gatillo
  reward_value         numeric(12,2) not null default 0,  -- % (percent) o $ (fixed)
  reward_max_per_order integer not null default 1,        -- tope de regalos por pedido

  -- Restricciones anti-abuso.
  min_order_total      numeric(12,2),                     -- pedido mínimo para aplicar (null = sin mínimo)
  starts_at            timestamptz,                       -- ventana absoluta: inicio
  ends_at              timestamptz,                       -- ventana absoluta: fin
  days_mask            integer,                           -- bitmask días (1<<getDay(), Dom=0..Sáb=6); null/0 = todos
  time_from            time,                              -- franja diaria recurrente: desde
  time_to              time,                              -- franja diaria recurrente: hasta
  max_redemptions      integer,                           -- tope total de canjes (null = ilimitado)
  redemptions          integer not null default 0,        -- canjes consumidos (contador)
  stackable            boolean not null default false,    -- combina con otras promos en el mismo pedido

  -- Visibilidad.
  active               boolean not null default true,     -- aplica en pedidos / on-off maestro
  show_on_landing      boolean not null default false,    -- se anuncia públicamente en el landing

  created_at           timestamptz not null default now()
);

create index if not exists idx_promotions_active on public.promotions(active);
create index if not exists idx_promotions_landing on public.promotions(show_on_landing);

-- ── 2. RLS ──
alter table public.promotions enable row level security;

do $$
begin
  -- Staff del obrador: CRUD completo.
  if not exists (select 1 from pg_policies where tablename = 'promotions' and policyname = 'auth_all_promotions') then
    create policy auth_all_promotions on public.promotions
      for all to authenticated using (true) with check (true);
  end if;
  -- Landing público: el rol anon lee solo promos activas marcadas para el landing.
  -- La ventana temporal / presupuesto se filtran en la app (no en la policy).
  if not exists (select 1 from pg_policies where tablename = 'promotions' and policyname = 'public_read_landing_promotions') then
    create policy public_read_landing_promotions on public.promotions
      for select to anon using (active = true and show_on_landing = true);
  end if;
end $$;
