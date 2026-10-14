// Semanas de lunes a domingo, en hora de Buenos Aires.
const TZ = "America/Argentina/Buenos_Aires";

/** Fecha de hoy en Buenos Aires como `YYYY-MM-DD`. */
export function hoyAR(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function sumarDias(fecha: string, dias: number) {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Lunes de la semana de `fecha`. */
export function lunesDe(fecha: string) {
  const dow = new Date(`${fecha}T00:00:00Z`).getUTCDay(); // 0 = domingo
  return sumarDias(fecha, dow === 0 ? -6 : 1 - dow);
}

export type Semanas = {
  hoy: string;
  /** Lunes y domingo de la semana actual */
  actual: { desde: string; hasta: string };
  proxima: { desde: string; hasta: string };
};

export function semanas(now = new Date()): Semanas {
  const hoy = hoyAR(now);
  const lunes = lunesDe(hoy);
  return {
    hoy,
    actual: { desde: lunes, hasta: sumarDias(lunes, 6) },
    proxima: { desde: sumarDias(lunes, 7), hasta: sumarDias(lunes, 13) },
  };
}

export type Columna = "actual" | "proxima" | "despues";

/** Columna del tablero para una tarea abierta. Lo vencido y lo sin fecha cuentan como semana actual / después. */
export function columnaDe(fecha: string | null, s: Semanas): Columna {
  if (!fecha) return "despues";
  if (fecha <= s.actual.hasta) return "actual";
  if (fecha <= s.proxima.hasta) return "proxima";
  return "despues";
}

const diaFormat = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export function formatDia(fecha: string) {
  return diaFormat.format(new Date(`${fecha}T00:00:00Z`));
}
