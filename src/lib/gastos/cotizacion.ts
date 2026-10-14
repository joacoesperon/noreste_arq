import "server-only";
import { hoyAR } from "@/lib/tareas/semanas";

// Dólar blue, precio de compra (lo que se recibe en pesos al cambiar dólares para pagar).
// Histórico: ArgentinaDatos; el día de hoy puede no estar todavía, así que se usa DolarAPI.
const CASA = "blue";

type Respuesta = { compra?: number };

async function pedir(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const json = (await res.json()) as Respuesta;
    return typeof json.compra === "number" && json.compra > 0 ? json.compra : null;
  } catch {
    return null;
  }
}

/** Pesos por dólar en una fecha (`YYYY-MM-DD`). Si ese día no hubo cotización (feriado), busca hasta 5 días antes. */
export async function cotizacionDolar(fecha: string): Promise<number | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;
  const hoy = hoyAR();
  if (fecha >= hoy) return pedir(`https://dolarapi.com/v1/dolares/${CASA}`);
  const d = new Date(`${fecha}T00:00:00Z`);
  for (let i = 0; i < 6; i++) {
    const [a, m, dia] = d.toISOString().slice(0, 10).split("-");
    const valor = await pedir(`https://api.argentinadatos.com/v1/cotizaciones/dolares/${CASA}/${a}/${m}/${dia}`);
    if (valor) return valor;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return null;
}
