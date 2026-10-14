"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Search } from "lucide-react";
import type { ObraListado } from "@/lib/obras/queries";
import { ESTADOS } from "@/lib/obras/constants";
import { formatM2, totalesSuperficie } from "@/lib/obras/superficies";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EstadoBadge } from "./estado-badge";

const TODAS = "todas";

function normalizar(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function ObrasTabla({ obras }: { obras: ObraListado[] }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<string>(TODAS);

  const filtradas = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return obras.filter((o) => {
      if (estado !== TODAS && o.estado !== estado) return false;
      if (!q) return true;
      return normalizar([o.titulo, o.cliente?.nombre, o.localidad, o.tipologia].filter(Boolean).join(" ")).includes(q);
    });
  }, [obras, busqueda, estado]);

  if (obras.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <Building2 className="size-8 text-muted-foreground" />
        <div>
          <p className="font-medium">Todavía no hay obras cargadas</p>
          <p className="text-sm text-muted-foreground">Empezá por la primera: el asistente te pide los datos de a uno.</p>
        </div>
        <Button asChild>
          <Link href="/admin/obras/nueva">Cargar una obra</Link>
        </Button>
      </Card>
    );
  }

  const href = (o: ObraListado) =>
    o.borrador ? `/admin/obras/${o.id}/editar?paso=${o.asistente_paso}` : `/admin/obras/${o.id}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por obra, cliente o localidad"
            className="pl-8"
            aria-label="Buscar obras"
          />
        </div>
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todos los estados</SelectItem>
            {ESTADOS.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Obra</TableHead>
              <TableHead className="hidden sm:table-cell">Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Tipología</TableHead>
              <TableHead className="hidden lg:table-cell">Localidad</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Superficie</TableHead>
              <TableHead className="pr-4">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map((o) => {
              const total = totalesSuperficie(o, o.sectores).total;
              return (
                <TableRow key={o.id} className="cursor-pointer" onClick={() => router.push(href(o))}>
                  <TableCell className="pl-4 font-medium">
                    <Link href={href(o)} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                      {o.titulo}
                    </Link>
                    {o.borrador && (
                      <Badge variant="outline" className="ml-2 font-normal text-muted-foreground">
                        carga incompleta
                      </Badge>
                    )}
                    {o.cliente && (
                      <span className="block text-xs font-normal text-muted-foreground sm:hidden">{o.cliente.nombre}</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {o.cliente?.nombre ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{o.tipologia ?? "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{o.localidad ?? "—"}</TableCell>
                  <TableCell className="hidden text-right sm:table-cell">{total > 0 ? formatM2(total) : "—"}</TableCell>
                  <TableCell className="pr-4">
                    <EstadoBadge estado={o.estado} />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Ninguna obra coincide con la búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
