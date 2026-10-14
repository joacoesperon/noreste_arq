-- Datos del estudio para los documentos (firmantes con DNI, teléfonos, redes).
-- Van en la base y no en el código porque el repositorio es público.
create table public.estudio_config (
  id boolean primary key default true check (id),   -- una sola fila
  datos jsonb not null default '{}'::jsonb,
  updated_by uuid references public.staff (id) on delete set null,
  updated_at timestamptz not null default now()
);

create trigger estudio_config_updated_at
  before update on public.estudio_config
  for each row execute function public.set_updated_at();

alter table public.estudio_config enable row level security;

create policy "staff gestiona datos del estudio" on public.estudio_config
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

insert into public.estudio_config (id) values (true) on conflict do nothing;

-- Qué incluye cada etapa del cronograma (como en el cronograma de Casa Tots).
alter table public.cronograma_etapas add column detalle text;

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
      coalesce((x.v->>'clave')::boolean, false) as clave,
      nullif(trim(x.v->>'detalle'), '') as detalle
    from jsonb_array_elements(p_etapas) with ordinality as x(v, ord)
  loop
    insert into public.cronograma_etapas (id, cronograma_id, orden, nombre, inicio, fin, clave, detalle)
    values (e.id, v_cronograma_id, e.orden, e.nombre, e.inicio, e.fin, e.clave, e.detalle)
    on conflict (id) do update
      set orden = excluded.orden, nombre = excluded.nombre, inicio = excluded.inicio,
          fin = excluded.fin, clave = excluded.clave, detalle = excluded.detalle
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
