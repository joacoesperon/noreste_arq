/**
 * Supabase Auth identifica a cada cuenta por correo. Para ingresar con nombre
 * de usuario, cada persona tiene un correo interno en este dominio (sin casilla real).
 * El correo de contacto para notificaciones está en `staff.email`.
 */
export const AUTH_EMAIL_DOMAIN = "usuarios.norestearq.com";

export function normalizeUsername(usuario: string) {
  return usuario.trim().toLowerCase();
}

export function usernameToAuthEmail(usuario: string) {
  return `${normalizeUsername(usuario)}@${AUTH_EMAIL_DOMAIN}`;
}
