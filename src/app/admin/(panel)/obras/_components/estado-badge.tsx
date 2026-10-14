import { Badge } from "@/components/ui/badge";
import { estadoLabel } from "@/lib/obras/constants";

const variantes: Record<string, "default" | "secondary" | "outline"> = {
  propuesta: "outline",
  en_proyecto: "secondary",
  en_obra: "default",
  terminada: "outline",
};

export function EstadoBadge({ estado }: { estado: string }) {
  return <Badge variant={variantes[estado] ?? "outline"}>{estadoLabel(estado)}</Badge>;
}
