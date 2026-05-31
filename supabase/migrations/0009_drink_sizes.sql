-- Bacon Waffles — tamaño en el nombre de las bebidas con variantes.
-- Elimina nombres duplicados (Fresa Coco ×2, Té helado ×2): los nombres únicos
-- arreglan la colisión de keys en la UI, el matching de inventario por nombre
-- (consumeForOrder) y la separación por producto en Reportes.
-- Update por SKU (identidad estable), no por nombre. Idempotente.

update public.products set name = 'Fresa Coco 400 ml' where sku = 'BBD-007';  -- $1.25
update public.products set name = 'Fresa Coco 250 ml' where sku = 'BBD-008';  -- $1.00
update public.products set name = 'Té helado 450 ml'  where sku = 'BBD-009';  -- $1.00
update public.products set name = 'Té helado 250 ml'  where sku = 'BBD-010';  -- $0.75
