import type { Metadata } from "next";
import Link from "next/link";
import { FileSpreadsheet, FileUp } from "lucide-react";
import { listListasPrecios } from "@/lib/presupuestador/queries";
import { formatFechaCorta } from "@/lib/documentos/formato";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EliminarLista } from "@/components/admin/presupuestador/eliminar-lista";

export const metadata: Metadata = { title: "Listas de precios" };

export default async function ListasPage() {
  const listas = await listListasPrecios();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Las listas que mandan los proveedores. Cada precio queda con su fuente y su fecha. Los precios sueltos se cargan
          desde Materiales.
        </p>
        <Button asChild>
          <Link href="/admin/presupuestador/precios/importar">
            <FileUp />
            Importar lista
          </Link>
        </Button>
      </div>
      {listas.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Todavía no se importó ninguna lista.</p>
      ) : (
        <Card className="py-0">
          <ul className="divide-y">
            {listas.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 p-3">
                <div className="flex min-w-0 items-start gap-3">
                  <FileSpreadsheet className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{l.proveedor?.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Lista del {formatFechaCorta(l.fecha)} · {l.items} precios · {l.moneda === "USD" ? "dólares" : "pesos"}
                      {l.archivo && ` · ${l.archivo}`}
                    </p>
                  </div>
                </div>
                <EliminarLista id={l.id} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
