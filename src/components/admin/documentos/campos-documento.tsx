"use client";

import { useState } from "react";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { MONEDAS, formatMonto, parseMonto, type Moneda } from "@/lib/documentos/formato";
import { SECCIONES_PRESUPUESTO, type Campo, type ItemHito, type ItemPresupuesto } from "@/lib/documentos/tipos";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ContextoDocumento } from "@/lib/documentos/datos";
import { CalculadoraHonorarios } from "../honorarios/calculadora";

type Datos = Record<string, unknown>;

function Items({
  items,
  moneda,
  onChange,
}: {
  items: ItemPresupuesto[];
  moneda: Moneda;
  onChange: (items: ItemPresupuesto[]) => void;
}) {
  const set = (i: number, campo: keyof ItemPresupuesto, valor: string) =>
    onChange(items.map((it, j) => (j === i ? { ...it, [campo]: valor } : it)));
  const total = items.reduce((acc, it) => acc + (parseMonto(it.monto) ?? 0), 0);

  return (
    <div className="flex flex-col gap-2">
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-[1fr_2rem] gap-2 border-b pb-2 sm:grid-cols-[11rem_1fr_8rem_2rem] sm:border-0 sm:pb-0">
          <Select value={it.seccion} onValueChange={(v) => set(i, "seccion", v)}>
            <SelectTrigger className="w-full" aria-label="Sección">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SECCIONES_PRESUPUESTO.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="sm:order-last"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            aria-label="Quitar ítem"
          >
            <Trash2 />
          </Button>
          <Input value={it.concepto} onChange={(e) => set(i, "concepto", e.target.value)} placeholder="Concepto" aria-label="Concepto" />
          <Input
            value={it.monto}
            onChange={(e) => set(i, "monto", e.target.value)}
            placeholder="Monto"
            inputMode="decimal"
            aria-label="Monto"
            className="text-right"
          />
        </div>
      ))}
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, { seccion: items.at(-1)?.seccion ?? SECCIONES_PRESUPUESTO[0], concepto: "", monto: "" }])}
        >
          <Plus />
          Agregar ítem
        </Button>
        {items.length > 0 && <span className="text-sm font-medium tabular-nums">Total: {formatMonto(total, moneda)}</span>}
      </div>
    </div>
  );
}

function Hitos({ hitos, onChange }: { hitos: ItemHito[]; onChange: (h: ItemHito[]) => void }) {
  const set = (i: number, campo: keyof ItemHito, valor: string) =>
    onChange(hitos.map((h, j) => (j === i ? { ...h, [campo]: valor } : h)));
  const suma = hitos.reduce((a, h) => a + (parseMonto(h.porcentaje) ?? 0), 0);
  return (
    <div className="flex flex-col gap-2">
      {hitos.map((h, i) => (
        <div key={i} className="grid grid-cols-[4.5rem_1fr_2rem] gap-2 border-b pb-2 sm:grid-cols-[4.5rem_1fr_1fr_2rem] sm:border-0 sm:pb-0">
          <div className="relative">
            <Input value={h.porcentaje} onChange={(e) => set(i, "porcentaje", e.target.value)} inputMode="decimal" className="pr-6 text-right" aria-label="Porcentaje" />
            <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
          </div>
          <Input value={h.descripcion} onChange={(e) => set(i, "descripcion", e.target.value)} placeholder="Momento (ej.: Firma)" aria-label="Momento" />
          <Button type="button" variant="ghost" size="icon-sm" className="sm:order-last" onClick={() => onChange(hitos.filter((_, j) => j !== i))} aria-label="Quitar hito">
            <Trash2 />
          </Button>
          <Input value={h.descripcion_en} onChange={(e) => set(i, "descripcion_en", e.target.value)} placeholder="En inglés (opcional)" aria-label="Momento en inglés" className="col-span-2 sm:col-span-1" />
        </div>
      ))}
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...hitos, { porcentaje: "", descripcion: "", descripcion_en: "" }])}>
          <Plus />
          Agregar hito
        </Button>
        <span className={`text-sm tabular-nums ${Math.round(suma) === 100 ? "text-muted-foreground" : "font-medium text-destructive"}`}>
          Suma: {suma.toLocaleString("es-AR")}%
        </span>
      </div>
    </div>
  );
}

/** Formulario de los campos propios del tipo de documento. */
export function CamposDocumento({
  campos,
  datos,
  onChange,
  honorarios,
}: {
  campos: Campo[];
  datos: Datos;
  onChange: (d: Datos) => void;
  honorarios?: ContextoDocumento["honorarios"];
}) {
  const [calculando, setCalculando] = useState<string | null>(null);
  const set = (key: string, valor: unknown) => onChange({ ...datos, [key]: valor });
  const texto = (key: string) => (typeof datos[key] === "string" ? (datos[key] as string) : datos[key] == null ? "" : String(datos[key]));

  if (campos.length === 0) return <p className="text-sm text-muted-foreground">Este documento no tiene campos propios.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {campos.map((c) => {
        const id = `campo-${c.key}`;
        const ancho = c.tipo === "textoLargo" || c.tipo === "items" || c.tipo === "hitos" || c.tipo === "booleano" ? "sm:col-span-2" : "";
        if (c.tipo === "booleano") {
          return (
            <div key={c.key} className={`flex items-start gap-2 ${ancho}`}>
              <Checkbox id={id} checked={datos[c.key] === true} onCheckedChange={(v) => set(c.key, v === true)} className="mt-0.5" />
              <div className="flex flex-col gap-1">
                <Label htmlFor={id} className="font-normal">
                  {c.label}
                </Label>
                {c.ayuda && <p className="text-xs text-muted-foreground">{c.ayuda}</p>}
              </div>
            </div>
          );
        }
        return (
          <div key={c.key} className={`flex flex-col gap-2 ${ancho}`}>
            <Label htmlFor={id}>
              {c.label}
              {c.opcional && <span className="font-normal text-muted-foreground"> (opcional)</span>}
            </Label>
            {c.tipo === "textoLargo" ? (
              <Textarea id={id} value={texto(c.key)} onChange={(e) => set(c.key, e.target.value)} rows={3} />
            ) : c.tipo === "moneda" ? (
              <Select value={texto(c.key) || "ARS"} onValueChange={(v) => set(c.key, v)}>
                <SelectTrigger id={id} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONEDAS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : c.tipo === "opcion" ? (
              <Select value={texto(c.key) || c.opciones?.[0]?.value} onValueChange={(v) => set(c.key, v)}>
                <SelectTrigger id={id} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {c.opciones?.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : c.tipo === "hitos" ? (
              <Hitos hitos={(datos[c.key] as ItemHito[]) ?? []} onChange={(h) => set(c.key, h)} />
            ) : c.tipo === "items" ? (
              <Items
                items={(datos[c.key] as ItemPresupuesto[]) ?? []}
                moneda={(texto("moneda") as Moneda) || "ARS"}
                onChange={(items) => set(c.key, items)}
              />
            ) : c.tipo === "monto" && honorarios && c.key.startsWith("honorarios") ? (
              <div className="flex gap-2">
                <Input id={id} inputMode="decimal" value={texto(c.key)} onChange={(e) => set(c.key, e.target.value)} />
                <Button type="button" variant="outline" onClick={() => setCalculando(c.key)}>
                  <Calculator />
                  Calcular
                </Button>
              </div>
            ) : (
              <Input
                id={id}
                type={c.tipo === "fecha" ? "date" : "text"}
                inputMode={c.tipo === "monto" || c.tipo === "numero" ? "decimal" : undefined}
                value={texto(c.key)}
                onChange={(e) => set(c.key, e.target.value)}
              />
            )}
            {c.ayuda && <p className="text-xs text-muted-foreground">{c.ayuda}</p>}
          </div>
        );
      })}
      {honorarios && (
        <Dialog open={calculando !== null} onOpenChange={(v) => !v && setCalculando(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Calcular honorarios</DialogTitle>
              <DialogDescription>Con la tabla del estudio (Plantillas → Honorarios). Tipo de obra y superficie vienen de la ficha.</DialogDescription>
            </DialogHeader>
            <CalculadoraHonorarios
              config={honorarios.config}
              categoria={honorarios.categoria}
              m2={honorarios.m2}
              costo={parseMonto(texto("monto_obra"))}
              moneda={(texto("moneda") as Moneda) || "ARS"}
              onUsar={(monto) => {
                const key = calculando;
                if (!key) return;
                set(key, monto.toLocaleString("es-AR", { maximumFractionDigits: 2 }));
                setCalculando(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
