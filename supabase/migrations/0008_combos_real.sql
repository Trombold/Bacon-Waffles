-- Bacon Waffles — combos reales (reemplaza los 3 de ejemplo sembrados en 0007).
-- Idempotente: borra los ejemplos por nombre (sin recetas) y hace upsert de los
-- 5 reales por SKU, de modo que re-ejecutar NO borra los reales ni sus recetas
-- (recipes.product_id es on delete cascade).

-- ── 1. Quitar combos de ejemplo de 0007 (por nombre, no por SKU) ──
delete from public.products
where cat = 'Combos' and name in ('Combo Dúo', 'Combo Brunch', 'Combo Familiar');

-- ── 2. Combos reales ──
-- Inactivos: Duo de Dulce, Duo de Sal, Combo para 2.  Activos: Combo Salado, Combo de Frío.
insert into public.products (sku, name, cat, price, active, description, sweet, tag) values
  ('CMB-001', 'Duo de Dulce',  'Combos',  9.00, false, 'Dos waffles de dulce a elección', null, null),
  ('CMB-002', 'Duo de Sal',    'Combos', 10.00, false, 'Dos waffles de sal a elección', null, null),
  ('CMB-003', 'Combo para 2',  'Combos', 15.75, false, 'Dos waffles de dulce a elección + dos chocolates', null, null),
  ('CMB-004', 'Combo Salado',  'Combos',  6.00, true,  'Waffle de sal a elección + té helado de 250 ml', null, null),
  ('CMB-005', 'Combo de Frío', 'Combos',  7.75, true,  'Waffle de dulce a elección + chocolate caliente', null, null)
on conflict (sku) do update set
  name        = excluded.name,
  cat         = excluded.cat,
  price       = excluded.price,
  active      = excluded.active,
  description = excluded.description,
  tag         = excluded.tag;
