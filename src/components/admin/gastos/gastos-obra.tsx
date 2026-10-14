"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, FileUp, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { eliminarGasto, eliminarGremio, guardarGremio } from "@/app/admin/(panel)/obras/gastos-actions";
import { formatFechaCorta, formatMonto, parseNumero, type Moneda } from "@/lib/documentos/formato";
import type { Gasto, Gremio } from "@/lib/gastos/queries";
import { entregado, montoEn, porSemana, totales } from "@/lib/gastos/resumen";
import { formatDia } from "@/lib/tareas/semanas";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GastoDialog } from "./gasto-dialog";
import { ImportarGastos } from "./importar-gastos";

function Monto({ valor, moneda, className }: { valor: number; moneda: Moneda; className?: string }) {
  return <span className={`tabular-nums ${className ?? ""}`}>{formatMonto(Math.round(valor * 100) / 100, moneda)}</span>;
}

function GremioDialog({ obraId, gremio, onClose }: { obraId: string; gremio: Gremio | null; onClose: () => void }) {
  const [form, setForm] = useState({
    nombre: gremio?.nombre ?? "",
    rubro: gremio?.rubro ?? "",
    monto: gremio?.monto_acordado != null ? String(gremio.monto_acordado) : "",
    moneda: (gremio?.moneda ?? "ARS") as Moneda,
    notas: gremio?.notas ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{gremio ? "Editar" : "Nuevo"} gremio o contratista</DialogTitle>
          <DialogDescription>Con el monto acordado se ve cuánto se le entregó y cuánto falta.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const res = await guardarGremio(gremio?.id ?? null, {
                obra_id: obraId,
                nombre: form.nombre,
                rubro: form.rubro,
                monto_acordado: form.monto.trim() ? (parseNumero(form.monto) ?? -1) : null,
                moneda: form.moneda,
                notas: form.notas,
              });
              if (!res.ok) return setError(res.error);
              toast.success("Gremio guardado");
              onClose();
            });
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="gremio-nombre">Nombre *</Label>
            <Input id="gremio-nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required autoFocus />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="gremio-rubro">Rubro</Label>
            <Input id="gremio-rubro" value={form.rubro} onChange={(e) => setForm({ ...form, rubro: e.target.value })} placeholder="Ej.: Albañilería" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="gremio-monto">Monto acordado</Label>
            <Input id="gremio-monto" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} inputMode="decimal" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Moneda</Label>
            <Select value={form.moneda} onValueChange={(v) => setForm({ ...form, moneda: v as Moneda })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">Pesos</SelectItem>
                <SelectItem value="USD">Dólares</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="gremio-notas">Notas</Label>
            <Textarea id="gremio-notas" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} />
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

function descargarCsv(titulo: string, gastos: Gasto[], gremios: Map<string, Gremio>) {
  const celda = (v: string | number | null) => {
    const s = v === null ? "" : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const num = (n: number | null) => (n === null ? "" : (Math.round(n * 100) / 100).toString().replace(".", ","));
  const filas = [
    ["Fecha", "Rubro", "Detalle", "Gremio", "Monto", "Moneda", "Cotización", "Monto en pesos", "Monto en dólares", "Estado", "Recibo"],
    ...gastos.map((g) => [
      formatFechaCorta(g.fecha),
      g.rubro,
      g.detalle,
      g.gremio_id ? (gremios.get(g.gremio_id)?.nombre ?? "") : "",
      num(g.monto),
      g.moneda,
      num(g.cotizacion),
      num(montoEn(g, "ARS")),
      num(montoEn(g, "USD")),
      g.pagado ? "Pagado" : "Previsto",
      g.sin_recibo ? "Sin recibo" : "",
    ]),
  ];
  // Punto y coma y BOM: Excel en español lo abre con las columnas y los acentos bien.
  const csv = "﻿" + filas.map((f) => f.map(celda).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `Gastos - ${titulo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function GastosObra({ obraId, titulo, gastos, gremios }: { obraId: string; titulo: string; gastos: Gasto[]; gremios: Gremio[] }) {
  const [editando, setEditando] = useState<Gasto | null | "nuevo">(null);
  const [editandoGremio, setEditandoGremio] = useState<Gremio | null | "nuevo">(null);
  const [aBorrar, setABorrar] = useState<{ tipo: "gasto"; g: Gasto } | { tipo: "gremio"; g: Gremio } | null>(null);
  const [importando, setImportando] = useState(false);
  const [rubro, setRubro] = useState("todos");
  const [, startTransition] = useTransition();

  const porGremio = useMemo(() => new Map(gremios.map((g) => [g.id, g])), [gremios]);
  const rubros = useMemo(() => [...new Set(gastos.map((g) => g.rubro))].sort((a, b) => a.localeCompare(b, "es")), [gastos]);
  const filtrados = rubro === "todos" ? gastos : gastos.filter((g) => g.rubro === rubro);
  const pagados = filtrados.filter((g) => g.pagado);
  const previstos = filtrados.filter((g) => !g.pagado);
  const tPagado = totales(pagados);
  const tPrevisto = totales(previstos);
  const semanas = porSemana(filtrados);
  const sinRecibo = filtrados.filter((g) => g.sin_recibo).length;
  const porRubro = rubros
    .map((r) => ({ rubro: r, total: totales(gastos.filter((g) => g.rubro === r && g.pagado)) }))
    .sort((a, b) => b.total.ARS - a.total.ARS);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Pagos de la obra en pesos o dólares. La cotización (dólar blue, compra) se completa sola con la fecha y se puede cambiar.
        </p>
        <div className="flex flex-wrap gap-2">
          {gastos.length > 0 && (
            <Button variant="outline" onClick={() => descargarCsv(titulo, gastos, porGremio)}>
              <Download />
              Descargar
            </Button>
          )}
          <Button variant="outline" onClick={() => setImportando(true)}>
            <FileUp />
            Importar planilla
          </Button>
          <Button onClick={() => setEditando("nuevo")}>
            <Plus />
            Nuevo gasto
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="gap-1 py-4">
          <CardHeader className="px-4">
            <CardDescription>Pagado{rubro !== "todos" && ` · ${rubro}`}</CardDescription>
            <CardTitle className="text-xl">
              <Monto valor={tPagado.ARS} moneda="ARS" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-sm text-muted-foreground">
            <Monto valor={tPagado.USD} moneda="USD" /> a la cotización de cada día
          </CardContent>
        </Card>
        <Card className="gap-1 py-4">
          <CardHeader className="px-4">
            <CardDescription>Previsto, sin pagar</CardDescription>
            <CardTitle className="text-xl">
              <Monto valor={tPrevisto.ARS} moneda="ARS" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-sm text-muted-foreground">
            <Monto valor={tPrevisto.USD} moneda="USD" />
          </CardContent>
        </Card>
        <Card className="gap-1 py-4">
          <CardHeader className="px-4">
            <CardDescription>Movimientos</CardDescription>
            <CardTitle className="text-xl">{filtrados.length}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-sm text-muted-foreground">
            {sinRecibo > 0 ? <span className="text-amber-700">{sinRecibo} sin recibo</span> : "Todos con recibo"}
            {tPagado.sinCotizacion + tPrevisto.sinCotizacion > 0 && ` · ${tPagado.sinCotizacion + tPrevisto.sinCotizacion} sin cotización`}
          </CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card className="gap-3 py-4">
          <CardHeader className="flex flex-row items-center justify-between px-4">
            <CardTitle className="text-base">Gremios y contratistas</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setEditandoGremio("nuevo")}>
              <Users />
              Agregar
            </Button>
          </CardHeader>
          <CardContent className="px-4">
            {gremios.length === 0 ? (
              <p className="text-sm text-muted-foreground">Cargá cada gremio con lo acordado para ver cuánto se le entregó y cuánto falta.</p>
            ) : (
              <ul className="divide-y text-sm">
                {gremios.map((g) => {
                  const moneda = g.moneda as Moneda;
                  const dado = entregado(gastos, g.id, moneda);
                  const falta = g.monto_acordado != null ? g.monto_acordado - dado : null;
                  return (
                    <li key={g.id} className="flex items-center justify-between gap-2 py-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {g.nombre}
                          {g.rubro && <span className="font-normal text-muted-foreground"> · {g.rubro}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Entregado <Monto valor={dado} moneda={moneda} />
                          {g.monto_acordado != null && (
                            <>
                              {" de "}
                              <Monto valor={g.monto_acordado} moneda={moneda} />
                              {" · "}
                              <span className={falta! < 0 ? "text-destructive" : falta === 0 ? "" : "font-medium text-foreground"}>
                                {falta! < 0 ? "pagado de más " : "faltan "}
                                <Monto valor={Math.abs(falta!)} moneda={moneda} />
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setEditandoGremio(g)} aria-label="Editar gremio">
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setABorrar({ tipo: "gremio", g })}
                          aria-label="Eliminar gremio"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="gap-3 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-base">Pagado por rubro</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            {porRubro.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay gastos.</p>
            ) : (
              <ul className="max-h-72 divide-y overflow-y-auto pr-1 text-sm">
                {porRubro.map((r) => (
                  <li key={r.rubro}>
                    <button
                      type="button"
                      onClick={() => setRubro(rubro === r.rubro ? "todos" : r.rubro)}
                      className={`flex w-full items-center justify-between gap-2 py-1.5 text-left hover:text-foreground ${rubro === r.rubro ? "font-medium" : ""}`}
                    >
                      <span className="truncate">{r.rubro}</span>
                      <span className="shrink-0 text-muted-foreground">
                        <Monto valor={r.total.ARS} moneda="ARS" className="text-foreground" /> · <Monto valor={r.total.USD} moneda="USD" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {rubro !== "todos" && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Mostrando solo</span>
          <Badge variant="secondary">{rubro}</Badge>
          <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setRubro("todos")}>
            Ver todos
          </Button>
        </div>
      )}

      {semanas.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay gastos cargados.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {semanas.map((s) => {
            const t = totales(s.gastos.filter((g) => g.pagado));
            return (
              <Card key={s.lunes} className="gap-0 py-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b bg-muted/40 px-4 py-2 text-sm">
                  <span className="font-medium">Semana del {formatDia(s.lunes)} {s.lunes.slice(0, 4)}</span>
                  <span className="text-muted-foreground">
                    Subtotal <Monto valor={t.ARS} moneda="ARS" className="font-medium text-foreground" /> · <Monto valor={t.USD} moneda="USD" />
                  </span>
                </div>
                <ul className="divide-y">
                  {s.gastos.map((g) => {
                    const moneda = g.moneda as Moneda;
                    const otra: Moneda = moneda === "ARS" ? "USD" : "ARS";
                    const equivalente = montoEn(g, otra);
                    const gremio = g.gremio_id ? porGremio.get(g.gremio_id) : null;
                    return (
                      <li key={g.id} className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-sm ${g.pagado ? "" : "bg-amber-50/60"}`}>
                        <div className="flex min-w-0 flex-1 items-baseline gap-3">
                          <span className="w-20 shrink-0 text-xs text-muted-foreground">{formatDia(g.fecha)}</span>
                          <div className="min-w-0">
                            <p className="truncate">
                              <span className="font-medium">{g.rubro}</span>
                              {g.detalle && <span className="text-muted-foreground"> · {g.detalle}</span>}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {gremio && <Badge variant="outline">{gremio.nombre}</Badge>}
                              {!g.pagado && <Badge variant="secondary">Previsto</Badge>}
                              {g.sin_recibo && (
                                <Badge variant="outline" className="border-amber-300 text-amber-800">
                                  Sin recibo
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <Monto valor={g.monto} moneda={moneda} className="font-medium" />
                            <p className="text-xs text-muted-foreground">
                              {equivalente !== null ? (
                                <>
                                  <Monto valor={equivalente} moneda={otra} /> · ${g.cotizacion!.toLocaleString("es-AR")}
                                </>
                              ) : (
                                <span className="text-amber-700">sin cotización</span>
                              )}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon-sm" onClick={() => setEditando(g)} aria-label="Editar gasto">
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setABorrar({ tipo: "gasto", g })}
                            aria-label="Eliminar gasto"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            );
          })}
        </div>
      )}

      {editando !== null && (
        <GastoDialog
          key={editando === "nuevo" ? "nuevo" : editando.id}
          obraId={obraId}
          gasto={editando === "nuevo" ? null : editando}
          gremios={gremios}
          rubros={rubros}
          onClose={() => setEditando(null)}
        />
      )}
      {editandoGremio !== null && (
        <GremioDialog
          key={editandoGremio === "nuevo" ? "nuevo" : editandoGremio.id}
          obraId={obraId}
          gremio={editandoGremio === "nuevo" ? null : editandoGremio}
          onClose={() => setEditandoGremio(null)}
        />
      )}
      {importando && <ImportarGastos obraId={obraId} onClose={() => setImportando(false)} />}

      <AlertDialog open={aBorrar !== null} onOpenChange={(v) => !v && setABorrar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {aBorrar?.tipo === "gremio" ? `¿Eliminar a «${aBorrar.g.nombre}»?` : "¿Eliminar este gasto?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {aBorrar?.tipo === "gremio"
                ? "Sus pagos quedan cargados, pero sin gremio asignado."
                : aBorrar?.tipo === "gasto"
                  ? `${aBorrar.g.rubro}${aBorrar.g.detalle ? ` · ${aBorrar.g.detalle}` : ""}: ${formatMonto(aBorrar.g.monto, aBorrar.g.moneda as Moneda)}. No se puede deshacer.`
                  : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const x = aBorrar;
                if (!x) return;
                startTransition(async () => {
                  const res = x.tipo === "gremio" ? await eliminarGremio(x.g.id) : await eliminarGasto(x.g.id);
                  if (!res.ok) toast.error(res.error);
                  else toast.success("Eliminado");
                });
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
