"use server";

import { redirect } from "next/navigation";
import { getStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { usernameToAuthEmail } from "@/lib/usernames";

export type LoginState = { error: string | null };

function safeNext(next: FormDataEntryValue | null) {
  // Solo redirigir dentro del panel, nunca a otro origen.
  if (typeof next === "string" && next.startsWith("/admin") && !next.startsWith("/admin/login")) {
    return next;
  }
  return "/admin";
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const usuario = String(formData.get("usuario") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!usuario || !password) {
    return { error: "Completá el usuario y la contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToAuthEmail(usuario),
    password,
  });

  if (error) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export type ChangePasswordState = { error: string | null; ok: boolean };

const MIN_PASSWORD_LENGTH = 8;

export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const actual = String(formData.get("actual") ?? "");
  const nueva = String(formData.get("nueva") ?? "");
  const repetida = String(formData.get("repetida") ?? "");

  if (nueva.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` };
  }
  if (nueva !== repetida) {
    return { ok: false, error: "Las contraseñas nuevas no coinciden." };
  }
  if (nueva === actual) {
    return { ok: false, error: "La nueva contraseña tiene que ser distinta de la actual." };
  }

  const staff = await getStaff();
  if (!staff) return { ok: false, error: "Tu sesión venció. Volvé a ingresar." };
  if (staff.rol === "lectura") return { ok: false, error: "Este usuario es de solo lectura." };

  const supabase = await createClient();

  // Confirmar la contraseña actual antes de cambiarla.
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: usernameToAuthEmail(staff.usuario),
    password: actual,
  });
  if (authError) return { ok: false, error: "La contraseña actual no es correcta." };

  const { error } = await supabase.auth.updateUser({ password: nueva });
  if (error) return { ok: false, error: "No se pudo cambiar la contraseña. Probá con otra." };

  return { ok: true, error: null };
}
