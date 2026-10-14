import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { configHonorarios } from "@/lib/honorarios/calculo";
import { ConfigHonorariosForm } from "@/components/admin/honorarios/config-honorarios";

export const metadata: Metadata = { title: "Honorarios" };

export default async function HonorariosPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("estudio_config").select("honorarios").maybeSingle();
  return <ConfigHonorariosForm inicial={configHonorarios(data?.honorarios)} personalizada={!!data?.honorarios} />;
}
