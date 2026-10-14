-- Base: tabla de obras publicadas en la web, tal como existe en producción
-- (creada a mano antes de usar migraciones; esquema leído de producción el 2026-10-14).
-- En producción esta migración se marca como aplicada sin ejecutarse.

create sequence if not exists public.projects_order_seq;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  m2 double precision,
  status text check (status = any (array['Construido', 'Proyecto', 'En obra'])),
  year integer,
  location text,
  credits jsonb,
  images text[],
  videos text[],
  cover text,
  visible boolean default true,
  "order" integer not null default nextval('public.projects_order_seq'),
  created_at timestamptz not null default timezone('utc', now())
);

alter sequence public.projects_order_seq owned by public.projects."order";
