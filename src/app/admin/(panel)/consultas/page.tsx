import type { Metadata } from "next";
import { listConsultas } from "@/lib/consultas/queries";
import { Consultas } from "@/components/admin/consultas/consultas";

export const metadata: Metadata = { title: "Consultas" };

export default async function ConsultasPage() {
  const consultas = await listConsultas().catch(() => []);
  return <Consultas consultas={consultas} />;
}
