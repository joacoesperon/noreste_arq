import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <main className="flex min-h-[60svh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-lg font-semibold">Página no encontrada</h1>
      <p className="text-sm text-muted-foreground">Esta sección del panel no existe.</p>
      <Button asChild variant="outline">
        <Link href="/admin">Volver al tablero</Link>
      </Button>
    </main>
  );
}
