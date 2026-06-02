-- Bacon Waffles — método de pago en pedidos (efectivo / transferencia).
-- Permite desglosar las ventas por forma de cobro en dashboard y reportes.
-- Idempotente.

alter table public.orders
  add column if not exists metodo_pago text not null default 'efectivo';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_metodo_pago_check'
  ) then
    alter table public.orders
      add constraint orders_metodo_pago_check
      check (metodo_pago in ('efectivo', 'transferencia'));
  end if;
end $$;

create index if not exists idx_orders_metodo_pago on public.orders(metodo_pago);
