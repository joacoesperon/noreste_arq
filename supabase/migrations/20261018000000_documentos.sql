-- Etapa 2 · Documentos
-- La ficha de la obra + una plantilla → documento con la identidad del estudio,
-- editable en el panel, con versiones (v1, v2…) y exportación a PDF y Word.

-- Plantillas editables por el estudio. Solo existe fila cuando el estudio la
-- modificó; si no, el panel usa la plantilla base del código (src/lib/documentos/plantillas-base.ts).
create table public.plantillas (
  clave text primary key,            -- tipo de documento, p. ej. 'propuesta', 'contrato_proyecto'
  contenido jsonb not null,          -- documento TipTap con {{datos}}
  updated_by uuid references public.staff (id) on delete set null,
  updated_at timestamptz not null default now()
);

create trigger plantillas_updated_at
  before update on public.plantillas
  for each row execute function public.set_updated_at();

create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras (id) on delete cascade,
  tipo text not null,
  titulo text not null,
  contenido jsonb not null,          -- borrador actual (TipTap)
  datos jsonb not null default '{}'::jsonb,  -- campos propios del tipo (montos, contraparte…)
  version_actual integer not null default 0,
  created_by uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documentos_obra_id_idx on public.documentos (obra_id, updated_at desc);

create trigger documentos_updated_at
  before update on public.documentos
  for each row execute function public.set_updated_at();

-- Cada versión guarda el documento ya resuelto (bloques), para que se pueda volver
-- a descargar igual aunque después cambien los datos de la obra o la plantilla.
create table public.documento_versiones (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references public.documentos (id) on delete cascade,
  numero integer not null,
  contenido jsonb not null,
  datos jsonb not null,
  bloques jsonb not null,
  nota text,
  created_by uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (documento_id, numero)
);

alter table public.plantillas enable row level security;
alter table public.documentos enable row level security;
alter table public.documento_versiones enable row level security;

create policy "staff gestiona plantillas" on public.plantillas
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff gestiona documentos" on public.documentos
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- Las versiones no se modifican: solo se crean (y se borran con el documento).
create policy "staff lee versiones" on public.documento_versiones
  for select to authenticated using ((select public.is_staff()));
create policy "staff crea versiones" on public.documento_versiones
  for insert to authenticated with check ((select public.is_staff()));

-- Crea la siguiente versión de forma atómica (evita dos "v3" si guardan a la vez).
create or replace function public.crear_version_documento(
  p_documento_id uuid,
  p_contenido jsonb,
  p_datos jsonb,
  p_bloques jsonb,
  p_nota text default null
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_numero integer;
begin
  update public.documentos
  set version_actual = version_actual + 1, contenido = p_contenido, datos = p_datos
  where id = p_documento_id
  returning version_actual into v_numero;

  if v_numero is null then
    raise exception 'documento inexistente';
  end if;

  insert into public.documento_versiones (documento_id, numero, contenido, datos, bloques, nota, created_by)
  values (p_documento_id, v_numero, p_contenido, p_datos, p_bloques, p_nota, (select auth.uid()));

  return v_numero;
end;
$$;

revoke execute on function public.crear_version_documento(uuid, jsonb, jsonb, jsonb, text) from public, anon;
grant execute on function public.crear_version_documento(uuid, jsonb, jsonb, jsonb, text) to authenticated;
