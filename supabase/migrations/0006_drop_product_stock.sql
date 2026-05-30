-- Bacon Waffles — eliminar products.stock (stock por unidad de producto).
-- El inventario real se maneja por ingredientes (ver 0005_inventory.sql); el stock
-- por unidad de producto no aplica a un obrador. Columna sin uso en el código.
-- Idempotente.

alter table public.products drop column if exists stock;
