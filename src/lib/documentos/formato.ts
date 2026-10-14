export type Moneda = "ARS" | "USD";

export const MONEDAS: { value: Moneda; label: string }[] = [
  { value: "ARS", label: "Pesos (ARS)" },
  { value: "USD", label: "Dólares (USD)" },
];

export function formatMonto(valor: number, moneda: Moneda = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(valor);
}

const fechaLarga = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const fechaCorta = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

/** `YYYY-MM-DD` → «14 de octubre de 2026». */
export function formatFechaLarga(fecha: string) {
  return fechaLarga.format(new Date(`${fecha}T00:00:00Z`));
}

export function formatFechaCorta(fecha: string) {
  return fechaCorta.format(new Date(`${fecha}T00:00:00Z`));
}

/**
 * Número escrito a la argentina o no: "1.250.000,50", "1.250.000", "1250000.5", "1250".
 * Con coma, los puntos son de miles. Sin coma, puntos seguidos de grupos de 3 dígitos también.
 */
export function parseNumero(valor: string): number | null {
  let v = valor.trim().replace(/[^\d.,-]/g, "");
  if (!v) return null;
  if (v.includes(",")) v = v.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, "");
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export const parseMonto = parseNumero;
