"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { guardarEstudio } from "@/app/admin/(panel)/documentos/actions";
import type { DatosEstudio } from "@/lib/documentos/estudio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CAMPOS = [
  ["nombre", "Nombre del estudio"],
  ["email", "Correo"],
  ["instagram", "Instagram"],
  ["web", "Sitio web"],
  ["ciudad", "Ciudad"],
  ["domicilio", "Domicilio legal (contratos)"],
] as const;

export function DatosEstudioForm({ inicial }: { inicial: DatosEstudio }) {
  const [datos, setDatos] = useState(inicial);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof DatosEstudio>(k: K, v: DatosEstudio[K]) => setDatos((d) => ({ ...d, [k]: v }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 md:p-10">
      <div className="flex flex-col gap-1">
        <Button variant="ghost" size="sm" className="-ml-2 self-start" asChild>
          <Link href="/admin/plantillas">
            <ArrowLeft />
            Plantillas
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Datos del estudio</h1>
        <p className="text-sm text-muted-foreground">
          Van en el encabezado y el pie de todos los documentos, y en los contratos ({"{{estudio.firmantes}}"}).
        </p>
      </div>

      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const res = await guardarEstudio(datos);
            if (!res.ok) toast.error(res.error);
            else toast.success("Datos guardados");
          });
        }}
      >
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {CAMPOS.map(([k, label]) => (
              <div key={k} className="flex flex-col gap-2">
                <Label htmlFor={`estudio-${k}`}>{label}</Label>
                <Input id={`estudio-${k}`} value={datos[k]} onChange={(e) => set(k, e.target.value)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Firmantes</CardTitle>
            <CardDescription>Firman los contratos por el estudio. El DNI aparece en el contrato; la matrícula, en el contrato para Argentina (CPAU).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {datos.firmantes.map((f, i) => (
              <div key={i} className="grid grid-cols-[4.5rem_1fr_2rem] gap-2 border-b pb-2 sm:grid-cols-[4.5rem_1fr_8rem_10rem_2rem] sm:border-0 sm:pb-0">
                <Input value={f.titulo} onChange={(e) => set("firmantes", datos.firmantes.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)))} placeholder="Arq." aria-label="Título" />
                <Input value={f.nombre} onChange={(e) => set("firmantes", datos.firmantes.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)))} placeholder="Nombre y apellido" aria-label="Nombre" />
                <Input value={f.dni} onChange={(e) => set("firmantes", datos.firmantes.map((x, j) => (j === i ? { ...x, dni: e.target.value } : x)))} placeholder="DNI" inputMode="numeric" aria-label="DNI" />
                <Input value={f.matricula ?? ""} onChange={(e) => set("firmantes", datos.firmantes.map((x, j) => (j === i ? { ...x, matricula: e.target.value } : x)))} placeholder="Matrícula (ej.: CPAU 12.345)" aria-label="Matrícula" />
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => set("firmantes", datos.firmantes.filter((_, j) => j !== i))} aria-label="Quitar firmante">
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => set("firmantes", [...datos.firmantes, { titulo: "Arq.", nombre: "", dni: "", matricula: "" }])}>
              <Plus />
              Agregar firmante
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teléfonos del pie</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {datos.telefonos.map((t, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_2rem] gap-2">
                <Input value={t.numero} onChange={(e) => set("telefonos", datos.telefonos.map((x, j) => (j === i ? { ...x, numero: e.target.value } : x)))} placeholder="+54 9 11 …" aria-label="Número" />
                <Input value={t.nombre} onChange={(e) => set("telefonos", datos.telefonos.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)))} placeholder="Nombre" aria-label="Nombre" />
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => set("telefonos", datos.telefonos.filter((_, j) => j !== i))} aria-label="Quitar teléfono">
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => set("telefonos", [...datos.telefonos, { numero: "", nombre: "" }])}>
              <Plus />
              Agregar teléfono
            </Button>
          </CardContent>
        </Card>

        <Button type="submit" disabled={pending} className="self-end">
          <Save />
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </div>
  );
}
