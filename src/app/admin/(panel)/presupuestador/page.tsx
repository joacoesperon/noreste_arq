import type { Metadata } from "next";
import Link from "next/link";
import { Calculator } from "lucide-react";
import { listPresupuestos } from "@/lib/presupuestador/queries";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Presupuestador" };

const fecha = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" });

export default async function PresupuestosPage() {
  const presupuestos = await listPresupuestos();
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Para crear un presupuesto, entrá a la obra → pestaña Presupuestos. Primero conviene cargar materiales y precios.
      </p>
      {presupuestos.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay presupuestos.</p>
      ) : (
        <Card className="py-0">
          <ul className="divide-y">
            {presupuestos.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/obras/${p.obra_id}/presupuestos/${p.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                  <Calculator className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.obra?.titulo} · {p.items[0]?.count ?? 0} ítems · {fecha.format(new Date(p.updated_at))}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
