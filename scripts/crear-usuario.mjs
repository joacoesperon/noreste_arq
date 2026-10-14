// Alta de una persona del estudio en el panel.
//
// Uso:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/crear-usuario.mjs <usuario> <contraseña> "<Nombre>" [admin|miembro]
//
// La service role key está en Supabase → Settings → API. No guardarla en el repo.
import { createClient } from "@supabase/supabase-js";

// Mismo dominio que src/lib/usernames.ts
const AUTH_EMAIL_DOMAIN = "usuarios.norestearq.com";

const [usuarioArg, password, nombre, rol = "miembro"] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!usuarioArg || !password || !nombre || !["admin", "miembro"].includes(rol)) {
  console.error('Uso: node scripts/crear-usuario.mjs <usuario> <contraseña> "<Nombre>" [admin|miembro]');
  process.exit(1);
}
if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const usuario = usuarioArg.trim().toLowerCase();
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data, error } = await supabase.auth.admin.createUser({
  email: `${usuario}@${AUTH_EMAIL_DOMAIN}`,
  password,
  email_confirm: true,
});
if (error) {
  console.error(`No se pudo crear la cuenta de «${usuario}»: ${error.message}`);
  process.exit(1);
}

const { error: staffError } = await supabase
  .from("staff")
  .insert({ id: data.user.id, usuario, nombre, rol });
if (staffError) {
  // Sin fila en staff la cuenta no sirve: se borra para poder reintentar.
  await supabase.auth.admin.deleteUser(data.user.id);
  console.error(`No se pudo dar de alta a «${usuario}» en staff: ${staffError.message}`);
  process.exit(1);
}

console.log(`✔ ${nombre} (@${usuario}, ${rol})`);
