import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listObras } from "@/lib/obras/queries";
import { Button } from "@/components/ui/button";
import { ObrasTabla } from "./_components/obras-tabla";

export const metadata: Metadata = { title: "Obras" };

export default async function ObrasPage() {
  const obras = await listObras();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Obras</h1>
          <p className="text-sm text-muted-foreground">Cada obra se carga una vez y es la base de todo lo demás.</p>
        </div>
        <Button asChild>
          <Link href="/admin/obras/nueva">
            <Plus />
            Nueva obra
          </Link>
        </Button>
      </div>
      <ObrasTabla obras={obras} />
    </div>
  );
}
