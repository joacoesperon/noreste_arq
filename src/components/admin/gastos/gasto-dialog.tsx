"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cotizacionDelDia, guardarGasto } from "@/app/admin/(panel)/obras/gastos-actions";
import { formatMonto, parseNumero, type Moneda } from "@/lib/documentos/formato";
import type { Gasto, Gremio } from "@/lib/gastos/queries";
import { RUBROS_GASTO } from "@/lib/gastos/resumen";
import { hoyAR } from "@/lib/tareas/semanas";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SIN_GREMIO = "-";

export function GastoDialog({
  obraId,
  gasto,
  gremios,
  rubros,
  onClose,
}: {
  obraId: string;
  gasto: Gasto | null;
  gremios: Gremio[];
  /** Rubros ya usados en la obra, para sugerir */
  rubros: string[];
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    fecha: gasto?.fecha ?? hoyAR(),
    rubro: gasto?.rubro ?? "",
    detalle: gasto?.detalle ?? "",
    gremio_id: gasto?.gremio_id ?? SIN_GREMIO,
    monto: gasto ? String(gasto.monto).replace(".", ",") : "",
    moneda: (gasto?.moneda ?? "ARS") as Moneda,
    cotizacion: gasto?.cotizacion != null ? String(gasto.cotizacion).replace(".", ",") : "",
    pagado: gasto?.pagado ?? true,
    sin_recibo: gasto?.sin_recibo ?? false,
  });
  // La cotización se busca sola al cambiar la fecha, salvo que el usuario la haya escrito.
  const [cotizacionManual, setCotizacionManual] = useState(gasto?.cotizacion != null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (cotizacionManual || !/^\d{4}-\d{2}-\d{2}$/.test(form.fecha)) return;
    let vigente = true;
    setBuscando(true);
    cotizacionDelDia(form.fecha)
      .then((c) => {
        if (vigente) setForm((f) => ({ ...f, cotizacion: c ? String(c).replace(".", ",") : "" }));
      })
      .finally(() => vigente && setBuscando(false));
    return () => {
      vigente = false;
    };
  }, [form.fecha, cotizacionManual]);

  const monto = parseNumero(form.monto);
  const cotizacion = parseNumero(form.cotizacion);
  const equivalente =
    monto && cotizacion ? (form.moneda === "ARS" ? formatMonto(Math.round((monto / cotizacion) * 100) / 100, "USD") : formatMonto(monto * cotizacion, "ARS")) : null;
  const sugerencias = [...new Set([...rubros, ...RUBROS_GASTO])];

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{gasto ? "Editar" : "Nuevo"} gasto</DialogTitle>
          <DialogDescription>Un pago de la obra: gremio, corralón, trámite, honorarios de un consultor…</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const res = await guardarGasto(gasto?.id ?? null, {
                obra_id: obraId,
                fecha: form.fecha,
                rubro: form.rubro,
                detalle: form.detalle,
                gremio_id: form.gremio_id === SIN_GREMIO ? null : form.gremio_id,
                monto: monto ?? 0,
                moneda: form.moneda,
                cotizacion: cotizacion ?? null,
                pagado: form.pagado,
                sin_recibo: form.sin_recibo,
              });
              if (!res.ok) return setError(res.error);
              toast.success("Gasto guardado");
              onClose();
            });
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="gasto-fecha">Fecha *</Label>
            <Input id="gasto-fecha" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="gasto-rubro">Rubro *</Label>
            <Input
              id="gasto-rubro"
              list="gasto-rubros"
              value={form.rubro}
              onChange={(e) => setForm({ ...form, rubro: e.target.value })}
              placeholder="Ej.: Albañilería"
              required
              autoFocus={!gasto}
            />
            <datalist id="gasto-rubros">
              {sugerencias.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="gasto-detalle">Detalle</Label>
            <Input id="gasto-detalle" value={form.detalle} onChange={(e) => setForm({ ...form, detalle: e.target.value })} placeholder="Ej.: Jornales semanales" />
          </div>
          {gremios.length > 0 && (
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label>Gremio o contratista</Label>
              <Select
                value={form.gremio_id}
                onValueChange={(v) => {
                  const g = gremios.find((x) => x.id === v);
                  setForm((f) => ({ ...f, gremio_id: v, rubro: f.rubro || g?.rubro || "" }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN_GREMIO}>Ninguno</SelectItem>
                  {gremios.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.nombre}
                      {g.rubro ? ` · ${g.rubro}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="gasto-monto">Monto *</Label>
            <div className="flex gap-2">
              <Input id="gasto-monto" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} inputMode="decimal" required />
              <Select value={form.moneda} onValueChange={(v) => setForm({ ...form, moneda: v as Moneda })}>
                <SelectTrigger className="w-24" aria-label="Moneda">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">$</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="gasto-cotizacion" className="flex items-center gap-1">
              Dólar del día
              {buscando && <Loader2 className="size-3 animate-spin" />}
            </Label>
            <Input
              id="gasto-cotizacion"
              value={form.cotizacion}
              onChange={(e) => {
                setCotizacionManual(true);
                setForm({ ...form, cotizacion: e.target.value });
              }}
              inputMode="decimal"
              placeholder="Pesos por dólar"
            />
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            {equivalente ? `Equivale a ${equivalente}.` : "Sin cotización no se puede pasar a la otra moneda."} La cotización se completa con el dólar blue (compra) de esa fecha.
          </p>
          <div className="flex items-center gap-2">
            <Checkbox id="gasto-pagado" checked={form.pagado} onCheckedChange={(v) => setForm({ ...form, pagado: v === true })} />
            <Label htmlFor="gasto-pagado" className="font-normal">
              Ya está pagado
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="gasto-recibo" checked={form.sin_recibo} onCheckedChange={(v) => setForm({ ...form, sin_recibo: v === true })} />
            <Label htmlFor="gasto-recibo" className="font-normal">
              Falta el recibo
            </Label>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">
              {error}
            </p>
          )}
          <DialogFooter className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
