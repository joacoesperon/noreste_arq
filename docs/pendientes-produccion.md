# Pendientes para producción

Supabase de producción: `aqfbxebcyifaerlripgj` (acceso confirmado el 14/10/2026).
Estado leído ese día: RLS desactivado en `projects` y el rol anónimo con permiso de escritura
(cualquiera podía editar o borrar obras con la clave pública), registro público abierto, sin usuarios.

## A. Supabase (desde la raíz del repo, con `npx supabase login` hecho)

1. Migraciones (cierra el agujero apenas se aplica la primera):
   ```bash
   python3 scripts/aplicar-migraciones.py aqfbxebcyifaerlripgj --base-aplicada
   ```
   Desde ese momento el admin viejo de la web no puede guardar hasta publicar el código nuevo (paso B).

2. Usuarios (la service role key se usa solo en este comando, no se guarda):
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL=https://aqfbxebcyifaerlripgj.supabase.co
   export SUPABASE_SERVICE_ROLE_KEY=$(npx supabase projects api-keys --project-ref aqfbxebcyifaerlripgj -o json | python3 -c "import json,sys;print([k['api_key'] for k in json.load(sys.stdin) if k['name']=='service_role'][0])")
   node scripts/crear-usuario.mjs juan norestearq "Juan Esperon"
   node scripts/crear-usuario.mjs josefina norestearq "Josefina Gardey"
   node scripts/crear-usuario.mjs catalina norestearq "Catalina"
   node scripts/crear-usuario.mjs admin norestearq "Admin" admin
   unset SUPABASE_SERVICE_ROLE_KEY
   ```

3. Dashboard → Authentication:
   - Sign In / Providers → Email: desactivar «Allow new users to sign up».
   - URL Configuration → Site URL: `https://www.norestearq.com`.

## B. Publicar

4. Commit y merge de la rama a `main` (Vercel publica).
5. Vercel → Settings → Environment Variables: borrar `ADMIN_PASSWORD`. Recomendado: variables de Preview apuntando al Supabase de desarrollo (`noreste-dev`).
6. Probar en norestearq.com/admin: login, CRUD del sitio web, crear una obra.
7. Pedir a cada persona que cambie su contraseña desde el panel (menú de usuario).

## Para migraciones futuras

`python3 scripts/aplicar-migraciones.py aqfbxebcyifaerlripgj` aplica solo las nuevas.

Opcional: cuenta o carpeta de Cloudinary aparte para desarrollo (hoy se comparte la de producción).
