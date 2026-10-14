"use client";

import { useMemo, useState, useTransition } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { importarGastos } from "@/app/admin/(panel)/obras/gastos-actions";
import { formatMonto, parseNumero, type Moneda } from "@/lib/documentos/formato";
import { leerTabla } from "@/lib/presupuestador/leer-tabla";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adivinarMapeo, MapeoColumnas } from "../presupuestador/mapeo-columnas";

const ROLES = [
  { key: "fecha", label: "Fecha", obligatorio: true },
  { key: "rubro", label: "Concepto o rubro", obligatorio: true },
  { key: "monto", label: "Monto", obligatorio: true },
  { key: "detalle", label: "Detalle" },
  { key: "cotizacion", label: "Dólar del día" },
  { key: "estado", label: "Estado" },
];

/** «2025-11-20», «20/11/2025», «20-11-25» o el número de serie de Excel (45981). */
function parseFecha(v: string): string | null {
  const t = v.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
  if (m) {
    const anio = m[3].length === 2 ? `20${m[3]}` : m[3];
    const f = `${anio}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    return Number.isNaN(Date.parse(f)) ? null : f;
  }
  if (/^\d{5}(\.0+)?$/.test(t)) {
    const serie = Number(t);
    if (serie > 30000 && serie < 80000) return new Date(Date.UTC(1899, 11, 30) + serie * 86400000).toISOString().slice(0, 10);
  }
  return null;
}

type Fila = { fecha: string; rubro: string; detalle: string | null; monto: number; moneda: Moneda; cotizacion: number | null; pagado: boolean };

export function ImportarGastos({ obraId, onClose }: { obraId: string; onClose: () => void }) {
  const [archivo, setArchivo] = useState<string | null>(null);
  const [tabla, setTabla] = useState<string[][] | null>(null);
  const [mapeo, setMapeo] = useState<Record<string, number>>({});
  const [encabezado, setEncabezado] = useState(true);
  const [moneda, setMoneda] = useState<Moneda>("ARS");
  const [leyendo, setLeyendo] = useState(false);
  const [pending, startTransition] = useTransition();

  // Las filas de subtotal o vacías (sin fecha o sin monto) se saltean.
  const filas = useMemo<Fila[]>(() => {
    if (!tabla || [mapeo.fecha, mapeo.rubro, mapeo.monto].some((i) => i === undefined || i < 0)) return [];
    const col = (f: string[], k: string) => (mapeo[k] !== undefined && mapeo[k] >= 0 ? (f[mapeo[k]] ?? "").trim() : "");
    return tabla.slice(encabezado ? 1 : 0).flatMap((f) => {
      const fecha = parseFecha(col(f, "fecha"));
      const monto = parseNumero(col(f, "monto"));
      const rubro = col(f, "rubro");
      if (!fecha || !monto || monto <= 0 || !rubro) return [];
      const cot = parseNumero(col(f, "cotizacion"));
      return [
        {
          fecha,
          rubro: rubro.slice(0, 100),
          detalle: col(f, "detalle").slice(0, 500) || null,
          monto,
          moneda,
          cotizacion: cot && cot > 0 ? cot : null,
          pagado: !/pend|falta|previst|a pagar/i.test(col(f, "estado")),
        },
      ];
    });
  }, [tabla, mapeo, encabezado, moneda]);
  const total = filas.reduce((a, f) => a + f.monto, 0);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar gastos de una planilla</DialogTitle>
          <DialogDescription>
            Excel (.xlsx) o .csv con una fila por pago. Las filas de subtotal y las que no tienen fecha o monto se saltean. Si no hay
            columna de dólar, se completa con el de cada fecha.
          </DialogDescription>
        </DialogHeader>
        {!tabla ? (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-sm text-muted-foreground hover:bg-muted/40">
            {leyendo ? <Loader2 className="size-5 animate-spin" /> : <FileUp className="size-5" />}
            {leyendo ? "Leyendo…" : "Elegir archivo"}
            <input
              type="file"
              accept=".xlsx,.csv,.txt"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setLeyendo(true);
                try {
                  const t = await leerTabla(file);
                  if (t.length === 0) throw new Error("El archivo está vacío.");
                  setArchivo(file.name);
                  setTabla(t);
                  setMapeo(
                    adivinarMapeo(t, {
                      fecha: /fecha|dia/,
                      rubro: /concepto|rubro|gremio|categoria/,
                      monto: /monto|importe|\$|total|pago/,
                      detalle: /detalle|descrip|observ/,
                      cotizacion: /cotiz|dolar del dia|tipo de cambio/,
                      estado: /estado/,
                    })
                  );
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "No se pudo leer el archivo.");
                } finally {
                  setLeyendo(false);
                }
              }}
            />
          </label>
        ) : (
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <p className="text-sm">
                <span className="font-medium">{archivo}</span>
                <Button variant="link" size="sm" className="ml-2 h-auto p-0" onClick={() => setTabla(null)}>
                  Cambiar
                </Button>
              </p>
              <div className="flex flex-col gap-2">
                <Label>Los montos están en</Label>
                <Select value={moneda} onValueChange={(v) => setMoneda(v as Moneda)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">Pesos</SelectItem>
                    <SelectItem value="USD">Dólares</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <MapeoColumnas filas={tabla} roles={ROLES} mapeo={mapeo} onMapeo={setMapeo} encabezado={encabezado} onEncabezado={setEncabezado} />
          </div>
        )}
        <DialogFooter className="items-center gap-3">
          {tabla && (
            <p className="mr-auto text-sm text-muted-foreground">
              {filas.length} gastos · total {formatMonto(total, moneda)}
            </p>
          )}
          <Button
            disabled={pending || filas.length === 0}
            onClick={() =>
              startTransition(async () => {
                const res = await importarGastos({ obra_id: obraId, filas });
                if (!res.ok) return void toast.error(res.error);
                toast.success(`${res.cantidad} gastos importados`);
                onClose();
              })
            }
          >
            {pending ? "Importando…" : `Importar ${filas.length || ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
