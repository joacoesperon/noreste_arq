-- Etapa 0 · Usuarios del estudio y seguridad
-- Ejecutar en Supabase → SQL Editor ANTES de desplegar el código de esta etapa.

-- ---------------------------------------------------------------------------
-- Personas del estudio con acceso al panel.
-- Las cuentas se crean en Authentication → Users y después se dan de alta acá.
-- ---------------------------------------------------------------------------
create table if not exists public.staff (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  email text not null unique,
  rol text not null default 'miembro' check (rol in ('admin', 'miembro')),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.staff enable row level security;

-- security definer: evita la recursión de RLS al consultar staff desde sus propias políticas.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff
    where id = (select auth.uid()) and activo
  );
$$;

drop policy if exists "staff ve al equipo" on public.staff;
create policy "staff ve al equipo"
  on public.staff for select
  to authenticated
  using ((select public.is_staff()));
-- Sin políticas de escritura: el alta/baja de personas se hace desde el dashboard.

-- ---------------------------------------------------------------------------
-- projects (obras publicadas en la web)
-- Hasta ahora se escribía con la anon key, que es pública. Se eliminan las
-- políticas existentes y solo el staff puede escribir.
-- ---------------------------------------------------------------------------
alter table public.projects enable row level security;

do $$
declare
  p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'projects'
  loop
    execute format('drop policy %I on public.projects', p.policyname);
  end loop;
end
$$;

revoke insert, update, delete, truncate on public.projects from anon;

create policy "lectura pública de obras visibles"
  on public.projects for select
  to anon, authenticated
  using (visible = true);

create policy "staff lee todas las obras"
  on public.projects for select
  to authenticated
  using ((select public.is_staff()));

create policy "staff crea obras"
  on public.projects for insert
  to authenticated
  with check ((select public.is_staff()));

create policy "staff edita obras"
  on public.projects for update
  to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy "staff borra obras"
  on public.projects for delete
  to authenticated
  using ((select public.is_staff()));

-- ---------------------------------------------------------------------------
-- Alta de las personas del estudio: scripts/crear-usuario.mjs
-- ---------------------------------------------------------------------------
