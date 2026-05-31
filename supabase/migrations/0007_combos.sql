-- Bacon Waffles — categoría "Combos" en el menú.
-- Amplía el check de cat, siembra combos de ejemplo y los expone al landing.
-- Idempotente: seguro re-ejecutar.

-- ── 1. Ampliar la categoría permitida ──
alter table public.products drop constraint if exists products_cat_check;
alter table public.products
  add constraint products_cat_check check (cat in ('Dulces', 'Salados', 'Combos', 'Bebidas'));

-- ── 2. Combos de ejemplo (editables desde el CRM) ──
insert into public.products (sku, name, cat, price, active, description, sweet, tag) values
  ('CMB-001', 'Combo Dúo',      'Combos', 16.00, true, 'Dos waffles dulces a elección + dos bebidas', null, 'TOP'),
  ('CMB-002', 'Combo Brunch',   'Combos', 13.50, true, 'Un waffle salado, un waffle dulce y una bebida', null, null),
  ('CMB-003', 'Combo Familiar', 'Combos', 28.00, true, 'Cuatro waffles a elección + cuatro bebidas', null, 'AHORRO')
on conflict (sku) do nothing;
