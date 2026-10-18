import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { datosEstudio } from "@/lib/documentos/estudio";

/**
 * Teléfono de Josefina (Datos del estudio) para las consultas de la web. Se lee con la
 * service role porque el visitante no tiene sesión; sin ella, usa los valores por defecto.
 */
export async function telefonoConsultas() {
  const supabase = createAdminClient();
  const { data } = supabase ? await supabase.from("estudio_config").select("datos").maybeSingle() : { data: null };
  const { telefonos } = datosEstudio(data?.datos);
  return (telefonos.find((t) => /josefina|fefa/i.test(t.nombre)) ?? telefonos[0]).numero;
}
