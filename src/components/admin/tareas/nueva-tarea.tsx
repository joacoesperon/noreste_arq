"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { crearTarea } from "@/app/admin/(panel)/tareas/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TareaForm } from "./tarea-form";
import { useTareas } from "./tareas-context";

export function NuevaTarea({ obraId, fecha }: { obraId?: string; fecha?: string }) {
  const { yo } = useTareas();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          Nueva tarea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
        </DialogHeader>
        {open && (
          <TareaForm
            inicial={{
              titulo: "",
              descripcion: "",
              obra_id: obraId ?? null,
              tipo: "general",
              responsable_id: yo,
              fecha: fecha ?? null,
            }}
            submitLabel="Crear tarea"
            pending={pending}
            error={error}
            onSubmit={(datos) =>
              startTransition(async () => {
                const res = await crearTarea(datos);
                if (!res.ok) return setError(res.error);
                toast.success("Tarea creada");
                setOpen(false);
              })
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
