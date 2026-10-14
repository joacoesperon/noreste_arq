-- Etapa 3 · Tablero de tareas y archivos de obra

-- ---------------------------------------------------------------------------
-- Tareas
-- tipo 'entrega' = entrega de documentación: exige checklist del dibujante y
-- aprobación de una segunda persona (Noreste_Modificaciones_Web_v1.pdf, pregunta 18).
-- ---------------------------------------------------------------------------
create table public.tareas (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid references public.obras (id) on delete cascade,  -- null: tarea general del estudio
  titulo text not null,
  descripcion text,
  tipo text not null default 'general' check (tipo in ('general', 'entrega')),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'en_curso', 'en_revision', 'completada')),
  responsable_id uuid references public.staff (id) on delete set null,
  fecha date,                                   -- para cuándo; define la semana en el tablero

  -- cierre de entregas
  revisor_id uuid references public.staff (id) on delete set null,
  checklist jsonb not null default '{}'::jsonb, -- { "<id del ítem>": true }
  horas_reales numeric(6, 2),
  evidencia text,                               -- link o referencia al archivo final
  comentario_cierre text,                       -- lo hecho, lo pendiente, dudas abiertas
  aprobada_por uuid references public.staff (id) on delete set null,
  aprobada_at timestamptz,

  completada_at timestamptz,
  completada_por uuid references public.staff (id) on delete set null,
  created_by uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Una entrega solo se completa con la aprobación de otra persona (no el responsable).
  constraint entrega_aprobada check (
    tipo <> 'entrega' or estado <> 'completada'
    or (aprobada_por is not null and aprobada_por is distinct from responsable_id)
  )
);

create index tareas_obra_id_idx on public.tareas (obra_id);
create index tareas_responsable_id_idx on public.tareas (responsable_id);
create index tareas_revisor_id_idx on public.tareas (revisor_id);
create index tareas_abiertas_fecha_idx on public.tareas (fecha) where estado <> 'completada';

create trigger tareas_updated_at
  before update on public.tareas
  for each row execute function public.set_updated_at();

-- Historial: queda registrado quién hizo qué (cambios de estado, revisión, cierre).
create table public.tarea_eventos (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas (id) on delete cascade,
  actor_id uuid references public.staff (id) on delete set null,
  tipo text not null check (tipo in ('creada', 'estado', 'enviada_revision', 'aprobada', 'devuelta', 'comentario')),
  detalle text,
  created_at timestamptz not null default now()
);

create index tarea_eventos_tarea_id_idx on public.tarea_eventos (tarea_id, created_at);

alter table public.tareas enable row level security;
alter table public.tarea_eventos enable row level security;

create policy "staff gestiona tareas" on public.tareas
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- El historial no se edita ni se borra (salvo en cascada con la tarea).
create policy "staff lee historial" on public.tarea_eventos
  for select to authenticated using ((select public.is_staff()));
create policy "staff registra historial" on public.tarea_eventos
  for insert to authenticated
  with check ((select public.is_staff()) and actor_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Archivos de obra (Supabase Storage, bucket privado)
-- Ruta del objeto: <obra_id>/<uuid>-<nombre>. Acceso solo del estudio, con
-- links firmados de corta duración.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('obra-archivos', 'obra-archivos', false, 52428800)  -- 50 MB (límite del plan gratis)
on conflict (id) do nothing;

create policy "staff lee archivos de obra" on storage.objects
  for select to authenticated
  using (bucket_id = 'obra-archivos' and (select public.is_staff()));
create policy "staff sube archivos de obra" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'obra-archivos' and (select public.is_staff()));
create policy "staff borra archivos de obra" on storage.objects
  for delete to authenticated
  using (bucket_id = 'obra-archivos' and (select public.is_staff()));

create table public.archivos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras (id) on delete cascade,
  categoria text not null,
  nombre text not null,
  storage_path text not null unique,
  tamano bigint,
  mime text,
  subido_por uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now()
);

create index archivos_obra_id_idx on public.archivos (obra_id, created_at desc);

alter table public.archivos enable row level security;

create policy "staff gestiona archivos" on public.archivos
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
