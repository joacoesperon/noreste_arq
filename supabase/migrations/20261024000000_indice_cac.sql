-- Índice del costo de la construcción de la Cámara Argentina de la Construcción (pregunta 8).
-- Se carga a mano cada mes (no hay una fuente automática confiable); con él se actualizan
-- los montos de los presupuestos desde su mes base.
create table public.indices_cac (
  mes date primary key check (extract(day from mes) = 1),   -- primer día del mes
  valor numeric(12, 2) not null check (valor > 0),
  created_by uuid references public.staff (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.indices_cac enable row level security;

create policy "staff gestiona índice CAC" on public.indices_cac
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

-- Mes base del presupuesto para actualizarlo por CAC
alter table public.presupuestos add column cac_base date;
