# Bacon Waffles — Landing + CRM

Obrador de waffles a domicilio en Loja, Ecuador. Landing público + CRM interno.
Diseño: **V1 Marca Oficial · Artesanal — paleta D · Verde Profundo**.

Stack: **Next.js 16** (App Router) · **React 19** · **Supabase** (Postgres + Auth) · **pnpm** · deploy en **Vercel**.

## Rutas

| Ruta            | Acceso    | Descripción                                              |
|-----------------|-----------|----------------------------------------------------------|
| `/`             | Público   | Landing (hero, menú, cómo pedir, obrador, reseñas, CTA)  |
| `/login`        | Público   | Login de staff (Supabase email/password)                 |
| `/crm`          | Protegido | Dashboard (métricas, ventas 7d, top productos, activos)  |
| `/crm/pedidos`  | Protegido | Kanban: recibido → cocinando → en camino → entregado     |
| `/crm/productos`| Protegido | CRUD de productos                                        |
| `/crm/clientes` | Protegido | CRUD de clientes                                         |
| `/crm/reportes` | Protegido | Ventas por día, mix de categorías, hora pico             |

Las rutas `/crm/*` están protegidas por `src/proxy.ts` (redirige a `/login` sin sesión).

## Setup local

1. **Instalar dependencias** (gestor: pnpm)
   ```bash
   pnpm install
   ```
   pnpm bloquea por defecto los scripts de build de dependencias (seguridad
   supply-chain). Los permitidos se listan en `pnpm-workspace.yaml` (`allowBuilds`).

2. **Crear proyecto Supabase** → copiar URL y anon key.

3. **Variables de entorno** — copiar `.env.local.example` a `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-public-key
   ```

4. **Migración + seed** — en Supabase → SQL Editor, pegar y ejecutar
   `supabase/migrations/0001_init.sql` (crea tablas, RLS y datos de ejemplo).

5. **Crear usuario staff** — Supabase → Authentication → Users → Add user
   (email + password). Con ese usuario se entra al CRM.

6. **Dev**
   ```bash
   pnpm dev
   ```
   Landing en `http://localhost:3000`, CRM en `/crm`.

## Seguridad de dependencias

- Gestor **pnpm** con lockfile estricto; scripts de build bloqueados salvo `sharp`.
- `postcss` forzado a `>=8.5.10` vía `overrides` (corrige GHSA-qx2v-qp2m-jg93).
- `pnpm audit` → **sin vulnerabilidades conocidas**.
- Auditar en cualquier momento: `pnpm audit`.

## Deploy en Vercel

1. Importar el repo en Vercel.
2. Añadir las 2 env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Deploy. El build no requiere conexión a Supabase (las queries son en runtime).

## Datos

- **WhatsApp:** +593 96 269 1364 (los CTA del landing abren `wa.me` con mensaje precargado).
- **Horario:** Lun–Vie · 10:00–22:00.
- Esquema DB: `products`, `customers`, `orders`, `order_items` (RLS solo `authenticated`).

## Paleta D · Verde Profundo

`bg #0e1f17` · `paper #15291f` · `ink #f3ead0` · `brand #6dc197` · `accent #d9b673` ·
`muted #9bac9f` · `line #234234`. Tipografías: Cormorant Garamond (display), Manrope (UI),
JetBrains Mono (mono), Inter (CRM).
