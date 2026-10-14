-- Etapa 2 (parte) · Cronogramas de proyecto y de obra
-- Etapas acordadas en la pregunta 10; duraciones definidas por obra.
-- Las etapas marcadas como fecha clave aparecen como tareas en el tablero.

create table public.cronogramas (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras (id) on delete cascade,
  tipo text not null check (tipo in ('proyecto', 'obra')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (obra_id, tipo)
);

create trigger cronogramas_updated_at
  before update on public.cronogramas
  for each row execute function public.set_updated_at();

create table public.cronograma_etapas (
  id uuid primary key default gen_random_uuid(),
  cronograma_id uuid not null references public.cronogramas (id) on delete cascade,
  orden smallint not null default 0,
  nombre text not null,
  inicio date not null,
  fin date not null,
  clave boolean not null default false,
  check (fin >= inicio)
);

create index cronograma_etapas_cronograma_id_idx on public.cronograma_etapas (cronograma_id, orden);

-- Tarea generada por una fecha clave del cronograma.
alter table public.tareas
  add column cronograma_etapa_id uuid references public.cronograma_etapas (id) on delete set null;
create unique index tareas_cronograma_etapa_id_key on public.tareas (cronograma_etapa_id)
  where cronograma_etapa_id is not null;

alter table public.cronogramas enable row level security;
alter table public.cronograma_etapas enable row level security;

create policy "staff gestiona cronogramas" on public.cronogramas
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff gestiona etapas de cronograma" on public.cronograma_etapas
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- Guarda un cronograma completo de forma atómica y sincroniza las tareas de sus
-- fechas clave. p_etapas: [{ id?, nombre, inicio, fin, clave }] en orden.
-- Las etapas existentes conservan su id (y su tarea vinculada).
create or replace function public.guardar_cronograma(p_obra_id uuid, p_tipo text, p_etapas jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_cronograma_id uuid;
  v_etiqueta text := case p_tipo when 'proyecto' then 'proyecto' else 'obra' end;
  e record;
  v_tarea_id uuid;
begin
  insert into public.cronogramas (obra_id, tipo)
  values (p_obra_id, p_tipo)
  on conflict (obra_id, tipo) do update set updated_at = now()
  returning id into v_cronograma_id;

  -- Etapas que se quitaron: borrar sus tareas abiertas y luego la etapa.
  delete from public.tareas t
  using public.cronograma_etapas ce
  where t.cronograma_etapa_id = ce.id
    and ce.cronograma_id = v_cronograma_id
    and t.estado <> 'completada'
    and ce.id not in (
      select (x->>'id')::uuid from jsonb_array_elements(p_etapas) x where x->>'id' is not null
    );
  delete from public.cronograma_etapas ce
  where ce.cronograma_id = v_cronograma_id
    and ce.id not in (
      select (x->>'id')::uuid from jsonb_array_elements(p_etapas) x where x->>'id' is not null
    );

  for e in
    select
      coalesce((x.v->>'id')::uuid, gen_random_uuid()) as id,
      (x.ord - 1)::smallint as orden,
      x.v->>'nombre' as nombre,
      (x.v->>'inicio')::date as inicio,
      (x.v->>'fin')::date as fin,
      coalesce((x.v->>'clave')::boolean, false) as clave
    from jsonb_array_elements(p_etapas) with ordinality as x(v, ord)
  loop
    insert into public.cronograma_etapas (id, cronograma_id, orden, nombre, inicio, fin, clave)
    values (e.id, v_cronograma_id, e.orden, e.nombre, e.inicio, e.fin, e.clave)
    on conflict (id) do update
      set orden = excluded.orden, nombre = excluded.nombre, inicio = excluded.inicio,
          fin = excluded.fin, clave = excluded.clave
      where public.cronograma_etapas.cronograma_id = v_cronograma_id;

    if e.clave then
      select id into v_tarea_id from public.tareas where cronograma_etapa_id = e.id;
      if v_tarea_id is null then
        insert into public.tareas (obra_id, titulo, descripcion, fecha, cronograma_etapa_id, created_by)
        values (p_obra_id, e.nombre, 'Fecha clave del cronograma de ' || v_etiqueta || '.', e.fin, e.id, (select auth.uid()))
        returning id into v_tarea_id;
        insert into public.tarea_eventos (tarea_id, actor_id, tipo, detalle)
        values (v_tarea_id, (select auth.uid()), 'creada', 'Desde el cronograma de ' || v_etiqueta);
      else
        update public.tareas
        set titulo = e.nombre, fecha = e.fin
        where id = v_tarea_id and estado <> 'completada';
      end if;
    else
      delete from public.tareas where cronograma_etapa_id = e.id and estado <> 'completada';
    end if;
  end loop;

  return v_cronograma_id;
end;
$$;

revoke execute on function public.guardar_cronograma(uuid, text, jsonb) from public, anon;
grant execute on function public.guardar_cronograma(uuid, text, jsonb) to authenticated;
