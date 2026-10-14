import { signOut } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/** Sesión válida, pero la cuenta no está dada de alta (o activa) en `staff`. */
export function NoAccess() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sin acceso al panel</CardTitle>
          <CardDescription>
            Tu cuenta no está habilitada para el panel del estudio. Pedile a un administrador que te dé de alta.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <form action={signOut} className="w-full">
            <Button type="submit" variant="outline" className="w-full">
              Salir
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  );
}
