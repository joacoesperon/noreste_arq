"""
Aplica las migraciones de supabase/migrations/ a un proyecto de Supabase usando la
API de administración (no necesita la contraseña de la base, solo un token de acceso).

Uso:  python3 scripts/aplicar-migraciones.py <project-ref> [--base-aplicada]

- Lleva el historial en supabase_migrations.schema_migrations (el mismo que usa la CLI),
  así que se puede volver a correr: saltea lo ya aplicado.
- Cada migración corre en una transacción: si falla, se deshace y el script se detiene.
- --base-aplicada: marca 20261013000000_base_projects como aplicada sin ejecutarla
  (en producción la tabla projects ya existía).
"""
import glob
import json
import os
import sys
import urllib.error
import urllib.request

if len(sys.argv) < 2:
    sys.exit(__doc__)
REF = sys.argv[1]
BASE_APLICADA = "--base-aplicada" in sys.argv
# Token de acceso: variable SUPABASE_ACCESS_TOKEN o ~/.supabase/access-token
# (se crea en supabase.com/dashboard/account/tokens).
TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN", "").strip()
if not TOKEN:
    try:
        TOKEN = open(os.path.expanduser("~/.supabase/access-token")).read().strip()
    except FileNotFoundError:
        sys.exit("Falta el token de Supabase: SUPABASE_ACCESS_TOKEN o ~/.supabase/access-token.")
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def q(sql, read_only=False):
    body = json.dumps({"query": sql, "read_only": read_only}).encode()
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{REF}/database/query",
        data=body,
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json", "User-Agent": "supabase-cli"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


st, out = q(
    "create schema if not exists supabase_migrations;"
    "create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text);"
)
if st >= 300:
    sys.exit(f"No se pudo preparar el historial: {st} {out}")


def registrar(version, name):
    return q(f"insert into supabase_migrations.schema_migrations (version, name) values ('{version}', '{name}') on conflict do nothing;")


if BASE_APLICADA:
    registrar("20261013000000", "base_projects")
    print("marcada como aplicada: 20261013000000_base_projects.sql")

for path in sorted(glob.glob(os.path.join(RAIZ, "supabase/migrations/*.sql"))):
    archivo = os.path.basename(path)
    version, name = archivo[:-4].split("_", 1)
    st, out = q(f"select 1 from supabase_migrations.schema_migrations where version = '{version}'", True)
    if st < 300 and json.loads(out):
        print("ya aplicada:", archivo)
        continue
    st, out = q("begin;\n" + open(path).read() + "\ncommit;")
    if st >= 300:
        q("rollback;")
        sys.exit(f"ERROR en {archivo} ({st}): {out[:1000]}\nNo se aplicó esa migración ni las siguientes.")
    registrar(version, name)
    print("aplicada:", archivo)

print("Listo.")
