-- Seguimiento de gastos de obra (como la planilla de Casa Tots): pagos a gremios,
-- corralón y trámites, en pesos o dólares con la cotización del día.

-- Gremios y contratistas de cada obra, con el monto acordado para ver el saldo.
create table public.obra_gremios (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras (id) on delete cascade,
  nombre text not null,
  rubro text,
  monto_acordado numeric(16, 2) check (monto_acordado is null or monto_acordado >= 0),
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  notas text,
  created_at timestamptz not null default now()
);

create index obra_gremios_obra_idx on public.obra_gremios (obra_id);

create table public.obra_gastos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras (id) on delete cascade,
  fecha date not null,
  rubro text not null,
  detalle text,
  gremio_id uuid references public.obra_gremios (id) on delete set null,
  monto numeric(16, 2) not null check (monto > 0),
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  -- Pesos por dólar el día del pago (para pasar de una moneda a la otra).
  cotizacion numeric(12, 2) check (cotizacion is null or cotizacion > 0),
  -- false = gasto previsto, todavía sin pagar.
  pagado boolean not null default true,
  sin_recibo boolean not null default false,
  created_by uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index obra_gastos_obra_fecha_idx on public.obra_gastos (obra_id, fecha);
create index obra_gastos_gremio_idx on public.obra_gastos (gremio_id);

create trigger obra_gastos_updated_at
  before update on public.obra_gastos
  for each row execute function public.set_updated_at();

alter table public.obra_gremios enable row level security;
alter table public.obra_gastos enable row level security;

create policy "staff gestiona gremios de obra" on public.obra_gremios
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff gestiona gastos de obra" on public.obra_gastos
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- Tabla de honorarios del estudio (porcentajes por superficie y reparto proyecto/dirección).
-- null = se usan los valores por defecto del código (planilla «NE - CAJA»).
alter table public.estudio_config add column honorarios jsonb;
