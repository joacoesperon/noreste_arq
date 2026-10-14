import type { Metadata } from "next";
import { Asistente } from "../_components/asistente";

export const metadata: Metadata = { title: "Nueva obra" };

export default function NuevaObraPage() {
  return <Asistente obra={null} paso={1} clientes={[]} staff={[]} />;
}
