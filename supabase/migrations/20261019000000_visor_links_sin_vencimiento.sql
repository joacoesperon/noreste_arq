-- Links del visor: pueden no vencer (expires_at null) y la revocación es inmediata.
-- La página pública ya no usa un link firmado guardado: el servidor genera uno nuevo
-- y corto en cada visita con la service role (src/lib/supabase/admin.ts), así que
-- se elimina la función pública visor_compartido y la columna signed_url.

drop function if exists public.visor_compartido(text);

alter table public.visor_links
  drop column if exists signed_url,
  alter column expires_at drop not null;

comment on column public.visor_links.expires_at is 'null = sin vencimiento';
