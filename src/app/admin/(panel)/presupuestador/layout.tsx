import { NavPresupuestador } from "@/components/admin/presupuestador/nav";

export default function PresupuestadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Presupuestador</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo de materiales y mano de obra, precios de proveedores con su fecha, y presupuestos por obra.
        </p>
      </div>
      <NavPresupuestador />
      {children}
    </div>
  );
}
