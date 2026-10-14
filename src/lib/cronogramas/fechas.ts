// Fechas `YYYY-MM-DD` sin hora (se operan en UTC para no correrse por zona horaria).

export function sumarDias(fecha: string, dias: number) {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function diasEntre(desde: string, hasta: string) {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000);
}

/** Duración en semanas de una etapa (0 = hito de un día). */
export function semanasDe(inicio: string, fin: string) {
  const dias = diasEntre(inicio, fin);
  return dias === 0 ? 0 : Math.round(((dias + 1) / 7) * 10) / 10;
}

/** Fin de una etapa que empieza en `inicio` y dura `semanas` (0 = hito). */
export function finDe(inicio: string, semanas: number) {
  return semanas <= 0 ? inicio : sumarDias(inicio, Math.max(Math.round(semanas * 7) - 1, 0));
}

/** Próximo lunes (o hoy si es lunes), en hora de Buenos Aires. */
export function proximoLunes(hoy: string) {
  const dow = new Date(`${hoy}T00:00:00Z`).getUTCDay();
  return sumarDias(hoy, dow === 1 ? 0 : (8 - dow) % 7);
}
