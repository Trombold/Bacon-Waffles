# Plan — Modificadores de línea (exclusiones + add-ons). B2 pragmático.

Ref: research.md (2026-06-02). Stack: Next 16.2.6, Supabase (supabase-js), server actions, TS.

## Alcance FASE 1 (este plan)
Exclusiones por línea + add-on "Bola de helado" funcionando de punta a punta: UI de pedido,
precio recalculado server-side, `order_items` estructurado, inventario receta-driven, texto visible
en cocina. Add-ons leídos de BD (seeded). 

**Fuera (FASE 2, no ahora):** UI de gestión de add-ons en CRM; migrar Reportes a `order_items`.

---

## 1. Migración SQL — `supabase/migrations/0013_order_modifiers.sql` (NUEVO)
Idempotente, mismo estilo que las existentes.

```sql
-- Extiende order_items (tabla ya existe, 0001) con modificadores por línea + total snapshot.
alter table public.order_items add column if not exists modifiers jsonb not null default '{}'::jsonb;
alter table public.order_items add column if not exists line_total numeric(10,2) not null default 0;
-- modifiers shape: { "exclude": [ingredient_id...], "addons": [{ "id": addon_id, "qty": n }] }

-- Catálogo de add-ons (extras pagos reutilizables).
create table if not exists public.addons (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  price_delta numeric(10,2) not null default 0,
  scope       text not null default 'Dulces' check (scope in ('Dulces','Salados','Bebidas','all')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
-- Mini-BOM del add-on: qué ingredientes consume.
create table if not exists public.addon_recipes (
  id            uuid primary key default gen_random_uuid(),
  addon_id      uuid not null references public.addons(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  qty           numeric(12,3) not null default 0,
  unique (addon_id, ingredient_id)
);
create index if not exists idx_addon_recipes_addon on public.addon_recipes(addon_id);

-- RLS (patrón del repo).
alter table public.addons        enable row level security;
alter table public.addon_recipes enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename='addons' and policyname='auth_all_addons') then
    create policy auth_all_addons on public.addons for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='addon_recipes' and policyname='auth_all_addon_recipes') then
    create policy auth_all_addon_recipes on public.addon_recipes for all to authenticated using (true) with check (true);
  end if;
end $$;

-- Seed: ingrediente Helado + add-on Bola de helado (Dulces, $1, 1 unidad).
insert into public.ingredients (name, unit, stock, threshold, avg_cost, active)
  values ('Helado', 'unidad', 0, 0, 0, true)
  on conflict (name) do nothing;
do $$
declare v_addon uuid; v_ing uuid;
begin
  select id into v_ing from public.ingredients where name='Helado';
  insert into public.addons (name, price_delta, scope, active)
    values ('Bola de helado', 1.00, 'Dulces', true)
    on conflict do nothing
    returning id into v_addon;
  if v_addon is null then select id into v_addon from public.addons where name='Bola de helado'; end if;
  if v_addon is not null and v_ing is not null then
    insert into public.addon_recipes (addon_id, ingredient_id, qty)
      values (v_addon, v_ing, 1)
      on conflict (addon_id, ingredient_id) do nothing;
  end if;
end $$;
```
Aplicar: SQL Editor de Supabase (o `supabase db push`). **Acción manual del usuario** tras merge.

---

## 2. Tipos — `src/lib/types.ts`
Añadir:
```ts
export type LineModifiers = {
  exclude: string[];                          // ingredient_ids quitados de la receta
  addons: { id: string; qty: number }[];      // addon_id + cantidad (absoluta por línea)
};

export type Addon = {
  id: string;
  name: string;
  price_delta: number;
  scope: 'Dulces' | 'Salados' | 'Bebidas' | 'all';
  active: boolean;
  recipe: { ingredient_id: string; qty: number }[];   // de addon_recipes
};
```

---

## 3. Queries — `src/lib/crm-queries.ts`
- **`getActiveAddons(): Promise<Addon[]>`** — `addons` activos + join `addon_recipes`:
  `select('id,name,price_delta,scope,active, addon_recipes(ingredient_id,qty)')`, map a `Addon`.
- **`getProductRecipes(): Promise<{product_id,ingredient_id,ingredient_name,unit,qty}[]>`** —
  ya existe `getRecipeLines()`; reutilizar tal cual (devuelve eso). No duplicar.

---

## 4. Motor de pedido server-side — `src/app/crm/actions.ts`

### 4a. `buildOrderFromCart` (actions.ts:490) — extender
- Firma carrito: `cart: { id: string; qty: number; modifiers?: LineModifiers }[]`.
- Cargar también `getActiveAddons()` (Promise.all junto a products/promos).
- Base lines para promo (sin cambios): `evalPromos(baseLines, promos)`.
- `addons_surcharge = Σ líneas Σ addon (addonById[a.id].price_delta · a.qty)`.
- `total = subtotal_base − result.discount + addons_surcharge`.
- Texto `items`: por línea `"{qty}× {name}"` + sufijos:
  - exclusión: `" · sin {ingredient_name}"` (resolver nombre vía recipe lines / ingredients map).
  - add-ons: `" · + {qty}× {addon.name}"`.
  - regalos: como hoy `"{qty}× {name} 🎁"`.
- **Devolver además `structuredLines`** para insertar en `order_items`:
  ```ts
  type BuiltLine = { product_id: string; name: string; qty: number;
                     unit_price: number; line_total: number; modifiers: LineModifiers };
  ```
  + las líneas-regalo como `BuiltLine` con `unit_price:0, line_total:0, modifiers vacío`,
    resolviendo `product_id` por nombre (map name→id de products).
- Return: `{ items, total, appliedPromoIds, structuredLines }`.

### 4b. `createOrder` (actions.ts:531) — insertar order_items
- Tras insertar `orders` y obtener `created.id`:
  ```ts
  if (built && built.structuredLines.length) {
    await supabase.from('order_items').insert(
      built.structuredLines.map(l => ({
        order_id: created.id, product_id: l.product_id, name: l.name,
        qty: l.qty, price: l.unit_price, line_total: l.line_total, modifiers: l.modifiers,
      }))
    );
  }
  ```
- Insertar SIEMPRE que haya carrito (aunque nazca 'recibido'), para que el consumo posterior los lea.
- `tallyRedemptions` y `consumeForOrder` igual que hoy (orden: insert orders → insert items →
  tally → consume si no es 'recibido').

### 4c. `consumeForOrder` (actions.ts:294) — receta-driven con fallback
- Cargar `order_items` del pedido: `select('product_id, qty, modifiers')`.
- **Si hay filas** → ruta estructurada:
  ```
  para cada item:
    rec = recByProd[item.product_id] || []
    excl = new Set(item.modifiers?.exclude || [])
    para cada r de rec: if (!excl.has(r.ingredient_id)) consume[r.ingredient_id] += r.qty * item.qty
    para cada a de item.modifiers?.addons || []:
      para cada ar de addonRecByAddon[a.id] || []: consume[ar.ingredient_id] += ar.qty * a.qty
  ```
  (cargar `addon_recipes` en un map; regalos ya son order_items con su product_id → consumen receta normal.)
- **Si NO hay filas** (pedidos legacy) → mantener EXACTAMENTE el parseo de texto actual.
- Resto (movements, update stock, `inventory_consumed=true`) sin cambios.

---

## 5. Página de pedidos — `src/app/crm/pedidos/page.tsx`
Añadir al `Promise.all`: `getActiveAddons()` y `getRecipeLines()`. Pasar `addons` y `recipes` al client.

---

## 6. UI — `src/app/crm/pedidos/PedidosClient.tsx`
- Props nuevas: `addons: Addon[]`, `recipes: RecipeLine[]`.
- `type Line` += `modifiers: LineModifiers` (default `{exclude:[],addons:[]}`).
- `cartLines` para preview: precio base sin cambios (promos sobre base). Calcular
  `addonsSurcharge` aparte y `total = subtotal − promo.discount + addonsSurcharge`.
- `addLine`: mergear solo si `id` Y `modifiers` idénticos (stringify); si no, push línea nueva.
  Nueva línea nace con modifiers vacío.
- **Panel "Modificar" por línea** (toggle expandible bajo la línea):
  - Exclusiones: chips de `recipes.filter(r=>r.product_id===line.id)`; click togglea
    `ingredient_id` en `line.modifiers.exclude`. Estilo chip tachado cuando excluido.
  - Add-ons: `addons.filter(a => a.scope==='all' || a.scope===line.cat)`; toggle on/off +
    stepper qty → `line.modifiers.addons`.
- Display de línea: mostrar "sin {ing}" y "+ {qty}× {addon}"; precio línea = base·qty + surcharge.
- `submitNew`: `cart` ahora incluye `modifiers`:
  `lines.map(l => ({ id:l.id, qty:l.qty, modifiers:l.modifiers }))`.
  Texto legado `items`/`total` puede quedar como fallback (server recalcula igual).

---

## 7. Verificación (manual, `pnpm dev`)
1. Aplicar migración 0013 en Supabase.
2. Inventario: crear compra de "Helado" (set stock + avg_cost) y receta de Frutella con "Fresas".
3. Pedido "1× Frutella sin Fresas" → al cocinar, NO baja Fresas, sí el resto.
4. Pedido "1× King Kong + Bola de helado" → total +$1; al cocinar baja 1 Helado.
5. Promo + add-on en mismo pedido → descuento sobre base, surcharge sumado aparte.
6. Pedido legacy (texto, sin order_items) → consumo sigue por texto (fallback).

---

## Orden de ejecución sugerido
1 (SQL) → 2 (tipos) → 3 (queries) → 4 (actions: build/create/consume) → 5 (page) → 6 (UI) → 7 (verificar).
Delegable a `coder` por archivo siguiendo este plan; 4c (consumeForOrder) es el punto crítico.
