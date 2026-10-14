import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BUCKET_ARCHIVOS } from "@/lib/archivos/constants";
import { Button } from "@/components/ui/button";
import { VisorIfc } from "@/components/visor/visor-ifc";
import { CompartirVisor } from "./compartir-visor";

type Props = { params: Promise<{ id: string; archivoId: string }> };

export const metadata: Metadata = { title: "Visor 3D" };

export default async function VisorPanelPage({ params }: Props) {
  const { id, archivoId } = await params;
  const supabase = await createClient();

  const { data: archivo } = await supabase
    .from("archivos")
    .select("id, nombre, storage_path, obra_id, obra:obras(titulo)")
    .eq("id", archivoId)
    .eq("obra_id", id)
    .maybeSingle();
  if (!archivo) notFound();

  const [{ data: firmado }, { data: links }] = await Promise.all([
    supabase.storage.from(BUCKET_ARCHIVOS).createSignedUrl(archivo.storage_path, 60 * 60),
    supabase
      .from("visor_links")
      .select("id, token, expires_at")
      .eq("archivo_id", archivoId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);
  if (!firmado) notFound();

  return (
    <div className="flex h-svh flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={`/admin/obras/${id}?tab=archivos`} aria-label="Volver a la obra">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate font-semibold">{archivo.nombre}</h1>
            <p className="truncate text-xs text-muted-foreground">{archivo.obra?.titulo}</p>
          </div>
        </div>
        <CompartirVisor archivoId={archivo.id} links={links ?? []} />
      </div>
      <div className="min-h-0 flex-1">
        <VisorIfc url={firmado.signedUrl} nombre={archivo.nombre} />
      </div>
    </div>
  );
}
