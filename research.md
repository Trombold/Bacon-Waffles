# Research — Modificadores de línea en pedidos (exclusiones + add-ons)

Fecha: 2026-06-02
Objetivo: permitir "Frutella sin fresas" (exclusión: no resta ingrediente, precio igual) y
"+ Bola de helado $1" (add-on: suma precio + suma inventario), unificados como
**modificadores por línea**. Modelo elegido: **B2 pragmático** (`order_items` reactivada +
columna `modifiers` JSONB; tablas `addons` / `addon_recipes`).

## Estado actual del código (fuente de verdad = repo)

### Schema relevante (supabase/migrations)
- `products(id, sku, name, cat['Dulces'|'Salados'|'Bebidas'], price, active...)` — 0001.
- `orders(id, code, cliente, items TEXT, total, estado, archived, inventory_consumed...)`.
  El pedido se guarda como **una fila con texto libre** `items` ("2× King Kong, 1× Mocca").
- **`order_items(id, order_id FK, product_id FK→products, name, qty, price)` — YA EXISTE (0001:38)
  pero está MUERTA**: nadie inserta filas; solo un comentario la menciona (crm-queries.ts:406).
  → La reactivamos y extendemos, no creamos tabla nueva.
- `ingredients(id, name unique, unit['g'|'ml'|'unidad'], stock, threshold, avg_cost, active)` — 0005.
- `recipes(id, product_id FK, ingredient_id FK, qty, unique(product_id,ingredient_id))` — BOM. 0005.
- `inventory_movements(ingredient_id, type['purchase'|'consumption'|'adjustment'], qty, cost, ref)`.
- RLS: toda tabla CRM → policy `for all to authenticated using(true) with check(true)`.

### Flujo de pedido (actions.ts / PedidosClient.tsx)
- Cliente arma `lines: {id,name,cat,price,qty}`. Envía `cart: [{id,qty}]` (JSON) + texto legado.
- `createOrder` (actions.ts:531) → `buildOrderFromCart` (490) recalcula items/total server-side
  (FUENTE DE VERDAD), aplica promos (`evalPromos`), inserta **solo** la fila `orders`
  (texto + total). **No inserta `order_items`.**
- Inventario: `consumeForOrder` (actions.ts:294) corre al pasar a `cocinando` (o al crear si nace
  avanzado). **Lee `orders.items` (texto), matchea nombre de producto por substring, parsea qty con
  regex, aplica receta COMPLETA.** Idempotente vía `orders.inventory_consumed`.
  - Limitación actual: no distingue dos líneas del mismo producto; no hay dónde expresar "sin X".
- Líneas-regalo de promo: hoy se consumen porque su texto ("1× X 🎁") matchea por nombre.

### "Bola de helado $1"
- Hoy es **ficción**: línea hardcodeada en el landing (`app/page.tsx:349`). No es producto, no entra
  al flujo de pedido, no toca inventario. Si la piden, no se representa ni se descuenta el helado.

### Promos (promo-engine.ts)
- Puro/isomórfico. `CartLine = {id,name,cat,price,qty}`. `evalPromos` → `{applied, rewardLines, discount}`.
- Descuentos calculados sobre subtotal/categoría del **precio base**.

### Queries (crm-queries.ts)
- `getActiveProducts()` → `{id,name,price,cat}` activos.
- `getRecipeLines()` → `{id,product_id,ingredient_id,ingredient_name,unit,qty}` (join `ingredients`).
  Usa sintaxis nested `select('...,ingredients(name,unit)')` — patrón ya probado.
- `getActivePromotions()` para el motor.
- `pedidos/page.tsx` pasa `orders, customers, products, promotions` al client.

## Verificado con Context7 (/supabase/supabase)
- **JSONB insert (supabase-js)**: pasar el objeto directo en `.insert({ ..., modifiers: {...} })`.
  La columna `jsonb` acepta el objeto JS sin serializar manualmente.
- **Select de JSONB**: `select('col->>key')` / `col->key`. No lo necesitamos para inventario
  (leemos el objeto completo), sí útil si Reportes migrara (fase 2).
- **Nested join** `from('order_items').select('*, ...')`: patrón confirmado, igual que `getRecipeLines`.
- Next.js 16 server actions: sin cambios de API vs lo ya usado en `actions.ts` (repo corre 16.2.6).

## Decisiones cerradas con el usuario
1. Precio NO cambia en exclusiones. Add-on suma `price_delta`.
2. Bola de helado: scope **solo Dulces**.
3. Modelo **B2 pragmático**: `order_items` + `modifiers` JSONB (NO tablas hijas de modificadores).
4. `addon.qty` explícito, default 1. **Es absoluto por línea** (no se multiplica por `qty` del producto).
5. Exclusión múltiple permitida (`exclude: string[]`).
6. `unit_price` snapshot en la línea (reutiliza `order_items.price`).
7. Reportes: se queda en texto → **fase 2** (no bloquea esto).
8. Catálogo `addons` gestionable: **seed en fase 1**; UI de gestión → fase 2.

## Reglas de cálculo (cliente preview == servidor autoritativo)
- `subtotal_base = Σ product.price · qty`            (solo productos base)
- `discount = evalPromos(base).discount`             (promos operan SOLO sobre base)
- `addons_surcharge = Σ_líneas Σ_addons addon.price_delta · addon.qty`   (NO × qty del producto)
- `total = subtotal_base − discount + addons_surcharge`
- Inventario por línea:
  - base: `(receta − exclude).qty · item.qty`
  - add-ons: `addon_recipe.qty · addon.qty`          (absoluto, NO × item.qty)
  - regalos de promo: insertadas como `order_items` price 0 → consumidas igual.

## Riesgos / notas
- **Regalos de promo + consumo estructurado**: si `consumeForOrder` pasa a leer `order_items`, los
  regalos deben existir como filas (price 0) o no se descuentan. → insertarlos como `order_items`.
- **Merge de líneas**: hoy `addLine` suma qty por id. Con modificadores, solo mergear si `id` Y
  `modifiers` idénticos; si difieren → línea separada.
- **Ingrediente "Helado"**: el add-on necesita un ingrediente al que descontar. Seed lo crea
  (unit 'unidad', cost 0 hasta primera compra).
- **Legacy**: pedidos sin `order_items` → `consumeForOrder` cae al parseo de texto actual (fallback).
