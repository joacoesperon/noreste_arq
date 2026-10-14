import type { Metadata } from "next";
import { listIndicesCac } from "@/lib/presupuestador/queries";
import { IndicesCac } from "@/components/admin/presupuestador/indices-cac";

export const metadata: Metadata = { title: "Índice CAC" };

export default async function IndiceCacPage() {
  return <IndicesCac indices={await listIndicesCac()} />;
}
