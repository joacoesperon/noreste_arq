"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { guardarHonorarios } from "@/app/admin/(panel)/documentos/actions";
import { parseNumero } from "@/lib/documentos/formato";
import { HONORARIOS_BASE, ordenarTramos, type ConfigHonorarios } from "@/lib/honorarios/calculo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalculadoraHonorarios } from "./calculadora";

// Los números se editan como texto (coma decimal) y se convierten al guardar.
type TramoForm = { hasta: string; porcentaje: string };
type Form = {
  categorias: { clave: ConfigHonorarios["categorias"][number]["clave"]; nombre: string; proyecto: string; tramos: TramoForm[] }[];
  anteproyecto: string;
  municipal: string;
  ejecutivo: string;
  factorEjecutiva: string;
  iva: string;
};

const txt = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 4, useGrouping: false });

function aForm(c: ConfigHonorarios): Form {
  return {
    categorias: c.categorias.map((cat) => ({
      clave: cat.clave,
      nombre: cat.nombre,
      proyecto: txt(cat.proyecto),
      tramos: cat.tramos.map((t) => ({ hasta: t.hasta === null ? "" : txt(t.hasta), porcentaje: txt(t.porcentaje) })),
    })),
    anteproyecto: txt(c.anteproyecto),
    municipal: txt(c.municipal),
    ejecutivo: txt(c.ejecutivo),
    factorEjecutiva: txt(c.factorEjecutiva),
    iva: txt(c.iva),
  };
}

function aConfig(f: Form): ConfigHonorarios {
  const n = (v: string) => parseNumero(v) ?? -1;
  return {
    categorias: f.categorias.map((c) => ({
      clave: c.clave,
      nombre: c.nombre,
      proyecto: n(c.proyecto),
      tramos: ordenarTramos(c.tramos.map((t) => ({ hasta: t.hasta.trim() ? n(t.hasta) : null, porcentaje: n(t.porcentaje) }))),
    })),
    anteproyecto: n(f.anteproyecto),
    municipal: n(f.municipal),
    ejecutivo: n(f.ejecutivo),
    factorEjecutiva: n(f.factorEjecutiva),
    iva: n(f.iva),
  };
}

function CampoNumero({ id, label, value, onChange, sufijo }: { id: string; label: string; value: string; onChange: (v: string) => void; sufijo?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" className={sufijo ? "pr-7" : ""} />
        {sufijo && <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">{sufijo}</span>}
      </div>
    </div>
  );
}

export function ConfigHonorariosForm({ inicial, personalizada }: { inicial: ConfigHonorarios; personalizada: boolean }) {
  const [form, setForm] = useState<Form>(() => aForm(inicial));
  const [pending, startTransition] = useTransition();
  const config = aConfig(form);
  const valida = config.categorias.every((c) => c.proyecto >= 0 && c.tramos.every((t) => t.porcentaje >= 0 && (t.hasta === null || t.hasta > 0)));

  const setCat = (i: number, cambio: Partial<Form["categorias"][number]>) =>
    setForm((f) => ({ ...f, categorias: f.categorias.map((c, j) => (j === i ? { ...c, ...cambio } : c)) }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 md:p-10">
      <div className="flex flex-col gap-1">
        <Button variant="ghost" size="sm" className="-ml-2 self-start" asChild>
          <Link href="/admin/plantillas">
            <ArrowLeft />
            Plantillas
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Honorarios</h1>
        <p className="text-sm text-muted-foreground">
          Porcentaje del costo de obra según el tipo de obra y la superficie, como en la planilla del estudio. Se usa en el botón
          «Calcular» de los honorarios de propuestas y contratos.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const res = await guardarHonorarios(config);
              if (!res.ok) return void toast.error(res.error);
              toast.success("Tabla de honorarios guardada");
            });
          }}
        >
          {form.categorias.map((c, i) => (
            <Card key={c.clave} className="gap-3">
              <CardHeader>
                <CardTitle className="text-base">{c.nombre}</CardTitle>
                <CardDescription>Cada tramo vale para obras de menos de esos m². El último, sin límite, para las más grandes.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  {c.tramos.map((t, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm">
                      <span className="w-20 shrink-0 text-muted-foreground">{t.hasta.trim() ? "Menos de" : "Sin límite"}</span>
                      <Input
                        value={t.hasta}
                        onChange={(e) => setCat(i, { tramos: c.tramos.map((x, k) => (k === j ? { ...x, hasta: e.target.value } : x)) })}
                        inputMode="decimal"
                        placeholder="—"
                        className="w-24"
                        aria-label="Hasta m²"
                      />
                      <span className="text-muted-foreground">m²</span>
                      <div className="relative">
                        <Input
                          value={t.porcentaje}
                          onChange={(e) => setCat(i, { tramos: c.tramos.map((x, k) => (k === j ? { ...x, porcentaje: e.target.value } : x)) })}
                          inputMode="decimal"
                          className="w-24 pr-6"
                          aria-label="Porcentaje"
                        />
                        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setCat(i, { tramos: c.tramos.filter((_, k) => k !== j) })}
                        disabled={c.tramos.length === 1}
                        aria-label="Quitar tramo"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => setCat(i, { tramos: [...c.tramos, { hasta: "", porcentaje: "" }] })}
                  >
                    <Plus />
                    Agregar tramo
                  </Button>
                </div>
                <div className="grid max-w-md grid-cols-2 gap-3">
                  <CampoNumero id={`proy-${c.clave}`} label="Proyecto" value={c.proyecto} onChange={(v) => setCat(i, { proyecto: v })} sufijo="%" />
                  <div className="flex flex-col gap-2">
                    <Label>Dirección</Label>
                    <p className="flex h-9 items-center text-sm text-muted-foreground">
                      {parseNumero(c.proyecto) !== null ? `${txt(100 - (parseNumero(c.proyecto) ?? 0))} %` : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-base">Reparto y recargos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <CampoNumero id="h-ante" label="Anteproyecto" value={form.anteproyecto} onChange={(v) => setForm({ ...form, anteproyecto: v })} sufijo="%" />
              <CampoNumero id="h-muni" label="Proyecto municipal" value={form.municipal} onChange={(v) => setForm({ ...form, municipal: v })} sufijo="%" />
              <CampoNumero id="h-ejec" label="Proyecto ejecutivo" value={form.ejecutivo} onChange={(v) => setForm({ ...form, ejecutivo: v })} sufijo="%" />
              <CampoNumero
                id="h-factor"
                label="Dirección ejecutiva (× dirección)"
                value={form.factorEjecutiva}
                onChange={(v) => setForm({ ...form, factorEjecutiva: v })}
              />
              <CampoNumero id="h-iva" label="IVA" value={form.iva} onChange={(v) => setForm({ ...form, iva: v })} sufijo="%" />
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending || !valida}>
              <Save />
              {pending ? "Guardando…" : "Guardar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await guardarHonorarios(null);
                  if (!res.ok) return void toast.error(res.error);
                  setForm(aForm(HONORARIOS_BASE));
                  toast.success("Se volvió a la tabla de la planilla");
                })
              }
            >
              <RotateCcw />
              Volver a la planilla original
            </Button>
          </div>
          {!personalizada && <p className="text-xs text-muted-foreground">Ahora se usa la tabla de la planilla «NE - CAJA».</p>}
        </form>

        <Card className="h-fit gap-3 lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="text-base">Probar</CardTitle>
            <CardDescription>Con los valores de la izquierda, aunque todavía no estén guardados.</CardDescription>
          </CardHeader>
          <CardContent>{valida && <CalculadoraHonorarios config={config} categoria="vivienda" m2={0} moneda="USD" />}</CardContent>
        </Card>
      </div>
    </div>
  );
}
