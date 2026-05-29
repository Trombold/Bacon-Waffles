-- Bacon Waffles — soporte de archivado de pedidos.
-- Los pedidos entregados se archivan para no aglomerar el Kanban; pasan a Historial.
-- Idempotente.

alter table public.orders add column if not exists archived boolean not null default false;

create index if not exists idx_orders_archived on public.orders(archived);
