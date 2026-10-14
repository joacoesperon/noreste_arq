"use client";

import { Plus, Trash2 } from "lucide-react";
import { MONEDAS, formatMonto, parseMonto, type Moneda } from "@/lib/documentos/formato";
import { SECCIONES_PRESUPUESTO, type Campo, type ItemPresupuesto } from "@/lib/documentos/tipos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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

/** Formulario de los campos propios del tipo de documento. */
export function CamposDocumento({ campos, datos, onChange }: { campos: Campo[]; datos: Datos; onChange: (d: Datos) => void }) {
  const set = (key: string, valor: unknown) => onChange({ ...datos, [key]: valor });
  const texto = (key: string) => (typeof datos[key] === "string" ? (datos[key] as string) : datos[key] == null ? "" : String(datos[key]));

  if (campos.length === 0) return <p className="text-sm text-muted-foreground">Este documento no tiene campos propios.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {campos.map((c) => {
        const id = `campo-${c.key}`;
        const ancho = c.tipo === "textoLargo" || c.tipo === "items" ? "sm:col-span-2" : "";
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
            ) : c.tipo === "items" ? (
              <Items
                items={(datos[c.key] as ItemPresupuesto[]) ?? []}
                moneda={(texto("moneda") as Moneda) || "ARS"}
                onChange={(items) => set(c.key, items)}
              />
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
    </div>
  );
}
