"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { JSONContent } from "@tiptap/react";
import { AlertTriangle, ArrowLeft, FileDown, FileText, History, Loader2, RefreshCw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  contenidoPlantilla,
  crearVersion,
  eliminarDocumento,
  guardarBorrador,
  obtenerVersion,
} from "@/app/admin/(panel)/documentos/actions";
import { faltantes, type Bloque } from "@/lib/documentos/bloques";
import type { ContextoDocumento } from "@/lib/documentos/datos";
import { resolverDocumento } from "@/lib/documentos/resolver";
import { tipoDocumento } from "@/lib/documentos/tipos";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CamposDocumento } from "./campos-documento";
import { EditorTexto } from "./editor-texto";
import { descargarDocx, descargarPdf } from "./exportar";
import { VistaDocumento } from "./vista-documento";

type Version = { id: string; numero: number; nota: string | null; created_at: string; autor: string | null };

const fechaHora = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

export function EditorDocumento({
  documento,
  obra,
  contexto,
  versiones,
}: {
  documento: { id: string; tipo: string; titulo: string; contenido: JSONContent; datos: Record<string, unknown>; version_actual: number };
  obra: { id: string; titulo: string };
  contexto: ContextoDocumento;
  versiones: Version[];
}) {
  const tipo = tipoDocumento(documento.tipo)!;
  const [titulo, setTitulo] = useState(documento.titulo);
  const [contenido, setContenido] = useState<JSONContent>(documento.contenido);
  const [datos, setDatos] = useState(documento.datos);
  const [sucio, setSucio] = useState(false);
  const [nota, setNota] = useState("");
  const [versionOpen, setVersionOpen] = useState(false);
  const [exportando, setExportando] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resuelto = useMemo(
    () => resolverDocumento({ titulo, tipo, contenido, datos, contexto }),
    [titulo, tipo, contenido, datos, contexto]
  );
  const pendientes = faltantes(resuelto.bloques);
  const datosDocumento = tipo.campos.filter((c) => c.tipo !== "items").map((c) => ({ key: `doc.${c.key}`, label: c.label }));

  const cambiar = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setSucio(true);
  };

  const payload = () => ({ titulo, contenido, datos });

  const guardar = () =>
    startTransition(async () => {
      const res = await guardarBorrador(documento.id, payload());
      if (!res.ok) return void toast.error(res.error);
      setSucio(false);
      toast.success("Borrador guardado");
    });

  const nuevaVersion = () =>
    startTransition(async () => {
      const res = await crearVersion(documento.id, payload(), resuelto.bloques, nota);
      if (!res.ok) return void toast.error(res.error);
      setSucio(false);
      setNota("");
      setVersionOpen(false);
      toast.success(`Versión ${res.numero} guardada`);
    });

  const exportar = async (formato: "pdf" | "docx", doc: { titulo: string; bloques: Bloque[] }, nombre: string) => {
    setExportando(formato);
    try {
      if (formato === "pdf") await descargarPdf(doc, nombre);
      else await descargarDocx(doc, nombre);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo generar el archivo.");
    } finally {
      setExportando(null);
    }
  };

  const exportarVersion = async (v: Version, formato: "pdf" | "docx") => {
    const data = await obtenerVersion(v.id);
    if (!data) return void toast.error("No se pudo cargar la versión.");
    const t = data.documento?.titulo ?? titulo;
    await exportar(formato, { titulo: t, bloques: data.bloques as Bloque[] }, `${t} - v${data.numero}`);
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href={`/admin/obras/${obra.id}?tab=documentos`} aria-label="Volver a la obra">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <Input
            value={titulo}
            onChange={(e) => cambiar(setTitulo)(e.target.value)}
            className="h-9 border-transparent px-1 text-lg font-semibold shadow-none hover:border-input"
            aria-label="Título del documento"
          />
          <p className="px-1 text-xs text-muted-foreground">
            {tipo.nombre} · {obra.titulo} ·{" "}
            {documento.version_actual > 0 ? `última versión: v${documento.version_actual}` : "sin versiones"}
            {sucio && " · cambios sin guardar"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={guardar} disabled={pending || !sucio}>
            <Save />
            Guardar borrador
          </Button>

          <Dialog open={versionOpen} onOpenChange={setVersionOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={pending}>
                <History />
                Guardar como v{documento.version_actual + 1}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Guardar versión {documento.version_actual + 1}</DialogTitle>
                <DialogDescription>
                  La versión queda guardada tal como se ve ahora, con su fecha, aunque después cambien los datos de la obra.
                </DialogDescription>
              </DialogHeader>
              {pendientes.length > 0 && (
                <p className="flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  Faltan {pendientes.length} {pendientes.length === 1 ? "dato" : "datos"}: {pendientes.join(", ")}.
                </p>
              )}
              <Textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota (opcional): qué cambió" rows={2} />
              <DialogFooter>
                <Button onClick={nuevaVersion} disabled={pending}>
                  {pending ? "Guardando…" : `Guardar v${documento.version_actual + 1}`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={exportando !== null}>
                {exportando ? <Loader2 className="animate-spin" /> : <FileDown />}
                Descargar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Borrador actual</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => exportar("pdf", resuelto, titulo)}>
                <FileText />
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportar("docx", resuelto, titulo)}>
                <FileText />
                Word (editable)
              </DropdownMenuItem>
              {versiones.length > 0 && <DropdownMenuSeparator />}
              {versiones.slice(0, 8).map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-2 px-2 py-1 text-sm">
                  <span>v{v.numero}</span>
                  <span className="flex gap-1">
                    <Button variant="ghost" size="xs" onClick={() => exportarVersion(v, "pdf")}>
                      PDF
                    </Button>
                    <Button variant="ghost" size="xs" onClick={() => exportarVersion(v, "docx")}>
                      Word
                    </Button>
                  </span>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {pendientes.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            Faltan datos (resaltados en el documento): {pendientes.join(", ")}. Completalos en «Datos» o en la ficha de la
            obra.
          </span>
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Tabs defaultValue="datos" className="min-w-0">
          <TabsList>
            <TabsTrigger value="datos">Datos</TabsTrigger>
            <TabsTrigger value="texto">Texto</TabsTrigger>
            <TabsTrigger value="versiones">
              Versiones{versiones.length > 0 && <Badge variant="secondary" className="ml-1">{versiones.length}</Badge>}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="datos" className="mt-4">
            <CamposDocumento campos={tipo.campos} datos={datos} onChange={cambiar(setDatos)} />
            <p className="mt-6 text-xs text-muted-foreground">
              Los datos de la obra, el cliente y el estudio se completan solos desde la{" "}
              <Link href={`/admin/obras/${obra.id}`} className="underline">
                ficha de la obra
              </Link>
              .
            </p>
          </TabsContent>
          <TabsContent value="texto" className="mt-4 flex flex-col gap-3">
            <EditorTexto contenido={contenido} onChange={cambiar(setContenido)} datosDocumento={datosDocumento} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="self-start">
                  <RefreshCw />
                  Volver a la plantilla
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Reemplazar el texto por la plantilla actual?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se pierden los retoques hechos en el texto de este documento. Los datos y las versiones guardadas se
                    conservan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      startTransition(async () => {
                        const c = await contenidoPlantilla(documento.tipo);
                        if (!c) return void toast.error("No se pudo cargar la plantilla.");
                        cambiar(setContenido)(c);
                      })
                    }
                  >
                    Reemplazar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>
          <TabsContent value="versiones" className="mt-4">
            {versiones.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavía no hay versiones. Cuando el documento esté listo para mandar, guardalo como v1.
              </p>
            ) : (
              <ul className="flex flex-col divide-y rounded-lg border">
                {versiones.map((v) => (
                  <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                    <div>
                      <span className="font-medium">v{v.numero}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {fechaHora.format(new Date(v.created_at))}
                        {v.autor && ` · ${v.autor}`}
                      </span>
                      {v.nota && <p className="text-muted-foreground">{v.nota}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="xs" onClick={() => exportarVersion(v, "pdf")} disabled={exportando !== null}>
                        PDF
                      </Button>
                      <Button variant="outline" size="xs" onClick={() => exportarVersion(v, "docx")} disabled={exportando !== null}>
                        Word
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-6 text-destructive hover:text-destructive">
                  <Trash2 />
                  Eliminar documento
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar «{titulo}»?</AlertDialogTitle>
                  <AlertDialogDescription>Se borra con todas sus versiones. No se puede deshacer.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() =>
                      startTransition(async () => {
                        const res = await eliminarDocumento(documento.id);
                        if (res && !res.ok) toast.error(res.error);
                      })
                    }
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>
        </Tabs>

        <div className="min-w-0 rounded-xl bg-muted/50 p-3 sm:p-6">
          <p className="mb-3 text-xs text-muted-foreground">Vista previa</p>
          <VistaDocumento documento={resuelto} />
        </div>
      </div>
    </div>
  );
}
