"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SortableImageProps = {
  id: string;
  url: string;
  isCover: boolean;
  onSetCover: () => void;
  onDelete: () => void;
};

export function SortableImage({ id, url, isCover, onSetCover, onDelete }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative aspect-square touch-none overflow-hidden rounded-md border bg-muted",
        isCover && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <Image src={url} alt={id} fill sizes="200px" className="pointer-events-none select-none object-cover" />

      {/* stopPropagation en pointerdown: evita que un click en los botones inicie el drag */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          type="button"
          size="xs"
          variant="secondary"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onSetCover}
          disabled={isCover}
        >
          <Star />
          {isCover ? "Portada" : "Usar portada"}
        </Button>
        <Button
          type="button"
          size="xs"
          variant="destructive"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onDelete}
        >
          <Trash2 />
          Eliminar
        </Button>
      </div>

      {isCover && <Badge className="absolute top-1 right-1">Portada</Badge>}
    </div>
  );
}
