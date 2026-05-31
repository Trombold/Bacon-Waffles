-- Bacon Waffles — corrige el precio de Chocolate Mint a $3.25.
-- Ya aplicado en la DB vía CRM; esta migración deja el cambio reproducible en el repo.
-- Update por SKU (identidad estable). Idempotente.

update public.products set price = 3.25 where sku = 'BBD-005';
