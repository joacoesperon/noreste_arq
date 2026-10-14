import { Diamond } from "lucide-react";
import { diasEntre, semanasDe, sumarDias } from "@/lib/cronogramas/fechas";
import { cn } from "@/lib/utils";

export type EtapaGantt = { id?: string; nombre: string; inicio: string; fin: string; clave: boolean; detalle?: string | null };

const mesFormat = new Intl.DateTimeFormat("es-AR", { month: "short", timeZone: "UTC" });
const mesAnioFormat = new Intl.DateTimeFormat("es-AR", { month: "short", year: "2-digit", timeZone: "UTC" });
const diaFormat = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });

const fmt = (f: string) => diaFormat.format(new Date(`${f}T00:00:00Z`));

/** Primer día de cada mes dentro del rango. */
function meses(desde: string, hasta: string) {
  const out: string[] = [];
  const d = new Date(`${desde.slice(0, 7)}-01T00:00:00Z`);
  while (d.toISOString().slice(0, 10) <= hasta) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}

/** Diagrama de barras por mes. Solo lectura: se edita en la tabla. */
export function Gantt({ etapas, hoy }: { etapas: EtapaGantt[]; hoy: string }) {
  if (etapas.length === 0) return null;

  const desde = etapas.reduce((m, e) => (e.inicio < m ? e.inicio : m), etapas[0].inicio);
  const hasta = etapas.reduce((m, e) => (e.fin > m ? e.fin : m), etapas[0].fin);
  // Rango completo de meses, para que las grillas coincidan con el encabezado.
  const inicioRango = `${desde.slice(0, 7)}-01`;
  const ultimoMes = meses(desde, hasta).at(-1)!;
  const finRango = sumarDias(
    new Date(Date.UTC(+ultimoMes.slice(0, 4), +ultimoMes.slice(5, 7), 1)).toISOString().slice(0, 10),
    -1
  );
  const total = diasEntre(inicioRango, finRango) + 1;
  const pos = (f: string) => (diasEntre(inicioRango, f) / total) * 100;
  const listaMeses = meses(inicioRango, finRango);
  const variosAnios = inicioRango.slice(0, 4) !== finRango.slice(0, 4);
  const hoyVisible = hoy >= inicioRango && hoy <= finRango;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        {/* Encabezado de meses */}
        <div className="grid grid-cols-[minmax(12rem,16rem)_1fr] border-b text-xs text-muted-foreground">
          <div className="py-2 pr-3">Etapa</div>
          <div className="relative h-8">
            {listaMeses.map((m) => (
              <span
                key={m}
                className="absolute top-2 border-l pl-1"
                style={{ left: `${pos(m)}%` }}
              >
                {(variosAnios ? mesAnioFormat : mesFormat).format(new Date(`${m}T00:00:00Z`))}
              </span>
            ))}
          </div>
        </div>

        {etapas.map((e, i) => {
          const hito = e.inicio === e.fin;
          const left = pos(e.inicio);
          const width = Math.max(((diasEntre(e.inicio, e.fin) + 1) / total) * 100, 0.6);
          const semanas = semanasDe(e.inicio, e.fin);
          const titulo = hito
            ? `${e.nombre}: ${fmt(e.inicio)}`
            : `${e.nombre}: ${fmt(e.inicio)} → ${fmt(e.fin)} (${semanas.toLocaleString("es-AR")} sem.)`;
          return (
            <div key={e.id ?? i} className="grid grid-cols-[minmax(12rem,16rem)_1fr] border-b last:border-0">
              <div className="flex items-center gap-1.5 py-2 pr-3 text-sm">
                <span className="line-clamp-2">{e.nombre}</span>
                {e.clave && <Diamond className="size-3 shrink-0 fill-current text-amber-500" aria-label="Fecha clave" />}
              </div>
              <div className="relative">
                {listaMeses.map((m) => (
                  <span key={m} className="absolute inset-y-0 border-l border-dashed" style={{ left: `${pos(m)}%` }} />
                ))}
                {hoyVisible && (
                  <span className="absolute inset-y-0 z-10 border-l-2 border-destructive/70" style={{ left: `${pos(hoy)}%` }} />
                )}
                {hito ? (
                  <span
                    className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${left}%` }}
                    title={titulo}
                  >
                    <Diamond className="size-4 fill-amber-500 text-amber-600" aria-label={titulo} />
                  </span>
                ) : (
                  <div
                    className={cn(
                      "absolute top-1/2 h-5 -translate-y-1/2 rounded-sm",
                      e.clave ? "bg-amber-500/80" : "bg-primary/80"
                    )}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={titulo}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
