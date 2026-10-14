"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, FileDown, FileText, Loader2, MapPin, Plus, RefreshCw, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { eliminarPresupuesto, guardarPresupuesto, ubicarObra } from "@/app/admin/(panel)/presupuestador/actions";
import type { Bloque, FilaTabla } from "@/lib/documentos/bloques";
import type { Membrete } from "@/lib/documentos/estudio";
import { formatFechaCorta, formatFechaLarga, formatMonto, parseNumero, type Moneda } from "@/lib/documentos/formato";
import { RUBROS } from "@/lib/presupuestador/constants";
import { distanciaKm } from "@/lib/presupuestador/geo";
import type { IndiceCac, Material, PrecioVigente, Presupuesto, PresupuestoItem, Proveedor } from "@/lib/presupuestador/queries";
import { hoyAR } from "@/lib/tareas/semanas";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { descargarDocx, descargarPdf } from "@/components/admin/documentos/exportar";
import { filasComputo, leerTabla } from "@/lib/presupuestador/leer-tabla";
import { normalizar } from "@/lib/presupuestador/texto";
import { adivinarMapeo, MapeoColumnas } from "./mapeo-columnas";

const MANUAL = "manual";
const SIN_CAC = "__sin";
const mesLargoFormat = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
const mesLargo = (mes: string) => mesLargoFormat.format(new Date(`${mes.slice(0, 7)}-01T00:00:00Z`));

type Item = {
  key: string;
  material_id: string | null;
  descripcion: string;
  unidad: string;
  rubro: string;
  cantidad: string;
  /** Precio elegido de un proveedor, o null si es a mano */
  precio_id: string | null;
  manual: string;
  /** Datos guardados del precio (por si el precio ya no está entre los vigentes) */
  guardado: { proveedor: string | null; precio: number | null; fecha: string | null } | null;
};

type Opcion = {
  precio: PrecioVigente;
  proveedor: Proveedor | undefined;
  /** Precio en la moneda del presupuesto, o null si falta la cotización */
  valor: number | null;
  km: number | null;
  dentro: boolean;
};

let clave = 0;
const nuevaClave = () => `i${++clave}`;
const numero = (v: string) => parseNumero(v);

export function EditorPresupuesto({
  presupuesto,
  items: itemsIniciales,
  obra,
  materiales,
  precios,
  proveedores,
  membrete,
  indicesCac,
}: {
  presupuesto: Presupuesto;
  items: PresupuestoItem[];
  obra: { id: string; titulo: string; ubicacion: string; lat: number | null; lng: number | null };
  materiales: Material[];
  precios: PrecioVigente[];
  proveedores: Proveedor[];
  membrete: Membrete;
  indicesCac: IndiceCac[];
}) {
  const [titulo, setTitulo] = useState(presupuesto.titulo);
  const [moneda, setMoneda] = useState<Moneda>(presupuesto.moneda as Moneda);
  const [cotizacion, setCotizacion] = useState(presupuesto.cotizacion_usd ? String(presupuesto.cotizacion_usd).replace(".", ",") : "");
  const [imprevistos, setImprevistos] = useState(String(presupuesto.imprevistos_pct).replace(".", ","));
  const [radio, setRadio] = useState(String(presupuesto.radio_km).replace(".", ","));
  const [notas, setNotas] = useState(presupuesto.notas ?? "");
  const [cacBase, setCacBase] = useState<string | null>(presupuesto.cac_base);
  const [ubicacion, setUbicacion] = useState(obra.lat !== null && obra.lng !== null ? { lat: obra.lat, lng: obra.lng } : null);
  const [items, setItems] = useState<Item[]>(() =>
    itemsIniciales.map((i) => ({
      key: i.id,
      material_id: i.material_id,
      descripcion: i.descripcion,
      unidad: i.unidad ?? "",
      rubro: i.rubro,
      cantidad: String(i.cantidad).replace(".", ","),
      precio_id: i.precio_id,
      manual: i.precio_id ? "" : i.precio_unitario !== null ? String(i.precio_unitario).replace(".", ",") : "",
      guardado: { proveedor: i.proveedor, precio: i.precio_unitario, fecha: i.precio_fecha },
    }))
  );
  const [sucio, setSucio] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [pending, startTransition] = useTransition();

  const cambiar = () => setSucio(true);
  const materialPorId = useMemo(() => new Map(materiales.map((m) => [m.id, m])), [materiales]);
  const proveedorPorId = useMemo(() => new Map(proveedores.map((p) => [p.id, p])), [proveedores]);
  const cot = numero(cotizacion);
  const radioKm = numero(radio) ?? 25;

  const convertir = (valor: number, de: string): number | null => {
    if (de === moneda) return valor;
    if (!cot) return null;
    return de === "USD" ? valor * cot : valor / cot;
  };

  /** Precios disponibles de un material, ordenados: dentro del radio y más baratos primero. */
  const opciones = (materialId: string | null): Opcion[] => {
    if (!materialId) return [];
    return precios
      .filter((p) => p.material_id === materialId)
      .map((p) => {
        const prov = proveedorPorId.get(p.proveedor_id);
        const km = ubicacion && prov?.lat != null && prov?.lng != null ? distanciaKm(ubicacion, { lat: prov.lat, lng: prov.lng }) : null;
        return { precio: p, proveedor: prov, valor: convertir(p.precio, p.moneda), km, dentro: km === null || km <= radioKm };
      })
      .sort((a, b) => Number(b.dentro) - Number(a.dentro) || (a.valor ?? Infinity) - (b.valor ?? Infinity));
  };

  const mejorOpcion = (materialId: string) => opciones(materialId).find((o) => o.dentro && o.valor !== null) ?? null;

  /** Precio unitario del ítem en la moneda del presupuesto. */
  const unitario = (i: Item): { valor: number | null; proveedor: string | null; fecha: string | null } => {
    if (!i.precio_id) return { valor: numero(i.manual), proveedor: null, fecha: null };
    const o = opciones(i.material_id).find((x) => x.precio.id === i.precio_id);
    if (o) return { valor: o.valor, proveedor: o.proveedor?.nombre ?? null, fecha: o.precio.fecha };
    // Precio que ya no es el vigente (llegó una lista más nueva): se usa el guardado.
    return { valor: i.guardado?.precio ?? null, proveedor: i.guardado?.proveedor ?? null, fecha: i.guardado?.fecha ?? null };
  };

  const subtotal = (i: Item) => {
    const u = unitario(i).valor;
    const c = numero(i.cantidad);
    return u !== null && c !== null ? u * c : 0;
  };

  const rubros = [...RUBROS, ...new Set(items.map((i) => i.rubro))].filter(
    (r, idx, arr) => arr.indexOf(r) === idx && items.some((i) => i.rubro === r)
  );
  const totalNeto = items.reduce((acc, i) => acc + subtotal(i), 0);
  const pctImprevistos = numero(imprevistos) ?? 0;
  const montoImprevistos = (totalNeto * pctImprevistos) / 100;
  const total = totalNeto + montoImprevistos;
  // Actualización por índice CAC: del mes base al último mes cargado.
  const cacUltimo = indicesCac[0] ?? null;
  const cacDesde = cacBase ? indicesCac.find((i) => i.mes === cacBase) ?? null : null;
  const factorCac = cacDesde && cacUltimo && cacUltimo.mes > cacDesde.mes ? cacUltimo.valor / cacDesde.valor : null;
  const totalCac = factorCac ? total * factorCac : null;
  const sinPrecio = items.filter((i) => unitario(i).valor === null).length;
  const necesitaCotizacion = precios.some((p) => p.moneda !== moneda) && !cot;

  const set = (key: string, cambios: Partial<Item>) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...cambios } : i)));
    cambiar();
  };

  const agregarMaterial = (m: Material) => {
    const o = mejorOpcion(m.id);
    setItems((prev) => [
      ...prev,
      { key: nuevaClave(), material_id: m.id, descripcion: m.nombre, unidad: m.unidad, rubro: m.rubro, cantidad: "1", precio_id: o?.precio.id ?? null, manual: "", guardado: null },
    ]);
    cambiar();
  };

  /** Pasa cada ítem al último precio del mismo proveedor (o al mejor si no tiene). */
  const actualizarPrecios = () => {
    let cambios = 0;
    setItems((prev) =>
      prev.map((i) => {
        if (!i.material_id || !i.precio_id) return i;
        const ops = opciones(i.material_id);
        if (ops.some((o) => o.precio.id === i.precio_id)) return i;
        const mismo = ops.find((o) => o.proveedor?.nombre === i.guardado?.proveedor) ?? ops.find((o) => o.dentro);
        if (!mismo) return i;
        cambios++;
        return { ...i, precio_id: mismo.precio.id };
      })
    );
    if (cambios) {
      cambiar();
      toast.success(`${cambios} precios actualizados`);
    } else toast.info("Todos los ítems ya usan el último precio disponible.");
  };

  const payload = () => ({
    titulo,
    moneda,
    cotizacion_usd: cot,
    imprevistos_pct: pctImprevistos,
    radio_km: radioKm,
    cac_base: cacBase,
    notas,
    items: items.map((i) => {
      const u = unitario(i);
      return {
        material_id: i.material_id,
        descripcion: i.descripcion,
        unidad: i.unidad || null,
        rubro: i.rubro,
        cantidad: numero(i.cantidad) ?? 0,
        precio_id: i.precio_id && opciones(i.material_id).some((o) => o.precio.id === i.precio_id) ? i.precio_id : null,
        proveedor: u.proveedor,
        precio_unitario: u.valor,
        precio_fecha: u.fecha,
      };
    }),
  });

  const guardar = () =>
    startTransition(async () => {
      const res = await guardarPresupuesto(presupuesto.id, payload());
      if (!res.ok) return void toast.error(res.error);
      setSucio(false);
      toast.success("Presupuesto guardado");
    });

  const exportar = async (formato: "pdf" | "docx") => {
    setExportando(true);
    try {
      const m = (v: number) => formatMonto(v, moneda);
      const filas: FilaTabla[] = [];
      for (const r of rubros) {
        const deRubro = items.filter((i) => i.rubro === r);
        filas.push({ celdas: [r, "", "", ""], tipo: "seccion" });
        for (const i of deRubro) {
          const u = unitario(i).valor;
          filas.push({ celdas: [i.descripcion, `${i.cantidad} ${i.unidad}`.trim(), u !== null ? m(u) : "—", m(subtotal(i))] });
        }
        filas.push({ celdas: [`Subtotal ${r.toLowerCase()}`, "", "", m(deRubro.reduce((a, i) => a + subtotal(i), 0))], tipo: "subtotal" });
      }
      filas.push({ celdas: ["Subtotal", "", "", m(totalNeto)], tipo: "subtotal" });
      filas.push({ celdas: [`Imprevistos (${pctImprevistos.toLocaleString("es-AR")}%)`, "", "", m(montoImprevistos)], tipo: "subtotal" });
      filas.push({ celdas: ["Total", "", "", m(total)], tipo: "total" });
      if (factorCac && cacDesde && cacUltimo) {
        filas.push({
          celdas: [`Actualización CAC (de ${mesLargo(cacDesde.mes)} a ${mesLargo(cacUltimo.mes)}: ${((factorCac - 1) * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%)`, "", "", m(totalCac! - total)],
          tipo: "subtotal",
        });
        filas.push({ celdas: [`Total actualizado a ${mesLargo(cacUltimo.mes)}`, "", "", m(totalCac!)], tipo: "total" });
      }

      const fechas = items.map((i) => unitario(i).fecha).filter((f): f is string => !!f).sort();
      const bloques: Bloque[] = [
        { t: "titulo", nivel: 1, runs: [{ texto: titulo }] },
        { t: "parrafo", runs: [{ texto: obra.titulo, b: true }, { texto: obra.ubicacion ? ` · ${obra.ubicacion}` : "" }] },
        { t: "parrafo", runs: [{ texto: formatFechaLarga(hoyAR()) }] },
        { t: "tabla", columnas: ["Concepto", "Cantidad", "P. unitario", "Subtotal"], filas, derecha: [1, 2, 3] },
        {
          t: "parrafo",
          runs: [
            {
              texto: `Precios de referencia de proveedores${fechas.length ? `, vigentes entre el ${formatFechaCorta(fechas[0])} y el ${formatFechaCorta(fechas.at(-1)!)}` : ""}. Incluye materiales y mano de obra. Valores en ${moneda === "USD" ? "dólares" : "pesos"}${moneda === "ARS" && cot ? `; dólar a ${formatMonto(cot, "ARS")}` : ""}.`,
              i: true,
            },
          ],
        },
        ...(notas.trim() ? [{ t: "titulo", nivel: 2, runs: [{ texto: "Notas" }] } as Bloque, { t: "parrafo", runs: [{ texto: notas }] } as Bloque] : []),
      ];
      const doc = { titulo, bloques };
      if (formato === "pdf") await descargarPdf(doc, titulo, membrete);
      else await descargarDocx(doc, titulo, membrete);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo generar el archivo.");
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href={`/admin/obras/${obra.id}?tab=presupuestos`} aria-label="Volver a la obra">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <Input
            value={titulo}
            onChange={(e) => { setTitulo(e.target.value); cambiar(); }}
            className="h-9 border-transparent px-1 text-lg font-semibold shadow-none hover:border-input"
            aria-label="Título del presupuesto"
          />
          <p className="px-1 text-xs text-muted-foreground">
            {obra.titulo}
            {sucio && " · cambios sin guardar"}
          </p>
        </div>
        <Button size="sm" onClick={guardar} disabled={pending || !sucio}>
          <Save />
          {pending ? "Guardando…" : "Guardar"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={exportando || items.length === 0}>
              {exportando ? <Loader2 className="animate-spin" /> : <FileDown />}
              Descargar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => exportar("pdf")}>
              <FileText />
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => exportar("docx")}>
              <FileText />
              Word (editable)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-2">
            <Label>Moneda</Label>
            <Select value={moneda} onValueChange={(v) => { setMoneda(v as Moneda); cambiar(); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">Pesos</SelectItem>
                <SelectItem value="USD">Dólares</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cotizacion">Dólar (pesos por USD)</Label>
            <Input
              id="cotizacion"
              value={cotizacion}
              onChange={(e) => { setCotizacion(e.target.value); cambiar(); }}
              inputMode="decimal"
              placeholder={necesitaCotizacion ? "Necesario" : "Opcional"}
              aria-invalid={necesitaCotizacion || undefined}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="imprevistos">Imprevistos (%)</Label>
            <Input id="imprevistos" value={imprevistos} onChange={(e) => { setImprevistos(e.target.value); cambiar(); }} inputMode="decimal" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="radio">Radio de proveedores (km)</Label>
            <Input id="radio" value={radio} onChange={(e) => { setRadio(e.target.value); cambiar(); }} inputMode="decimal" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Ubicación de la obra</Label>
            {ubicacion ? (
              <p className="flex h-9 items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                Ubicada en el mapa
              </p>
            ) : (
              <Button
                variant="outline"
                onClick={() =>
                  startTransition(async () => {
                    const res = await ubicarObra(obra.id);
                    if (!res.ok) return void toast.error(res.error);
                    if (res.lat === undefined || res.lng === undefined) return;
                    setUbicacion({ lat: res.lat, lng: res.lng });
                    toast.success("Obra ubicada en el mapa");
                  })
                }
                disabled={pending}
              >
                <MapPin />
                Ubicar obra
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {(sinPrecio > 0 || necesitaCotizacion) && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {sinPrecio > 0 && `${sinPrecio} ${sinPrecio === 1 ? "ítem no tiene" : "ítems no tienen"} precio. `}
          {necesitaCotizacion && "Hay precios en otra moneda: cargá la cotización del dólar para usarlos."}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setAgregando(true)}>
          <Plus />
          Agregar material o mano de obra
        </Button>
        <Button variant="outline" onClick={() => setImportando(true)}>
          <Upload />
          Importar cantidades de Revit
        </Button>
        {items.some((i) => i.precio_id) && (
          <Button variant="ghost" onClick={actualizarPrecios}>
            <RefreshCw />
            Usar los últimos precios
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Agregá materiales y mano de obra del catálogo, o importá las cantidades exportadas de Revit.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {rubros.map((r) => {
            const deRubro = items.filter((i) => i.rubro === r);
            return (
              <Card key={r} className="gap-0 py-0">
                <div className="flex items-center justify-between border-b px-4 py-2.5">
                  <h3 className="text-sm font-medium">{r}</h3>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {formatMonto(deRubro.reduce((a, i) => a + subtotal(i), 0), moneda)}
                  </span>
                </div>
                <ul className="divide-y">
                  {deRubro.map((i) => {
                    const ops = opciones(i.material_id);
                    const u = unitario(i);
                    const vigente = !i.precio_id || ops.some((o) => o.precio.id === i.precio_id);
                    return (
                      <li key={i.key} className="grid gap-2 p-3 md:grid-cols-[minmax(0,1fr)_7rem_minmax(0,18rem)_8rem_2rem] md:items-center">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{i.descripcion}</p>
                          {!vigente && <p className="text-xs text-amber-700">Hay un precio más nuevo: usá «Usar los últimos precios».</p>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Input value={i.cantidad} onChange={(e) => set(i.key, { cantidad: e.target.value })} inputMode="decimal" className="text-right" aria-label="Cantidad" />
                          <span className="w-10 shrink-0 text-xs text-muted-foreground">{i.unidad}</span>
                        </div>
                        <div className="flex min-w-0 gap-1.5">
                          <Select
                            value={i.precio_id ?? MANUAL}
                            onValueChange={(v) => set(i.key, { precio_id: v === MANUAL ? null : v })}
                          >
                            <SelectTrigger className="w-full min-w-0" aria-label="Precio">
                              <SelectValue>
                                {i.precio_id
                                  ? `${u.proveedor ?? "—"} · ${u.valor !== null ? formatMonto(u.valor, moneda) : "sin cotización"}`
                                  : "Precio a mano"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {!vigente && i.precio_id && (
                                <SelectItem value={i.precio_id}>
                                  {u.proveedor} · {u.valor !== null ? formatMonto(u.valor, moneda) : "—"} (guardado)
                                </SelectItem>
                              )}
                              {ops.map((o) => (
                                <SelectItem key={o.precio.id} value={o.precio.id}>
                                  <span className={cn(!o.dentro && "text-muted-foreground")}>
                                    {o.proveedor?.nombre ?? "—"} · {o.valor !== null ? formatMonto(o.valor, moneda) : "falta cotización"} ·{" "}
                                    {formatFechaCorta(o.precio.fecha)}
                                    {o.km !== null && ` · ${Math.round(o.km)} km`}
                                    {!o.dentro && " (fuera del radio)"}
                                  </span>
                                </SelectItem>
                              ))}
                              <SelectItem value={MANUAL}>Precio a mano</SelectItem>
                            </SelectContent>
                          </Select>
                          {!i.precio_id && (
                            <Input
                              value={i.manual}
                              onChange={(e) => set(i.key, { manual: e.target.value })}
                              inputMode="decimal"
                              className="w-28 shrink-0 text-right"
                              placeholder="Precio"
                              aria-label="Precio unitario"
                            />
                          )}
                        </div>
                        <p className="text-right text-sm font-medium tabular-nums">{formatMonto(subtotal(i), moneda)}</p>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => { setItems((prev) => prev.filter((x) => x.key !== i.key)); cambiar(); }}
                          aria-label="Quitar"
                        >
                          <Trash2 />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            );
          })}

          <Card className="py-4">
            <CardContent className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatMonto(totalNeto, moneda)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Imprevistos ({pctImprevistos.toLocaleString("es-AR")}%)</span>
                <span className="tabular-nums">{formatMonto(montoImprevistos, moneda)}</span>
              </div>
              <div className="mt-1 flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatMonto(total, moneda)}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Actualizar por índice CAC desde</span>
                  <Select value={cacBase ?? SIN_CAC} onValueChange={(v) => { setCacBase(v === SIN_CAC ? null : v); cambiar(); }}>
                    <SelectTrigger size="sm" className="w-44" aria-label="Mes base CAC">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SIN_CAC}>No actualizar</SelectItem>
                      {indicesCac.map((i) => (
                        <SelectItem key={i.mes} value={i.mes}>
                          {mesLargo(i.mes)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {indicesCac.length === 0 ? (
                  <Link href="/admin/presupuestador/cac" className="text-xs underline">
                    Cargar el índice CAC
                  </Link>
                ) : totalCac && cacUltimo ? (
                  <span className="font-semibold tabular-nums">
                    {formatMonto(totalCac, moneda)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      a {mesLargo(cacUltimo.mes)} (+{((factorCac! - 1) * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%)
                    </span>
                  </span>
                ) : cacBase ? (
                  <span className="text-xs text-muted-foreground">No hay un mes posterior cargado.</span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="notas">Notas (salen en el PDF)</Label>
        <Textarea id="notas" value={notas} onChange={(e) => { setNotas(e.target.value); cambiar(); }} rows={2} />
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="self-start text-destructive hover:text-destructive">
            <Trash2 />
            Eliminar presupuesto
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar «{titulo}»?</AlertDialogTitle>
            <AlertDialogDescription>No se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                startTransition(async () => {
                  const res = await eliminarPresupuesto(presupuesto.id);
                  if (res && !res.ok) toast.error(res.error);
                })
              }
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={agregando} onOpenChange={setAgregando}>
        <DialogContent className="p-0 sm:max-w-lg">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>Agregar del catálogo</DialogTitle>
            <DialogDescription>Se elige solo el precio más barato dentro del radio; después se puede cambiar.</DialogDescription>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="Buscar material o mano de obra…" />
            <CommandList className="max-h-80">
              <CommandEmpty>
                No está en el catálogo.{" "}
                <Link href="/admin/presupuestador/materiales" className="underline">
                  Cargalo en Materiales
                </Link>
                .
              </CommandEmpty>
              <CommandGroup>
                {materiales.map((m) => {
                  const o = mejorOpcion(m.id);
                  return (
                    <CommandItem key={m.id} value={`${m.nombre} ${m.codigo ?? ""} ${m.rubro}`} onSelect={() => agregarMaterial(m)}>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate">{m.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {m.rubro} · {m.unidad}
                        </span>
                      </div>
                      <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                        {o?.valor != null ? formatMonto(o.valor, moneda) : "sin precio"}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      {importando && (
        <ImportarCantidades
          materiales={materiales}
          onCerrar={() => setImportando(false)}
          onImportar={(cantidades) => {
            setItems((prev) => {
              const out = [...prev];
              for (const [materialId, cantidad] of cantidades) {
                const m = materialPorId.get(materialId)!;
                const idx = out.findIndex((i) => i.material_id === materialId);
                const texto = String(Math.round(cantidad * 1000) / 1000).replace(".", ",");
                if (idx >= 0) out[idx] = { ...out[idx], cantidad: texto };
                else {
                  const o = mejorOpcion(materialId);
                  out.push({ key: nuevaClave(), material_id: materialId, descripcion: m.nombre, unidad: m.unidad, rubro: m.rubro, cantidad: texto, precio_id: o?.precio.id ?? null, manual: "", guardado: null });
                }
              }
              return out;
            });
            cambiar();
          }}
        />
      )}
    </div>
  );
}

/** Cantidades desde una tabla de cómputo exportada de Revit (TXT/CSV), asociadas por código (T7, opción A). */
function ImportarCantidades({
  materiales,
  onCerrar,
  onImportar,
}: {
  materiales: Material[];
  onCerrar: () => void;
  onImportar: (cantidades: Map<string, number>) => void;
}) {
  const [tabla, setTabla] = useState<string[][] | null>(null);
  const [mapeo, setMapeo] = useState<Record<string, number>>({});
  const [encabezado, setEncabezado] = useState(true);

  const porCodigo = useMemo(() => new Map(materiales.filter((m) => m.codigo).map((m) => [normalizar(m.codigo!), m.id])), [materiales]);

  const resultado = useMemo(() => {
    if (!tabla || !(mapeo.codigo >= 0) || !(mapeo.cantidad >= 0)) return null;
    const cantidades = new Map<string, number>();
    const sinAsociar = new Set<string>();
    for (const { codigo, cantidad } of filasComputo(tabla, mapeo.codigo, mapeo.cantidad, encabezado, parseNumero)) {
      const id = porCodigo.get(normalizar(codigo));
      if (id) cantidades.set(id, (cantidades.get(id) ?? 0) + cantidad); // mismo código en varias filas: se suma
      else sinAsociar.add(codigo);
    }
    return { cantidades, sinAsociar: [...sinAsociar] };
  }, [tabla, mapeo, encabezado, porCodigo]);

  return (
    <Dialog open onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar cantidades de Revit</DialogTitle>
          <DialogDescription>
            Exportá la tabla de cómputo de Revit (Exportar → Informes → Tabla de planificación, queda un .txt) con una columna
            con el código del material del catálogo. Las cantidades se asocian por código.
          </DialogDescription>
        </DialogHeader>
        <input
          id="revit-archivo"
          type="file"
          accept=".txt,.csv,.tsv,.xlsx"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try {
              const t = await leerTabla(f);
              setTabla(t);
              setMapeo(adivinarMapeo(t, { codigo: /codigo|cod\.?|code|clave/, cantidad: /cantidad|cant\.?|count|recuento|area|volumen|longitud/ }));
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "No se pudo leer el archivo.");
            }
          }}
        />
        <Button variant="outline" className="self-start" asChild>
          <label htmlFor="revit-archivo" className="cursor-pointer">
            <Upload />
            {tabla ? "Cambiar archivo" : "Elegir archivo"}
          </label>
        </Button>
        {tabla && (
          <MapeoColumnas
            filas={tabla}
            roles={[
              { key: "codigo", label: "Código", obligatorio: true },
              { key: "cantidad", label: "Cantidad", obligatorio: true },
            ]}
            mapeo={mapeo}
            onMapeo={setMapeo}
            encabezado={encabezado}
            onEncabezado={setEncabezado}
          />
        )}
        {resultado && (
          <div className="text-sm">
            <p>{resultado.cantidades.size} materiales encontrados en el catálogo.</p>
            {resultado.sinAsociar.length > 0 && (
              <p className="text-amber-700">
                Códigos que no están en el catálogo ({resultado.sinAsociar.length}): {resultado.sinAsociar.slice(0, 15).join(", ")}
                {resultado.sinAsociar.length > 15 && "…"}
              </p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button
            disabled={!resultado || resultado.cantidades.size === 0}
            onClick={() => {
              // Guardia explícita: el React Compiler puede leer las propiedades usadas en el clic al renderizar.
              if (!resultado) return;
              onImportar(resultado.cantidades);
              toast.success(`${resultado.cantidades.size} cantidades importadas`);
              onCerrar();
            }}
          >
            Importar cantidades
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
