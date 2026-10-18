-- Avance de las etapas del cronograma: cada línea de «qué incluye» (detalle) es un ítem que se
-- tilda al terminarlo. Se guardan los textos tildados; el % de la etapa = tildados / ítems.
-- Si una línea se edita, deja de contar como tildada (el texto ya no coincide).

alter table public.cronograma_etapas add column completados text[] not null default '{}';

create or replace function public.marcar_item_etapa(p_etapa_id uuid, p_item text, p_hecho boolean)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.cronograma_etapas
  set completados = case
    when p_hecho then array_append(array_remove(completados, p_item), p_item)
    else array_remove(completados, p_item)
  end
  where id = p_etapa_id;
$$;
