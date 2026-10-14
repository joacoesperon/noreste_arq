-- Etapa 4 · Presupuestador de materiales
-- Catálogo propio de materiales (y mano de obra) con equivalencias por proveedor,
-- precios con fuente y fecha, y presupuestos por obra (alcance módulo 04, T4 y T7;
-- preguntas 14 a 16).

-- Materiales y mano de obra ---------------------------------------------------------
create table public.materiales (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,                 -- código del catálogo; en Revit, parámetro compartido (T7)
  nombre text not null,
  unidad text not null,               -- m², m³, kg, u, ml, bolsa, h…
  rubro text not null,
  tipo text not null default 'material' check (tipo in ('material', 'mano_de_obra')),
  notas text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger materiales_updated_at
  before update on public.materiales
  for each row execute function public.set_updated_at();

-- Proveedores, con ubicación para filtrar por radio desde la obra --------------------
create table public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  contacto text,
  telefono text,
  email text,
  web text,
  direccion text,
  localidad text,
  lat double precision,
  lng double precision,
  notas text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger proveedores_updated_at
  before update on public.proveedores
  for each row execute function public.set_updated_at();

-- Ubicación de la obra (para el radio de proveedores)
alter table public.obras
  add column lat double precision,
  add column lng double precision;

-- Listas de precios importadas (una por archivo) -------------------------------------
create table public.listas_precios (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.proveedores (id) on delete cascade,
  archivo text,
  fecha date not null,
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  items integer not null default 0,
  created_by uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Precios: historial, cada uno con su fuente y su fecha ------------------------------
create table public.precios (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materiales (id) on delete cascade,
  proveedor_id uuid not null references public.proveedores (id) on delete cascade,
  lista_id uuid references public.listas_precios (id) on delete cascade,
  precio numeric(14, 2) not null check (precio >= 0),
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  fecha date not null,
  fuente text not null default 'manual' check (fuente in ('manual', 'lista', 'web')),
  referencia text,                    -- archivo, URL o nota
  descripcion_proveedor text,         -- cómo lo nombra el proveedor
  created_by uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now()
);

create index precios_material_idx on public.precios (material_id, proveedor_id, fecha desc);

-- Último precio de cada material en cada proveedor
create view public.precios_vigentes
with (security_invoker = true) as
select distinct on (material_id, proveedor_id) *
from public.precios
order by material_id, proveedor_id, fecha desc, created_at desc;

-- Equivalencias: cómo nombra cada proveedor a un material del catálogo (T4).
-- Permite asociar solas las próximas listas del mismo proveedor.
create table public.material_equivalencias (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.proveedores (id) on delete cascade,
  texto text not null,                -- descripción normalizada (minúsculas, sin acentos ni espacios dobles)
  material_id uuid not null references public.materiales (id) on delete cascade,
  unique (proveedor_id, texto)
);

-- Presupuestos de materiales por obra --------------------------------------------------
create table public.presupuestos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras (id) on delete cascade,
  titulo text not null,
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  cotizacion_usd numeric(12, 2),      -- pesos por dólar, para convertir precios en otra moneda
  imprevistos_pct numeric(5, 2) not null default 10,
  radio_km numeric(6, 1) not null default 25,
  notas text,
  created_by uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index presupuestos_obra_id_idx on public.presupuestos (obra_id);

create trigger presupuestos_updated_at
  before update on public.presupuestos
  for each row execute function public.set_updated_at();

create table public.presupuesto_items (
  id uuid primary key default gen_random_uuid(),
  presupuesto_id uuid not null references public.presupuestos (id) on delete cascade,
  orden smallint not null default 0,
  material_id uuid references public.materiales (id) on delete set null,
  descripcion text not null,          -- copia del nombre (sobrevive si se borra el material)
  unidad text,
  rubro text not null,
  cantidad numeric(14, 3) not null default 0,
  precio_id uuid references public.precios (id) on delete set null,
  proveedor text,                     -- copia del nombre del proveedor elegido
  precio_unitario numeric(14, 2),     -- en la moneda del presupuesto
  precio_fecha date
);

create index presupuesto_items_presupuesto_idx on public.presupuesto_items (presupuesto_id, orden);

-- RLS: todo exclusivo del estudio --------------------------------------------------------
alter table public.materiales enable row level security;
alter table public.proveedores enable row level security;
alter table public.listas_precios enable row level security;
alter table public.precios enable row level security;
alter table public.material_equivalencias enable row level security;
alter table public.presupuestos enable row level security;
alter table public.presupuesto_items enable row level security;

create policy "staff gestiona materiales" on public.materiales
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff gestiona proveedores" on public.proveedores
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff gestiona listas de precios" on public.listas_precios
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff gestiona precios" on public.precios
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff gestiona equivalencias" on public.material_equivalencias
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff gestiona presupuestos" on public.presupuestos
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff gestiona ítems de presupuesto" on public.presupuesto_items
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

-- Reemplazo atómico de los ítems de un presupuesto ----------------------------------------
create or replace function public.guardar_items_presupuesto(p_presupuesto_id uuid, p_items jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.presupuesto_items where presupuesto_id = p_presupuesto_id;
  insert into public.presupuesto_items (
    presupuesto_id, orden, material_id, descripcion, unidad, rubro, cantidad,
    precio_id, proveedor, precio_unitario, precio_fecha
  )
  select p_presupuesto_id, (x.ord - 1)::smallint,
    (x.v->>'material_id')::uuid, x.v->>'descripcion', x.v->>'unidad', x.v->>'rubro',
    coalesce((x.v->>'cantidad')::numeric, 0),
    (x.v->>'precio_id')::uuid, x.v->>'proveedor',
    (x.v->>'precio_unitario')::numeric, (x.v->>'precio_fecha')::date
  from jsonb_array_elements(p_items) with ordinality as x(v, ord);
  update public.presupuestos set updated_at = now() where id = p_presupuesto_id;
end;
$$;

revoke execute on function public.guardar_items_presupuesto(uuid, jsonb) from public, anon;
grant execute on function public.guardar_items_presupuesto(uuid, jsonb) to authenticated;
