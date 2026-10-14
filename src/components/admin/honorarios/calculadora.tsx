"use client";

import { useState } from "react";
import { formatMonto, parseNumero, type Moneda } from "@/lib/documentos/formato";
import { calcularHonorarios, porcentajeDe, type ClaveCategoria, type ConfigHonorarios } from "@/lib/honorarios/calculo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const num = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 2 });

/** Calculadora de honorarios con la tabla del estudio. Con `onUsar`, cada monto tiene un botón para usarlo. */
export function CalculadoraHonorarios({
  config,
  categoria: categoriaInicial,
  m2: m2Inicial,
  costo: costoInicial,
  moneda,
  onUsar,
}: {
  config: ConfigHonorarios;
  categoria: ClaveCategoria;
  m2: number;
  /** Costo de obra ya conocido (ej.: el monto de obra del contrato) */
  costo?: number | null;
  moneda: Moneda;
  onUsar?: (monto: number, concepto: string) => void;
}) {
  const [categoria, setCategoria] = useState<ClaveCategoria>(categoriaInicial);
  const [m2, setM2] = useState(m2Inicial > 0 ? num(m2Inicial) : "");
  const [porM2, setPorM2] = useState("");
  const [costo, setCosto] = useState(costoInicial ? num(costoInicial) : "");
  const [conIva, setConIva] = useState(true);

  const superficie = parseNumero(m2) ?? 0;
  const costoObra = parseNumero(costo) ?? 0;
  const cat = config.categorias.find((c) => c.clave === categoria) ?? config.categorias[0];
  const r = calcularHonorarios(config, categoria, superficie, costoObra, conIva);
  const idx = cat.tramos.findIndex((t) => t.hasta === null || superficie < t.hasta);
  const desde = idx > 0 ? cat.tramos[idx - 1].hasta : 0;
  const hasta = cat.tramos[idx]?.hasta;
  const tramo = hasta ? `de ${num(desde ?? 0)} a ${num(hasta)} m²` : `más de ${num(desde ?? 0)} m²`;

  const filas: { concepto: string; monto: number; sub?: boolean; fuerte?: boolean }[] = [
    { concepto: "Anteproyecto", monto: r.anteproyecto, sub: true },
    { concepto: "Proyecto municipal", monto: r.municipal, sub: true },
    { concepto: "Proyecto ejecutivo", monto: r.ejecutivo, sub: true },
    { concepto: `Proyecto (${num(cat.proyecto)} %)`, monto: r.proyecto },
    { concepto: `Dirección de obra (${num(100 - cat.proyecto)} %)`, monto: r.direccion },
    { concepto: "Dirección ejecutiva", monto: r.direccionEjecutiva },
    { concepto: "Proyecto y dirección", monto: r.proyectoDireccion, fuerte: true },
    { concepto: "Proyecto y dirección ejecutiva", monto: r.proyectoDireccionEjecutiva, fuerte: true },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label>Tipo de obra</Label>
          <Select value={categoria} onValueChange={(v) => setCategoria(v as ClaveCategoria)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config.categorias.map((c) => (
                <SelectItem key={c.clave} value={c.clave}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="hon-m2">Superficie (m²)</Label>
          <Input
            id="hon-m2"
            value={m2}
            onChange={(e) => {
              setM2(e.target.value);
              const v = parseNumero(porM2);
              const s = parseNumero(e.target.value);
              if (v && s) setCosto(num(v * s));
            }}
            inputMode="decimal"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="hon-porm2">Costo de obra por m² ({moneda})</Label>
          <Input
            id="hon-porm2"
            value={porM2}
            onChange={(e) => {
              setPorM2(e.target.value);
              const v = parseNumero(e.target.value);
              if (v && superficie) setCosto(num(v * superficie));
            }}
            inputMode="decimal"
            placeholder="Ej.: 2.000"
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="hon-costo">Costo total de obra ({moneda})</Label>
          <Input
            id="hon-costo"
            value={costo}
            onChange={(e) => {
              setCosto(e.target.value);
              setPorM2("");
            }}
            inputMode="decimal"
          />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <Checkbox id="hon-iva" checked={conIva} onCheckedChange={(v) => setConIva(v === true)} />
          <Label htmlFor="hon-iva" className="font-normal">
            Sumar IVA ({num(config.iva)} %)
          </Label>
        </div>
      </div>

      {superficie > 0 && (
        <p className="text-sm text-muted-foreground">
          {cat.nombre}, {tramo}: <span className="font-medium text-foreground">{num(porcentajeDe(cat, superficie))} %</span> del costo de obra.
        </p>
      )}

      <ul className="divide-y rounded-md border text-sm">
        {filas.map((f) => (
          <li key={f.concepto} className={`flex items-center justify-between gap-3 px-3 py-1.5 ${f.fuerte ? "bg-muted/40 font-medium" : ""}`}>
            <span className={f.sub ? "pl-4 text-muted-foreground" : ""}>{f.concepto}</span>
            <span className="flex items-center gap-2">
              <span className="tabular-nums">{costoObra > 0 ? formatMonto(f.monto, moneda) : "—"}</span>
              {onUsar && (
                <Button type="button" variant="outline" size="sm" disabled={!(costoObra > 0)} onClick={() => onUsar(f.monto, f.concepto)}>
                  Usar
                </Button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
