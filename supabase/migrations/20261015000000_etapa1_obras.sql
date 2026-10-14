-- Etapa 1 · Obras
-- Cada obra se carga una sola vez y es la base de documentos, cronogramas,
-- archivos, presupuestos y tareas. Las listas (tipologías, servicios,
-- especialidades) viven en src/lib/obras/constants.ts para poder ajustarlas sin migración.

-- updated_at automático ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Clientes ----------------------------------------------------------------------
-- Separados de las obras: un mismo cliente puede tener varias.
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,            -- persona o razón social
  dni_cuit text,
  domicilio text,
  email text,
  telefono text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger clientes_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();

-- Obras -------------------------------------------------------------------------
create table public.obras (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  cliente_id uuid references public.clientes (id) on delete set null,
  tipologia text,
  estado text not null default 'propuesta'
    check (estado in ('propuesta', 'en_proyecto', 'en_obra', 'terminada')),

  -- ubicación (define la zona de precios del presupuestador)
  direccion text,
  localidad text,
  provincia text,

  -- superficies en m². Si la obra tiene sectores, el total es la suma de los sectores.
  sup_cubierta numeric(10, 2),
  sup_semicubierta numeric(10, 2),
  sup_descubierta numeric(10, 2),

  servicios text[] not null default '{}',

  -- plazos
  proyecto_inicio date,
  proyecto_duracion_meses numeric(5, 1),
  obra_inicio date,
  obra_duracion_meses numeric(5, 1),

  notas text,

  -- asistente de carga: se puede guardar a medias y seguir después
  borrador boolean not null default true,
  asistente_paso smallint not null default 1,

  created_by uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index obras_cliente_id_idx on public.obras (cliente_id);

create trigger obras_updated_at
  before update on public.obras
  for each row execute function public.set_updated_at();

-- Sectores (obras grandes) -------------------------------------------------------
create table public.obra_sectores (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras (id) on delete cascade,
  orden smallint not null default 0,
  nombre text not null,
  sup_cubierta numeric(10, 2),
  sup_semicubierta numeric(10, 2),
  sup_descubierta numeric(10, 2)
);

create index obra_sectores_obra_id_idx on public.obra_sectores (obra_id);

-- Colaboradores: personas del estudio (staff_id) o externas (nombre) ---------------
create table public.obra_colaboradores (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras (id) on delete cascade,
  orden smallint not null default 0,
  staff_id uuid references public.staff (id) on delete set null,
  nombre text,
  rol text,
  contacto text,
  check (staff_id is not null or nullif(trim(nombre), '') is not null)
);

create index obra_colaboradores_obra_id_idx on public.obra_colaboradores (obra_id);

-- Especialidades y quién se ocupa de cada una --------------------------------------
create table public.obra_especialidades (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras (id) on delete cascade,
  orden smallint not null default 0,
  especialidad text not null,
  responsable text,
  contacto text
);

create index obra_especialidades_obra_id_idx on public.obra_especialidades (obra_id);

-- RLS: todo exclusivo del estudio ---------------------------------------------------
alter table public.clientes enable row level security;
alter table public.obras enable row level security;
alter table public.obra_sectores enable row level security;
alter table public.obra_colaboradores enable row level security;
alter table public.obra_especialidades enable row level security;

create policy "staff gestiona clientes" on public.clientes
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff gestiona obras" on public.obras
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff gestiona sectores" on public.obra_sectores
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff gestiona colaboradores" on public.obra_colaboradores
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff gestiona especialidades" on public.obra_especialidades
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- Reemplazo atómico de las listas hijas de una obra (sectores, colaboradores,
-- especialidades). security invoker: respeta RLS del usuario que llama.
create or replace function public.reemplazar_listas_obra(
  p_obra_id uuid,
  p_sectores jsonb default null,
  p_colaboradores jsonb default null,
  p_especialidades jsonb default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_sectores is not null then
    delete from public.obra_sectores where obra_id = p_obra_id;
    insert into public.obra_sectores (obra_id, orden, nombre, sup_cubierta, sup_semicubierta, sup_descubierta)
    select p_obra_id, (x.ord - 1)::smallint, x.v->>'nombre',
      (x.v->>'sup_cubierta')::numeric, (x.v->>'sup_semicubierta')::numeric, (x.v->>'sup_descubierta')::numeric
    from jsonb_array_elements(p_sectores) with ordinality as x(v, ord);
  end if;

  if p_colaboradores is not null then
    delete from public.obra_colaboradores where obra_id = p_obra_id;
    insert into public.obra_colaboradores (obra_id, orden, staff_id, nombre, rol, contacto)
    select p_obra_id, (x.ord - 1)::smallint, (x.v->>'staff_id')::uuid, x.v->>'nombre', x.v->>'rol', x.v->>'contacto'
    from jsonb_array_elements(p_colaboradores) with ordinality as x(v, ord);
  end if;

  if p_especialidades is not null then
    delete from public.obra_especialidades where obra_id = p_obra_id;
    insert into public.obra_especialidades (obra_id, orden, especialidad, responsable, contacto)
    select p_obra_id, (x.ord - 1)::smallint, x.v->>'especialidad', x.v->>'responsable', x.v->>'contacto'
    from jsonb_array_elements(p_especialidades) with ordinality as x(v, ord);
  end if;
end;
$$;

revoke execute on function public.reemplazar_listas_obra(uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.reemplazar_listas_obra(uuid, jsonb, jsonb, jsonb) to authenticated;
