"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Box, Download, Eye, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Archivo } from "@/lib/archivos/queries";
import type { StaffOption } from "@/lib/obras/queries";
import {
  BUCKET_ARCHIVOS,
  CATEGORIAS_ARCHIVO,
  TAMANO_MAXIMO,
  formatTamano,
  nombreSeguro,
} from "@/lib/archivos/constants";
import { createClient } from "@/lib/supabase/client";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { eliminarArchivo, registrarArchivo, urlArchivo } from "../archivos-actions";

type Categoria = (typeof CATEGORIAS_ARCHIVO)[number];

const fechaFormat = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

// Formatos que el navegador puede mostrar sin descargar.
const VISIBLES = /^(image\/|application\/pdf|text\/plain)/;

export function ArchivosObra({
  obraId,
  archivos,
  staff,
}: {
  obraId: string;
  archivos: Archivo[];
  staff: StaffOption[];
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [categoria, setCategoria] = useState<Categoria>("Planos");
  const [filtro, setFiltro] = useState<Categoria | null>(null);
  const [subiendo, setSubiendo] = useState<string[]>([]);
  const [aBorrar, setABorrar] = useState<Archivo | null>(null);
  const [pending, startTransition] = useTransition();

  const nombre = (id: string | null) => staff.find((s) => s.id === id)?.nombre ?? "—";
  const visibles = filtro ? archivos.filter((a) => a.categoria === filtro) : archivos;
  const conteo = (c: Categoria) => archivos.filter((a) => a.categoria === c).length;

  const subir = async (files: File[]) => {
    const grandes = files.filter((f) => f.size > TAMANO_MAXIMO);
    if (grandes.length > 0) {
      toast.error(`Superan los ${formatTamano(TAMANO_MAXIMO)}: ${grandes.map((f) => f.name).join(", ")}`);
    }
    const validos = files.filter((f) => f.size <= TAMANO_MAXIMO);
    if (validos.length === 0) return;

    const supabase = createClient();
    setSubiendo(validos.map((f) => f.name));
    let ok = 0;

    for (const file of validos) {
      const path = `${obraId}/${crypto.randomUUID()}-${nombreSeguro(file.name)}`;
      const { error } = await supabase.storage
        .from(BUCKET_ARCHIVOS)
        .upload(path, file, { contentType: file.type || undefined });
      if (error) {
        toast.error(`No se pudo subir ${file.name}`);
      } else {
        const res = await registrarArchivo({
          obra_id: obraId,
          categoria,
          nombre: file.name,
          storage_path: path,
          tamano: file.size,
          mime: file.type || null,
        });
        if (res.ok) ok++;
        else toast.error(`${file.name}: ${res.error}`);
      }
      setSubiendo((prev) => prev.filter((n) => n !== file.name));
    }

    if (ok > 0) toast.success(ok === 1 ? "Archivo subido" : `${ok} archivos subidos`);
    router.refresh();
  };

  const abrir = (archivo: Archivo, descargar: boolean) =>
    startTransition(async () => {
      // Abrir la pestaña antes del await: si no, el navegador la bloquea como popup.
      const ventana = descargar ? null : window.open("", "_blank");
      const res = await urlArchivo(archivo.id);
      if ("error" in res) {
        ventana?.close();
        toast.error(res.error);
        return;
      }
      if (ventana) {
        ventana.location.href = res.url;
        return;
      }
      // Descarga vía blob para conservar el nombre original (con acentos) del archivo.
      try {
        const blob = await (await fetch(res.url)).blob();
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = archivo.nombre;
        a.click();
        URL.revokeObjectURL(href);
      } catch {
        toast.error("No se pudo descargar el archivo.");
      }
    });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={categoria} onValueChange={(v) => setCategoria(v as Categoria)}>
            <SelectTrigger className="w-full sm:w-56" aria-label="Categoría">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS_ARCHIVO.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            ref={input}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              subir(files);
            }}
          />
          <Button onClick={() => input.current?.click()} disabled={subiendo.length > 0}>
            {subiendo.length > 0 ? <Loader2 className="animate-spin" /> : <Upload />}
            {subiendo.length > 0 ? `Subiendo ${subiendo.length}…` : "Subir archivos"}
          </Button>
          <span className="text-xs text-muted-foreground">
            Hasta {formatTamano(TAMANO_MAXIMO)} por archivo. El visor 3D abre modelos IFC (desde Revit: Exportar → IFC).
          </span>
        </CardContent>
      </Card>

      {archivos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Button size="xs" variant={filtro === null ? "default" : "outline"} onClick={() => setFiltro(null)}>
            Todos · {archivos.length}
          </Button>
          {CATEGORIAS_ARCHIVO.filter((c) => conteo(c) > 0).map((c) => (
            <Button key={c} size="xs" variant={filtro === c ? "default" : "outline"} onClick={() => setFiltro(c)}>
              {c} · {conteo(c)}
            </Button>
          ))}
        </div>
      )}

      {archivos.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Todavía no hay archivos. Elegí la categoría y subí planos, contratos firmados, fotos o facturas.
        </p>
      ) : (
        <Card className="py-0">
          <ul className="divide-y">
            {visibles.map((a) => (
              <li key={a.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{a.nombre}</span>
                    <span className="text-xs text-muted-foreground">
                      {[formatTamano(a.tamano), fechaFormat.format(new Date(a.created_at)), nombre(a.subido_por)]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 pl-7 sm:pl-0">
                  <Badge variant="secondary" className={cn(filtro && "hidden")}>
                    {a.categoria}
                  </Badge>
                  {/\.ifc$/i.test(a.nombre) && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/obras/${obraId}/visor/${a.id}`}>
                        <Box />
                        Ver 3D
                      </Link>
                    </Button>
                  )}
                  {a.mime && VISIBLES.test(a.mime) && (
                    <Button size="icon-sm" variant="ghost" onClick={() => abrir(a, false)} disabled={pending} aria-label="Ver">
                      <Eye />
                    </Button>
                  )}
                  <Button size="icon-sm" variant="ghost" onClick={() => abrir(a, true)} disabled={pending} aria-label="Descargar">
                    <Download />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setABorrar(a)}
                    aria-label="Eliminar"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <AlertDialog open={aBorrar !== null} onOpenChange={(v) => !v && setABorrar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar «{aBorrar?.nombre}»?</AlertDialogTitle>
            <AlertDialogDescription>Se borra el archivo de la obra. No se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const a = aBorrar;
                if (!a) return;
                startTransition(async () => {
                  const res = await eliminarArchivo(a.id);
                  if (!res.ok) toast.error(res.error);
                  else toast.success("Archivo eliminado");
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
