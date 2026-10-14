-- Lectura de precios de las webs de proveedores (alcance módulo 04 y decisión T4).
-- Primera versión: tiendas con catálogo público VTEX (p. ej. Easy, Prestigio), que exponen
-- precio por API sin necesidad de un navegador. Cada material se vincula a mano con el producto
-- equivalente de cada tienda (la equivalencia la decide el estudio) y un cron actualiza el precio.

alter table public.proveedores
  add column web_plataforma text check (web_plataforma in ('vtex')),
  add column web_dominio text;   -- p. ej. www.easy.com.ar

create table public.material_productos_web (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materiales (id) on delete cascade,
  proveedor_id uuid not null references public.proveedores (id) on delete cascade,
  producto_id text not null,          -- id del producto en la tienda
  nombre text not null,               -- cómo lo llama la tienda
  url text,
  ultima_lectura timestamptz,
  ultimo_error text,
  created_at timestamptz not null default now(),
  unique (material_id, proveedor_id)
);

alter table public.material_productos_web enable row level security;

create policy "staff gestiona productos web" on public.material_productos_web
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
