-- Bacon Waffles — conectar productos del CRM con el menú del landing.
-- Añade campos editoriales, abre lectura pública (solo activos) y completa la carta.
-- Idempotente: seguro re-ejecutar.

-- ── 1. Campos editoriales que muestra el landing ──
alter table public.products add column if not exists description text;
alter table public.products add column if not exists sweet integer;   -- nivel de dulzura 1..5 (null = sin medir)
alter table public.products add column if not exists tag text;        -- etiqueta: TOP, NUEVO, etc.

-- ── 2. Backfill de los productos ya sembrados (por SKU) ──
update public.products set description = 'Plátano, manjar, Nutella, galletas Oreo y chantilly', sweet = 5, tag = 'TOP'   where sku = 'DLC-001';
update public.products set description = 'Nutella, mermelada de frutos rojos, banana, fresas, Oreo y Hershey''s', sweet = 5 where sku = 'DLC-002';
update public.products set description = 'Crema de café, mascarpone, bizcotelas, canela y sirope', sweet = 4            where sku = 'DLC-003';
update public.products set description = 'Doble Nutella, doble frutilla y crema chantilly', sweet = 4                   where sku = 'DLC-004';
update public.products set description = 'Crema de maracuyá, galleta maría triturada y nueces', sweet = 3, tag = 'NUEVO' where sku = 'DLC-005';
update public.products set description = 'Champiñones al vino, tocino, crema, mozzarella, lechuga y papa hilo'          where sku = 'SLD-001';
update public.products set description = 'Doble cheddar, doble tocino BBQ, lechuga crespa y tomate cherry'              where sku = 'SLD-002';
update public.products set description = 'Café, caramelo y leche con hielo, nata y espiral de caramelo'                 where sku = 'BBD-001';
update public.products set description = 'Café, fresa y leche de coco'                                                   where sku = 'BBD-002';

-- ── 3. Completar la carta del landing (los 9 items que faltaban) ──
insert into public.products (sku, name, cat, price, stock, active, description, sweet, tag) values
  ('DLC-006', 'Frutos Rojos',          'Dulces',  5.00, 20, true, 'Crema de frutos rojos, fresas y granola', 3, 'NUEVO'),
  ('DLC-007', 'Lemon Trip',            'Dulces',  4.75, 20, true, 'Crema de limón, galleta triturada, duraznos en almíbar y manjar', 3, null),
  ('DLC-008', 'Tutti Frutti',          'Dulces',  4.75, 20, true, 'Crema de limón, fresa, banana, durazno en almíbar y manjar', 2, null),
  ('SLD-003', 'Carbonatta',            'Salados', 5.50, 16, true, 'Crema salteada con tocino, vino, mozzarella, parmesano y papas al hilo', null, null),
  ('SLD-004', 'Americano',             'Salados', 4.70, 16, true, 'Huevos (revueltos o fritos), tocino, papas al hilo y miel de maple', null, null),
  ('BBD-003', 'Strawberries & Cream',  'Bebidas', 3.75, 25, true, 'Crema, fresa con leche batidos con hielo y nata', null, null),
  ('BBD-004', 'Smoothie',              'Bebidas', 3.00, 25, true, 'Batido de leche con fresa, banana y durazno', null, null),
  ('BBD-005', 'Chocolate Mint',        'Bebidas', 2.50, 25, true, 'Chocolate caliente de menta con malvaviscos', null, null),
  ('BBD-006', 'Tropical Juice',        'Bebidas', 2.50, 25, true, 'Jugo de piña con coco', null, null)
on conflict (sku) do nothing;

-- ── 4. Lectura pública del menú (solo productos activos) ──
-- El landing es público: el rol anon puede leer productos activos. Escritura sigue solo authenticated.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'products' and policyname = 'public_read_active_products') then
    create policy public_read_active_products on public.products
      for select to anon using (active = true);
  end if;
end $$;
