-- Ingreso con nombre de usuario en lugar de correo.
-- Supabase Auth trabaja con correos: cada usuario tiene uno interno
-- `<usuario>@usuarios.norestearq.com` (ver src/lib/usernames.ts).
-- `staff.email` pasa a ser el correo de contacto real (notificaciones), opcional.

alter table public.staff add column if not exists usuario text;

update public.staff
set usuario = split_part(email, '@', 1)
where usuario is null;

alter table public.staff
  alter column usuario set not null,
  alter column email drop not null;

alter table public.staff
  drop constraint if exists staff_usuario_key,
  add constraint staff_usuario_key unique (usuario),
  drop constraint if exists staff_usuario_formato,
  add constraint staff_usuario_formato check (usuario ~ '^[a-z0-9._-]+$');
