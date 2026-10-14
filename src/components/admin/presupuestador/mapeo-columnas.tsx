"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cantidadColumnas } from "@/lib/presupuestador/leer-tabla";

const NINGUNA = "-1";

export type Rol = { key: string; label: string; obligatorio?: boolean };

/** Elegir qué columna del archivo es cada dato, viendo las primeras filas. */
export function MapeoColumnas({
  filas,
  roles,
  mapeo,
  onMapeo,
  encabezado,
  onEncabezado,
}: {
  filas: string[][];
  roles: Rol[];
  mapeo: Record<string, number>;
  onMapeo: (m: Record<string, number>) => void;
  encabezado: boolean;
  onEncabezado: (v: boolean) => void;
}) {
  const n = cantidadColumnas(filas);
  const nombreColumna = (i: number) => (encabezado && filas[0]?.[i] ? filas[0][i] : `Columna ${i + 1}`);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {roles.map((r) => (
          <div key={r.key} className="flex flex-col gap-2">
            <Label>
              {r.label}
              {r.obligatorio ? " *" : <span className="font-normal text-muted-foreground"> (opcional)</span>}
            </Label>
            <Select value={String(mapeo[r.key] ?? NINGUNA)} onValueChange={(v) => onMapeo({ ...mapeo, [r.key]: Number(v) })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NINGUNA}>—</SelectItem>
                {Array.from({ length: n }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {nombreColumna(i)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="encabezado" checked={encabezado} onCheckedChange={(v) => onEncabezado(v === true)} />
        <Label htmlFor="encabezado" className="font-normal">
          La primera fila tiene los títulos de las columnas
        </Label>
      </div>
      <div className="max-h-72 overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: n }, (_, i) => {
                const rol = roles.find((r) => mapeo[r.key] === i);
                return (
                  <TableHead key={i} className="whitespace-nowrap">
                    {nombreColumna(i)}
                    {rol && <span className="ml-1 text-xs font-normal text-primary">→ {rol.label}</span>}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.slice(encabezado ? 1 : 0, (encabezado ? 1 : 0) + 8).map((f, i) => (
              <TableRow key={i}>
                {Array.from({ length: n }, (_, j) => (
                  <TableCell key={j} className="max-w-60 truncate text-xs">
                    {f[j] ?? ""}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/** Adivina las columnas por los títulos. */
export function adivinarMapeo(filas: string[][], pistas: Record<string, RegExp>) {
  const cab = (filas[0] ?? []).map((c) => c.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""));
  const mapeo: Record<string, number> = {};
  for (const [key, re] of Object.entries(pistas)) {
    const i = cab.findIndex((c) => re.test(c));
    if (i >= 0) mapeo[key] = i;
  }
  return mapeo;
}
