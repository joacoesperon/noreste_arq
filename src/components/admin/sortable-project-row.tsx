"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical, Pencil, Trash2 } from "lucide-react";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  loading: boolean;
};

export function SortableProjectRow({ project, onEdit, onDelete, loading }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.slug,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };
  const hidden = project.visible === false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-3 border-b bg-background py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between",
        isDragging && "relative shadow-lg"
      )}
    >
      <div className="flex flex-1 items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Arrastrar para reordenar"
        >
          <GripVertical className="size-4" />
        </button>
        <div className="flex flex-col">
          <span className={cn("font-medium", hidden && "text-muted-foreground line-through")}>{project.title}</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{project.year}</span>
            <span>·</span>
            <span>{project.status}</span>
            {hidden && <Badge variant="outline">oculta</Badge>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 pl-9 sm:pl-0">
        <Button variant="ghost" size="sm" onClick={() => onEdit(project)}>
          <Pencil />
          Editar
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a href={`/projects/${project.slug}`} target="_blank" rel="noreferrer">
            <ExternalLink />
            Ver
          </a>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(project)}
          disabled={loading}
        >
          <Trash2 />
          Eliminar
        </Button>
      </div>
    </div>
  );
}
