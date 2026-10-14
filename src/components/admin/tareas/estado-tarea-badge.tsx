import { Badge } from "@/components/ui/badge";
import { estadoTareaLabel } from "@/lib/tareas/constants";
import { cn } from "@/lib/utils";

const estilos: Record<string, string> = {
  pendiente: "",
  en_curso: "border-transparent bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  en_revision: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  completada: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
};

export function EstadoTareaBadge({ estado, className }: { estado: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn(estilos[estado], className)}>
      {estadoTareaLabel(estado)}
    </Badge>
  );
}
