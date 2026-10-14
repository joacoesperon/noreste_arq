-- Recordatorio mensual a proveedores para pedir la lista de precios actualizada (pregunta 14:
-- por WhatsApp y correo, una vez por mes). El correo lo manda un cron; WhatsApp es un botón
-- con el mensaje armado (el envío automático por WhatsApp es pago).
alter table public.proveedores
  add column recordatorio boolean not null default true,
  add column ultimo_recordatorio timestamptz;
