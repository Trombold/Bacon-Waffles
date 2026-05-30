-- Bacon Waffles — comentarios/reseñas editables desde el CRM y mostrados en el landing.
-- Mismo patrón que productos: escritura solo authenticated, lectura pública de los activos.
-- Idempotente: seguro re-ejecutar.

-- ── 1. Tabla ──
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                 -- autor de la reseña
  text        text not null,                 -- cuerpo del comentario
  stars       integer not null default 5 check (stars between 1 and 5),
  active      boolean not null default true, -- visible en el landing
  sort        integer not null default 0,    -- orden manual (asc)
  created_at  timestamptz not null default now()
);

create index if not exists idx_reviews_active on public.reviews(active);

-- ── 2. RLS ──
alter table public.reviews enable row level security;

do $$
begin
  -- Staff del obrador: CRUD completo.
  if not exists (select 1 from pg_policies where tablename = 'reviews' and policyname = 'auth_all_reviews') then
    create policy auth_all_reviews on public.reviews
      for all to authenticated using (true) with check (true);
  end if;
  -- Landing público: el rol anon lee solo reseñas activas.
  if not exists (select 1 from pg_policies where tablename = 'reviews' and policyname = 'public_read_active_reviews') then
    create policy public_read_active_reviews on public.reviews
      for select to anon using (active = true);
  end if;
end $$;

-- ── 3. Seed (las 3 reseñas que estaban estáticas en data.ts) ──
insert into public.reviews (name, text, stars, active, sort) values
  ('Camila R.',   'El King Kong es absurdamente bueno. Llegó calientito y crocante.', 5, true, 1),
  ('Andrés V.',   'Pedí el Carbonatta y quedé sorprendido. Volveré sí o sí.',         5, true, 2),
  ('Doménica P.', 'Atención por WhatsApp súper rápida. Me llegó en 25 min.',          5, true, 3)
on conflict do nothing;
