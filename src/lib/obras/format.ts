const fechaFormat = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
const mesFormat = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });

/** Fechas `YYYY-MM-DD` de la base (sin hora): se formatean en UTC para no correrse un día. */
export function formatFecha(value: string | null) {
  return value ? fechaFormat.format(new Date(`${value}T00:00:00Z`)) : null;
}

/** Mes estimado de finalización: inicio + duración en meses. */
export function finEstimado(inicio: string | null, meses: number | null) {
  if (!inicio || !meses) return null;
  const d = new Date(`${inicio}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + Math.round(meses));
  return mesFormat.format(d);
}

export function formatMeses(meses: number | null) {
  if (!meses) return null;
  const n = Number(meses);
  return `${n.toLocaleString("es-AR")} ${n === 1 ? "mes" : "meses"}`;
}
