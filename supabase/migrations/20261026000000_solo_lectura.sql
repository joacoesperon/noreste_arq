-- Usuarios de solo lectura (para mostrar el panel a otros estudios): ven todo, no modifican nada.
-- Se resuelve en la base: aunque la app intente escribir, la base lo rechaza.
-- - Trigger por sentencia (BEFORE INSERT/UPDATE/DELETE): corta con un error. Hace falta porque
--   un UPDATE o DELETE filtrado por RLS no da error, solo afecta 0 filas, y la app creería que guardó.
-- - Políticas RESTRICTIVE (se combinan con AND con las de staff), como segunda barrera.

alter table public.staff drop constraint if exists staff_rol_check;
alter table public.staff add constraint staff_rol_check check (rol in ('admin', 'miembro', 'lectura'));

-- true salvo para usuarios de solo lectura (security definer: lee staff sin pasar por RLS).
create or replace function public.puede_editar()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.staff where id = (select auth.uid()) and rol = 'lectura'
  );
$$;

create or replace function public.bloquear_solo_lectura()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.puede_editar() then
    raise exception 'Usuario de solo lectura: no puede modificar datos' using errcode = '42501';
  end if;
  return null;
end;
$$;

-- Aplica el trigger y las políticas restrictivas a todas las tablas con RLS del esquema public.
-- Volver a llamarla en las migraciones que agreguen tablas.
create or replace function public.aplicar_solo_lectura()
returns void
language plpgsql
set search_path = ''
as $$
declare
  t record;
  op text;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  loop
    execute format('drop trigger if exists solo_lectura on public.%I', t.relname);
    execute format(
      'create trigger solo_lectura before insert or update or delete on public.%I for each statement execute function public.bloquear_solo_lectura()',
      t.relname);
    foreach op in array array['insert', 'update', 'delete'] loop
      execute format('drop policy if exists %I on public.%I', 'solo lectura: ' || op, t.relname);
      if op = 'insert' then
        execute format(
          'create policy %I on public.%I as restrictive for insert to authenticated with check ((select public.puede_editar()))',
          'solo lectura: ' || op, t.relname);
      else
        execute format(
          'create policy %I on public.%I as restrictive for %s to authenticated using ((select public.puede_editar()))',
          'solo lectura: ' || op, t.relname, op);
      end if;
    end loop;
  end loop;
end;
$$;

select public.aplicar_solo_lectura();

-- Archivos de obra (Storage): tampoco suben ni borran.
drop policy if exists "solo lectura: insert" on storage.objects;
drop policy if exists "solo lectura: update" on storage.objects;
drop policy if exists "solo lectura: delete" on storage.objects;
create policy "solo lectura: insert" on storage.objects as restrictive for insert to authenticated
  with check ((select public.puede_editar()));
create policy "solo lectura: update" on storage.objects as restrictive for update to authenticated
  using ((select public.puede_editar()));
create policy "solo lectura: delete" on storage.objects as restrictive for delete to authenticated
  using ((select public.puede_editar()));
