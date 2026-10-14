-- Links del visor 3D para clientes (pregunta 13): acceso al preview de un modelo IFC
-- sin entrar al panel. Los archivos internos siguen siendo exclusivos del estudio.
--
-- Al crear el link, el panel genera un link firmado de Storage con la misma vigencia
-- y lo guarda acá; la página pública lo obtiene con visor_compartido(token).
-- Revocar (borrar la fila) corta el acceso a la página; el link firmado en sí vence solo.

create table public.visor_links (
  id uuid primary key default gen_random_uuid(),
  archivo_id uuid not null references public.archivos (id) on delete cascade,
  token text not null unique
    default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  signed_url text not null,
  expires_at timestamptz not null,
  created_by uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now()
);

create index visor_links_archivo_id_idx on public.visor_links (archivo_id);

alter table public.visor_links enable row level security;

create policy "staff gestiona links del visor" on public.visor_links
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- Única puerta de entrada pública: devuelve el modelo solo si el token existe y no venció.
create or replace function public.visor_compartido(p_token text)
returns table (nombre text, obra text, signed_url text, expires_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select a.nombre, o.titulo, l.signed_url, l.expires_at
  from public.visor_links l
  join public.archivos a on a.id = l.archivo_id
  join public.obras o on o.id = a.obra_id
  where l.token = p_token and l.expires_at > now();
$$;

revoke execute on function public.visor_compartido(text) from public;
grant execute on function public.visor_compartido(text) to anon, authenticated;
