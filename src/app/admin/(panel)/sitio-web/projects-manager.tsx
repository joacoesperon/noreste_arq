"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ImagePlus, Plus, Star, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import type { Project, ProjectCredits } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { SortableImage } from "@/components/admin/sortable-image";
import { SortableProjectRow } from "@/components/admin/sortable-project-row";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProjectForm = {
  slug: string;
  title: string;
  m2: number;
  status: Project["status"];
  year: number;
  location: string;
  credits: ProjectCredits;
  visible: boolean;
  cover?: string;
};

const emptyForm: ProjectForm = {
  slug: "",
  title: "",
  m2: 0,
  status: "Proyecto",
  year: new Date().getFullYear(),
  location: "",
  credits: {
    proyecto: "Noreste Arquitectura",
    equipo: "",
    obra: "",
    paisajismo: "",
    interiorismo: "",
    instalaciones: "",
    estructura: "",
    fotografias: "",
  },
  visible: true,
  cover: "",
};

const MAX_UPLOAD_SIZE = 100 * 1024 * 1024; // 100MB

type PendingConfirm = {
  title: string;
  description: string;
  action: string;
  onConfirm: () => void;
};

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function errorMessage(res: Response, fallback: string) {
  try {
    const data = await res.json();
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

export function ProjectsManager() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [orderChanged, setOrderChanged] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newVideos, setNewVideos] = useState<File[]>([]);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [currentVideos, setCurrentVideos] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [filename: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (!res.ok) throw new Error(await errorMessage(res, "Error al cargar las obras"));
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar las obras");
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDragEndImages = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCurrentImages((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDragEndProjects = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((p) => p.slug === active.id);
      const newIndex = projects.findIndex((p) => p.slug === over.id);
      setProjects(arrayMove(projects, oldIndex, newIndex));
      setOrderChanged(true);
    }
  };

  const saveNewOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects }),
      });
      if (!res.ok) throw new Error(await errorMessage(res, "No se pudo guardar el nuevo orden"));
      toast.success("Orden actualizado");
      setOrderChanged(false);
      loadProjects();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el nuevo orden");
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (title: string) => {
    setForm({ ...form, title, slug: editingSlug ? form.slug : generateSlug(title) });
  };

  const handleCreditChange = (key: keyof ProjectCredits, value: string) => {
    setForm({ ...form, credits: { ...form.credits, [key]: value || null } });
  };

  const handleEdit = (project: Project) => {
    setEditingSlug(project.slug);
    setForm({
      slug: project.slug,
      title: project.title,
      m2: project.m2,
      status: project.status,
      year: project.year,
      location: project.location,
      visible: project.visible !== false,
      cover: project.cover || "",
      credits: {
        proyecto: project.credits?.proyecto || "",
        equipo: project.credits?.equipo || "",
        obra: project.credits?.obra || "",
        paisajismo: project.credits?.paisajismo || "",
        interiorismo: project.credits?.interiorismo || "",
        instalaciones: project.credits?.instalaciones || "",
        estructura: project.credits?.estructura || "",
        fotografias: project.credits?.fotografias || "",
      },
    });
    setCurrentImages(project.images || []);
    setCurrentVideos(project.videos || []);
    setNewImages([]);
    setNewVideos([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteFile = (fileUrl: string, type: "images" | "videos") => {
    if (!editingSlug) return;
    const slug = editingSlug;
    setPendingConfirm({
      title: type === "images" ? "¿Eliminar la foto?" : "¿Eliminar el video?",
      description: "Se borra de Cloudinary y de la obra. No se puede deshacer.",
      action: "Eliminar",
      onConfirm: async () => {
        try {
          const res = await fetch(
            `/api/projects/${slug}/images?filename=${encodeURIComponent(fileUrl)}&type=${type}`,
            { method: "DELETE" }
          );
          if (!res.ok) throw new Error(await errorMessage(res, "Error al eliminar archivo"));
          if (type === "images") {
            setCurrentImages((prev) => prev.filter((img) => img !== fileUrl));
          } else {
            setCurrentVideos((prev) => prev.filter((vid) => vid !== fileUrl));
          }
          loadProjects();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Error al eliminar archivo");
        }
      },
    });
  };

  const uploadFileDirectly = async (file: File, slug: string): Promise<string> => {
    // 1. Firma del servidor (requiere sesión del estudio)
    const sigRes = await fetch(`/api/cloudinary/signature?folder=${encodeURIComponent(slug)}`);
    if (!sigRes.ok) throw new Error("Error al obtener firma de autenticación");
    const { timestamp, signature, api_key, cloud_name, folder } = await sigRes.json();

    // 2. Subida directa a Cloudinary con progreso
    const formData = new FormData();
    formData.append("file", file);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("api_key", api_key);
    formData.append("folder", folder);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress((prev) => ({ ...prev, [file.name]: percent }));
        }
      });

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText).secure_url);
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.timeout = 120000; // 2 minutos
      xhr.ontimeout = () => reject(new Error("Timeout - archivo muy grande o conexión lenta"));

      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`);
      xhr.send(formData);
    });
  };

  /** Sube los archivos y devuelve las URLs subidas; lanza si alguno falló. */
  const uploadAll = async (files: File[], slug: string, label: string) => {
    const oversized = files.filter((f) => f.size > MAX_UPLOAD_SIZE);
    if (oversized.length > 0) {
      throw new Error(`${label} muy grandes (>100MB): ${oversized.map((f) => f.name).join(", ")}`);
    }

    const results = await Promise.allSettled(files.map((f) => uploadFileDirectly(f, slug)));
    const successful = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
      .map((r) => r.value);
    const failed = files.filter((_, i) => results[i].status === "rejected").map((f) => f.name);

    return { successful, failed };
  };

  const saveMedia = async (slug: string, field: "images" | "videos", urls: string[]) => {
    const res = await fetch(`/api/projects/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: urls }),
    });
    if (!res.ok) throw new Error(await errorMessage(res, "Error al guardar los archivos subidos"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const projectData = { ...form, images: currentImages, videos: currentVideos };
      const res = editingSlug
        ? await fetch(`/api/projects/${editingSlug}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(projectData),
          })
        : await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(projectData),
          });

      if (!res.ok) throw new Error(await errorMessage(res, "Error al guardar"));

      if (newImages.length > 0 || newVideos.length > 0) {
        setIsUploading(true);
        try {
          const failedAll: string[] = [];

          if (newImages.length > 0) {
            const { successful, failed } = await uploadAll(newImages, form.slug, "Archivos");
            if (successful.length > 0) {
              const images = [...currentImages, ...successful];
              await saveMedia(form.slug, "images", images);
              setCurrentImages(images);
            }
            failedAll.push(...failed);
          }

          if (newVideos.length > 0) {
            const { successful, failed } = await uploadAll(newVideos, form.slug, "Videos");
            if (successful.length > 0) {
              const videos = [...currentVideos, ...successful];
              await saveMedia(form.slug, "videos", videos);
              setCurrentVideos(videos);
            }
            failedAll.push(...failed);
          }

          if (failedAll.length > 0) {
            throw new Error(`Fallaron ${failedAll.length} archivo(s): ${failedAll.join(", ")}`);
          }
        } finally {
          setIsUploading(false);
          setUploadProgress({});
        }
      }

      toast.success(editingSlug ? "Obra actualizada" : "Obra creada");
      if (!editingSlug) setForm(emptyForm);
      setNewImages([]);
      setNewVideos([]);
      loadProjects();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
    setLoading(false);
  };

  const handleDelete = (project: Project) => {
    setPendingConfirm({
      title: `¿Eliminar «${project.title}»?`,
      description: "La obra deja de estar en la web. No se puede deshacer.",
      action: "Eliminar obra",
      onConfirm: async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/projects/${project.slug}`, { method: "DELETE" });
          if (!res.ok) throw new Error(await errorMessage(res, "Error al eliminar"));
          toast.success("Obra eliminada");
          if (editingSlug === project.slug) handleCancel();
          loadProjects();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Error al eliminar");
        }
        setLoading(false);
      },
    });
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setNewImages([]);
    setNewVideos([]);
    setCurrentImages([]);
    setCurrentVideos([]);
    setEditingSlug(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 md:p-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sitio web</h1>
        <p className="text-sm text-muted-foreground">Obras publicadas en norestearq.com.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <CardTitle>{editingSlug ? `Editando «${form.title || editingSlug}»` : "Nueva obra"}</CardTitle>
              <CardDescription>Información general</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="visible"
                  checked={form.visible}
                  onCheckedChange={(checked) => setForm({ ...form, visible: checked === true })}
                />
                <Label htmlFor="visible">Visible en la web</Label>
              </div>
              {editingSlug && (
                <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
                  Cancelar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={form.title} onChange={(e) => handleTitleChange(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                disabled={!!editingSlug}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm({ ...form, status: value as ProjectForm["status"] })}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Proyecto">Proyecto</SelectItem>
                  <SelectItem value="Construido">Construido</SelectItem>
                  <SelectItem value="En obra">En obra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="m2">m² *</Label>
              <Input
                id="m2"
                type="number"
                value={form.m2}
                onChange={(e) => setForm({ ...form, m2: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="year">Año *</Label>
              <Input
                id="year"
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || new Date().getFullYear() })}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="location">Ubicación *</Label>
              <Input
                id="location"
                value={form.location}
                placeholder="Pilar, Provincia de Buenos Aires, Argentina"
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Créditos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(emptyForm.credits) as Array<keyof ProjectCredits>).map((key) => (
              <div key={key} className="flex flex-col gap-2">
                <Label htmlFor={`credit-${key}`} className="capitalize">
                  {key}
                </Label>
                <Input
                  id={`credit-${key}`}
                  value={form.credits[key] || ""}
                  onChange={(e) => handleCreditChange(key, e.target.value)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fotos</CardTitle>
            <CardDescription>Arrastrá para reordenar. La portada se usa en el inicio y el índice.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {currentImages.length > 0 && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndImages}>
                <SortableContext items={currentImages} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                    {currentImages.map((img) => (
                      <SortableImage
                        key={img}
                        id={img}
                        url={img}
                        isCover={form.cover === img}
                        onSetCover={() => setForm({ ...form, cover: img })}
                        onDelete={() => deleteFile(img, "images")}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
            <FilePicker
              id="img-upload"
              accept="image/*"
              icon={<ImagePlus />}
              label={newImages.length > 0 ? `${newImages.length} fotos nuevas` : "Agregar fotos"}
              onSelect={setNewImages}
            />
            {isUploading && <UploadProgress files={newImages} progress={uploadProgress} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Videos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {currentVideos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {currentVideos.map((vid) => (
                  <div
                    key={vid}
                    className={cn(
                      "group relative aspect-video overflow-hidden rounded-md border bg-muted",
                      form.cover === vid && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    <video src={vid} muted className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        type="button"
                        size="xs"
                        variant="secondary"
                        onClick={() => setForm({ ...form, cover: vid })}
                        disabled={form.cover === vid}
                      >
                        <Star />
                        {form.cover === vid ? "Portada" : "Usar portada"}
                      </Button>
                      <Button type="button" size="xs" variant="destructive" onClick={() => deleteFile(vid, "videos")}>
                        <Trash2 />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <FilePicker
              id="vid-upload"
              accept="video/*"
              icon={<Video />}
              label={newVideos.length > 0 ? `${newVideos.length} videos nuevos` : "Agregar videos"}
              onSelect={setNewVideos}
            />
            {isUploading && <UploadProgress files={newVideos} progress={uploadProgress} />}
          </CardContent>
        </Card>

        <div>
          <Button type="submit" size="lg" disabled={loading}>
            {!editingSlug && <Plus />}
            {loading ? "Guardando…" : editingSlug ? "Guardar cambios" : "Crear obra"}
          </Button>
        </div>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Obras publicadas</CardTitle>
          <CardDescription>Arrastrá desde el ícono para cambiar el orden del inicio.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndProjects}>
            <SortableContext items={projects.map((p) => p.slug)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col">
                {projects.map((project) => (
                  <SortableProjectRow
                    key={project.slug}
                    project={project}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    loading={loading}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {orderChanged && (
            <div>
              <Button onClick={saveNewOrder} disabled={loading}>
                {loading ? "Guardando…" : "Guardar nuevo orden"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingConfirm} onOpenChange={(open) => !open && setPendingConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingConfirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{pendingConfirm?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => pendingConfirm?.onConfirm()}>
              {pendingConfirm?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FilePicker({
  id,
  accept,
  icon,
  label,
  onSelect,
}: {
  id: string;
  accept: string;
  icon: React.ReactNode;
  label: string;
  onSelect: (files: File[]) => void;
}) {
  return (
    <>
      <input
        type="file"
        id={id}
        multiple
        accept={accept}
        onChange={(e) => {
          onSelect(Array.from(e.target.files || []));
          e.target.value = ""; // permite volver a elegir el mismo archivo
        }}
        className="hidden"
      />
      <Button type="button" variant="outline" className="w-full border-dashed" asChild>
        <label htmlFor={id} className="cursor-pointer">
          {icon}
          {label}
        </label>
      </Button>
    </>
  );
}

function UploadProgress({ files, progress }: { files: File[]; progress: { [filename: string]: number } }) {
  if (files.length === 0) return null;
  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      {files.map((file) => (
        <div key={file.name} className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="max-w-[200px] truncate">{file.name}</span>
            <span className="font-medium">{progress[file.name] || 0}%</span>
          </div>
          <Progress value={progress[file.name] || 0} />
        </div>
      ))}
    </div>
  );
}
