-- Portal del cliente: un link por obra para que el cliente vea, sin entrar al panel y sin
-- poder modificar nada, el resumen de la obra, el cronograma con su avance, los pagos
-- previstos de las próximas semanas y el modelo 3D con los planos.
-- La página pública (/cliente/[token]) lee con la service role del lado del servidor:
-- el visitante no tiene sesión ni acceso directo a ninguna tabla.
-- Revocar = borrar la fila: el acceso se corta en el momento.

create table public.obra_links (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras (id) on delete cascade,
  token text not null unique
    default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  expires_at timestamptz,   -- null = sin vencimiento
  created_by uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now()
);

create index obra_links_obra_id_idx on public.obra_links (obra_id);

alter table public.obra_links enable row level security;

create policy "staff gestiona links de obra" on public.obra_links
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

select public.aplicar_solo_lectura();
