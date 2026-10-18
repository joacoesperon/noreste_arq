import { getStaff } from "@/lib/auth";
import { contarConsultasNuevas } from "@/lib/consultas/queries";
import { contarParaRevisar } from "@/lib/tareas/queries";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { NoAccess } from "@/components/admin/no-access";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Eye } from "lucide-react";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // El proxy ya exige sesión; acá se verifica que la cuenta sea del estudio.
  const staff = await getStaff();
  if (!staff) return <NoAccess />;
  const [paraRevisar, consultasNuevas] = await Promise.all([
    contarParaRevisar(staff.id).catch(() => 0),
    contarConsultasNuevas().catch(() => 0),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar staff={staff} paraRevisar={paraRevisar} consultasNuevas={consultasNuevas} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <span className="text-sm font-medium">noreste arq</span>
        </header>
        {staff.rol === "lectura" && (
          <div className="flex items-center gap-2 border-b bg-muted/60 px-4 py-2 text-sm text-muted-foreground">
            <Eye className="size-4 shrink-0" />
            Modo demostración: podés recorrer todo el panel, pero los cambios no se guardan.
          </div>
        )}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
