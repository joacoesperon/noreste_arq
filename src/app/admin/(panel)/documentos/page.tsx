import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { tipoDocumento } from "@/lib/documentos/tipos";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Documentos" };

const fecha = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" });

export default async function DocumentosPage() {
  const supabase = await createClient();
  const { data: documentos } = await supabase
    .from("documentos")
    .select("id, obra_id, tipo, titulo, version_actual, updated_at, obra:obras(titulo)")
    .order("updated_at", { ascending: false })
    .limit(200);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 md:p-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Documentos</h1>
        <p className="text-sm text-muted-foreground">
          Todos los documentos de las obras. Para crear uno, entrá a la obra → pestaña Documentos.
        </p>
      </div>
      {!documentos?.length ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Todavía no hay documentos.{" "}
          <Link href="/admin/obras" className="underline">
            Ir a obras
          </Link>
        </p>
      ) : (
        <Card className="py-0">
          <ul className="divide-y">
            {documentos.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/admin/obras/${d.obra_id}/documentos/${d.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 p-3 hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.obra?.titulo} · {tipoDocumento(d.tipo)?.nombre ?? d.tipo} · {fecha.format(new Date(d.updated_at))}
                      </p>
                    </div>
                  </div>
                  <Badge variant={d.version_actual > 0 ? "secondary" : "outline"}>
                    {d.version_actual > 0 ? `v${d.version_actual}` : "borrador"}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
