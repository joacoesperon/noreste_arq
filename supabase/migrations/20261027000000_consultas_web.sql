-- Consultas del formulario «Cotizá tu proyecto» de la home. El visitante termina en WhatsApp
-- con Josefina; la consulta queda guardada acá para no depender solo del chat.
-- Las inserta una server action del sitio con la service role (el visitante no tiene sesión).

create table public.consultas_web (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text check (char_length(nombre) <= 120),
  tipo text not null check (char_length(tipo) <= 200),
  ubicacion text check (char_length(ubicacion) <= 200),
  servicio text check (char_length(servicio) <= 200),
  presupuesto text check (char_length(presupuesto) <= 200),
  etapa text check (char_length(etapa) <= 200),
  plazo text check (char_length(plazo) <= 200),
  atendida boolean not null default false
);

create index consultas_web_created_at_idx on public.consultas_web (created_at desc);

alter table public.consultas_web enable row level security;

create policy "staff gestiona consultas web" on public.consultas_web
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

select public.aplicar_solo_lectura();
