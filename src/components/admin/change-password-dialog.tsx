"use client";

import { startTransition, useActionState, useEffect } from "react";
import { toast } from "sonner";
import { changePassword, type ChangePasswordState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ChangePasswordState = { error: null, ok: false };

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>Mínimo 8 caracteres.</DialogDescription>
        </DialogHeader>
        {/* Se monta de nuevo en cada apertura: arranca vacío y sin errores previos */}
        {open && <ChangePasswordForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(changePassword, initialState);

  useEffect(() => {
    if (state.ok) {
      toast.success("Contraseña actualizada");
      onDone();
    }
  }, [state, onDone]);

  return (
    <form
      // onSubmit en lugar de action: así React no vacía los campos si hay un error
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="actual">Contraseña actual</Label>
        <Input id="actual" name="actual" type="password" autoComplete="current-password" required autoFocus />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="nueva">Nueva contraseña</Label>
        <Input id="nueva" name="nueva" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="repetida">Repetir nueva contraseña</Label>
        <Input id="repetida" name="repetida" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Cambiar contraseña"}
        </Button>
      </DialogFooter>
    </form>
  );
}
