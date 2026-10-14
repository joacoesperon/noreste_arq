"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Calculator, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { crearPresupuesto } from "@/app/admin/(panel)/presupuestador/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Presupuesto = { id: string; titulo: string; updated_at: string; items: { count: number }[] };

const fecha = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" });

export function PresupuestosObra({ obraId, presupuestos }: { obraId: string; presupuestos: Presupuesto[] }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Presupuestos de materiales y mano de obra con precios de proveedores. Los presupuestos de honorarios están en
          Documentos.
        </p>
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await crearPresupuesto(obraId);
              if (res && !res.ok) toast.error(res.error);
            })
          }
        >
          {pending ? <Loader2 className="animate-spin" /> : <Plus />}
          Nuevo presupuesto
        </Button>
      </div>
      {presupuestos.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay presupuestos de materiales.</p>
      ) : (
        <Card className="py-0">
          <ul className="divide-y">
            {presupuestos.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/obras/${obraId}/presupuestos/${p.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                  <Calculator className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.items[0]?.count ?? 0} ítems · {fecha.format(new Date(p.updated_at))}
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
