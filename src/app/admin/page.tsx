"use client";

import { useState, useEffect } from "react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import Header from "@/components/Header";
import { SortableImage } from "@/components/SortableImage";
import { SortableProjectRow } from "@/components/SortableProjectRow";
import type { Project, ProjectCredits } from "@/lib/projects";
import { supabase } from "@/lib/supabase";

type ProjectForm = {
  slug: string;
  title: string;
  m2: number;
  status: "Construido" | "Proyecto" | "En obra";
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

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      const oldIndex = projects.findIndex(p => p.slug === active.id);
      const newIndex = projects.findIndex(p => p.slug === over.id);
      
      const newOrder = arrayMove(projects, oldIndex, newIndex);
      setProjects(newOrder);
      setOrderChanged(true);
    }
  };

  const saveNewOrder = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects: projects }),
      });
      if (res.ok) {
        setSuccess("Orden actualizado correctamente");
        setOrderChanged(false);
        loadProjects();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar el orden");
      }
    } catch (_e) {
      setError("No se pudo guardar el nuevo orden");
    } finally {
      setLoading(false);
    }
  };

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [orderChanged, setOrderChanged] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newVideos, setNewVideos] = useState<File[]>([]);
  
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [currentVideos, setCurrentVideos] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[filename: string]: number}>({});
  const [isUploading, setIsUploading] = useState(false);

  // Limpiar mensajes después de 2 segundos
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/login/check");
        if (res.ok) {
          setIsAuthenticated(true);
        }
      } catch (_e) {}
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/login/logout", { method: "POST" });
    setIsAuthenticated(false);
    setForm(emptyForm);
  };

  const loadProjects = async () => {
    try {
      const res = await fetch("/api/projects", { cache: 'no-store' });
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (_e) {
      console.error("Error loading projects:", _e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setIsAuthenticated(true);
      } else {
        setError(data.error || "Contraseña incorrecta");
      }
    } catch (_e) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setForm({
      ...form,
      title,
      slug: editingSlug ? form.slug : generateSlug(title),
    });
  };

  const handleCreditChange = (key: keyof ProjectCredits, value: string) => {
    setForm({
      ...form,
      credits: {
        ...form.credits,
        [key]: value || null,
      }
    });
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

  const deleteFile = async (filename: string, type: 'images' | 'videos') => {
    if (!editingSlug || !confirm(`¿Eliminar archivo ${filename}?`)) return;
    
    try {
      const res = await fetch(`/api/projects/${editingSlug}/images?filename=${encodeURIComponent(filename)}&type=${type}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (type === 'images') {
          setCurrentImages(prev => prev.filter(img => img !== filename));
        } else {
          setCurrentVideos(prev => prev.filter(vid => vid !== filename));
        }
        loadProjects();
      }
    } catch (_e) {
      setError("Error al eliminar archivo");
    }
  };

  const uploadFileDirectly = async (
    file: File,
    slug: string,
    type: 'images' | 'videos'
  ): Promise<string> => {
    // 1. Obtener firma del servidor
    const sigRes = await fetch(
      `/api/cloudinary/signature?folder=${slug}`
    );

    if (!sigRes.ok) {
      throw new Error('Error al obtener firma de autenticación');
    }

    const { timestamp, signature, api_key, cloud_name, folder } = await sigRes.json();

    // 2. Preparar FormData para Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('api_key', api_key);
    formData.append('folder', folder);

    // 3. Subir directamente a Cloudinary con progreso
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Tracking de progreso
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          resolve(response.secure_url);
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.timeout = 120000; // 2 minutos
      xhr.ontimeout = () => reject(new Error('Timeout - archivo muy grande o conexión lenta'));

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`);
      xhr.send(formData);
    });
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`¿Eliminar el proyecto "${slug}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${slug}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess("Proyecto eliminado correctamente");
        loadProjects();
      }
    } catch (_e) { setError("Error de conexión"); }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const projectData = {
        ...form,
        images: currentImages,
        videos: currentVideos,
      };

      let res;
      if (editingSlug) {
        res = await fetch(`/api/projects/${editingSlug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectData),
        });
      } else {
        res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectData),
        });
      }
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      // Subir nuevas imágenes directamente a Cloudinary
      if (newImages.length > 0) {
        setIsUploading(true);
        try {
          // Validar tamaño de archivos (100MB límite)
          const MAX_SIZE = 100 * 1024 * 1024;
          const oversized = newImages.filter(img => img.size > MAX_SIZE);
          if (oversized.length > 0) {
            throw new Error(`Archivos muy grandes (>100MB): ${oversized.map(f => f.name).join(', ')}`);
          }

          // Subir archivos en paralelo
          const results = await Promise.allSettled(
            newImages.map(img => uploadFileDirectly(img, form.slug, 'images'))
          );

          // Separar exitosos y fallidos
          const successful = results
            .filter(r => r.status === 'fulfilled')
            .map(r => (r as PromiseFulfilledResult<string>).value);

          const failed = results
            .filter(r => r.status === 'rejected')
            .map((r, i) => newImages[i].name);

          if (failed.length > 0) {
            console.warn('Archivos fallidos:', failed);
          }

          // Actualizar Supabase con las URLs exitosas
          if (successful.length > 0) {
            const { data: project } = await supabase
              .from('projects')
              .select('images')
              .eq('slug', form.slug)
              .single();

            await supabase
              .from('projects')
              .update({ images: [...(project?.images || []), ...successful] })
              .eq('slug', form.slug);

            setCurrentImages(prev => [...prev, ...successful]);
          }

          if (failed.length > 0) {
            throw new Error(`Fallaron ${failed.length} archivo(s): ${failed.join(', ')}`);
          }
        } finally {
          setIsUploading(false);
          setUploadProgress({});
        }
      }

      // Subir nuevos videos directamente a Cloudinary
      if (newVideos.length > 0) {
        setIsUploading(true);
        try {
          const MAX_SIZE = 100 * 1024 * 1024;
          const oversized = newVideos.filter(vid => vid.size > MAX_SIZE);
          if (oversized.length > 0) {
            throw new Error(`Videos muy grandes (>100MB): ${oversized.map(f => f.name).join(', ')}`);
          }

          const results = await Promise.allSettled(
            newVideos.map(vid => uploadFileDirectly(vid, form.slug, 'videos'))
          );

          const successful = results
            .filter(r => r.status === 'fulfilled')
            .map(r => (r as PromiseFulfilledResult<string>).value);

          const failed = results
            .filter(r => r.status === 'rejected')
            .map((r, i) => newVideos[i].name);

          if (failed.length > 0) {
            console.warn('Videos fallidos:', failed);
          }

          if (successful.length > 0) {
            const { data: project } = await supabase
              .from('projects')
              .select('videos')
              .eq('slug', form.slug)
              .single();

            await supabase
              .from('projects')
              .update({ videos: [...(project?.videos || []), ...successful] })
              .eq('slug', form.slug);

            setCurrentVideos(prev => [...prev, ...successful]);
          }

          if (failed.length > 0) {
            throw new Error(`Fallaron ${failed.length} video(s): ${failed.join(', ')}`);
          }
        } finally {
          setIsUploading(false);
          setUploadProgress({});
        }
      }

      setSuccess(editingSlug ? "Proyecto actualizado correctamente" : "Proyecto creado correctamente");

      if (!editingSlug) {
        setForm(emptyForm);
        setNewImages([]);
        setNewVideos([]);
      } else {
        setNewImages([]);
        setNewVideos([]);
      }
      
      loadProjects();
    } catch (_e) {
      setError(_e instanceof Error ? _e.message : "Error");
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setNewImages([]);
    setNewVideos([]);
    setCurrentImages([]);
    setCurrentVideos([]);
    setEditingSlug(null);
    setError("");
    setSuccess("");
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl text-text mb-8 lowercase tracking-widest font-medium">admin</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="password"
              value={password}
              placeholder="contraseña"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-2 border-b border-text/30 bg-transparent text-black focus:outline-none focus:border-text-hover text-center transition-colors text-base"
            />
            <button type="submit" className="w-full py-3 border border-text text-text hover:bg-text hover:text-white transition-all cursor-pointer lowercase tracking-widest text-sm font-medium">
              {loading ? "verificando..." : "entrar"}
            </button>
            {error && <p className="text-red-500 text-xs uppercase tracking-widest mt-4">{error}</p>}
          </form>
        </div>
      </main>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white pt-32 px-4 md:px-[15%] pb-20">
        <div className="w-full mx-auto">
          <div className="flex justify-between items-end mb-12 border-b border-text/20 pb-4">
            <h1 className="text-lg text-black lowercase tracking-widest font-medium">
              {editingSlug ? `editando / ${editingSlug}` : "nuevo proyecto"}
            </h1>
            <div className="flex gap-6 items-center">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={form.visible} 
                  onChange={(e) => setForm({...form, visible: e.target.checked})}
                  className="w-4 h-4 accent-text-hover"
                />
                <span className="text-xs text-text group-hover:text-text-hover uppercase tracking-widest transition-colors">Visible en web</span>
              </label>
              
              {editingSlug && (
                <button onClick={handleCancel} className="text-text hover:text-black text-sm lowercase transition-colors underline decoration-1 underline-offset-4">
                  cancelar
                </button>
              )}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-16">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10">
              <div className="md:col-span-3">
                <h2 className="text-black text-sm font-semibold uppercase tracking-[0.2em] mb-4 border-b border-text/10 pb-2">información general</h2>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-text uppercase tracking-widest font-medium">título *</label>
                <input type="text" value={form.title} onChange={handleTitleChange} required className="w-full py-2 border-b border-text/30 bg-transparent text-black focus:outline-none focus:border-text-hover transition-colors text-base" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-text uppercase tracking-widest font-medium">slug (url)</label>
                <input 
                  type="text" 
                  value={form.slug} 
                  onChange={(e) => setForm({...form, slug: e.target.value})}
                  disabled={!!editingSlug} 
                  className="w-full py-2 border-b border-text/30 bg-transparent text-black focus:outline-none disabled:opacity-30 text-base" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-text uppercase tracking-widest font-medium">estado</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectForm["status"] })} className="w-full py-2 border-b border-text/30 bg-transparent text-black focus:outline-none focus:border-text-hover cursor-pointer transition-colors text-base">
                  <option value="Proyecto">Proyecto</option>
                  <option value="Construido">Construido</option>
                  <option value="En obra">En obra</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-text uppercase tracking-widest font-medium">m2 *</label>
                <input type="number" value={form.m2} onChange={(e) => setForm({ ...form, m2: parseInt(e.target.value) || 0 })} required className="w-full py-2 border-b border-text/30 bg-transparent text-black focus:outline-none focus:border-text-hover transition-colors text-base" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-text uppercase tracking-widest font-medium">año *</label>
                <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || 2024 })} required className="w-full py-2 border-b border-text/30 bg-transparent text-black focus:outline-none focus:border-text-hover transition-colors text-base" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-text uppercase tracking-widest font-medium">ubicación *</label>
                <input type="text" value={form.location} placeholder="Pilar, Provincia de Buenos Aires, Argentina" onChange={(e) => setForm({ ...form, location: e.target.value })} required className="w-full py-2 border-b border-text/30 bg-transparent text-black focus:outline-none focus:border-text-hover transition-colors text-base" />
              </div>
            </section>
            
            <section className="pt-8 border-t border-text/10">
              <h2 className="text-black text-sm font-semibold uppercase tracking-[0.2em] mb-8 border-b border-text/10 pb-2">créditos</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-12 gap-y-10">
                {(Object.keys(emptyForm.credits) as Array<keyof ProjectCredits>).map((key) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs text-text uppercase tracking-widest font-medium">{key}</label>
                    <input type="text" value={form.credits[key] || ""} onChange={(e) => handleCreditChange(key, e.target.value)} className="w-full py-2 border-b border-text/30 bg-transparent text-black focus:outline-none focus:border-text-hover transition-colors text-base" />
                  </div>
                ))}
              </div>
            </section>
            
            {/* Gestión de Archivos */}
            <section className="pt-8 border-t border-text/10">
              <h2 className="text-black text-sm font-semibold uppercase tracking-[0.2em] mb-8 border-b border-text/10 pb-2">imágenes y galería</h2>
              
              <div className="space-y-8">
                {/* Imágenes */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs text-text font-medium uppercase tracking-widest">fotos</h3>
                    {form.cover && (
                      <span className="text-base text-text-hover font-medium uppercase tracking-widest bg-gray-50 px-2 py-1 border border-text/20">
                        portada: {form.cover}
                      </span>
                    )}
                  </div>
                  
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndImages}>
                    <SortableContext items={currentImages} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                        {currentImages.map((img) => (
                          <SortableImage 
                            key={img} 
                            id={img}
                            url={img}
                            isCover={form.cover === img}
                            onSetCover={() => setForm({...form, cover: img})}
                            onDelete={() => deleteFile(img, 'images')}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  <input 
                    type="file" 
                    id="img-upload" 
                    multiple 
                    accept="image/*" 
                    onChange={(e) => {
                      setNewImages(Array.from(e.target.files || []));
                      e.target.value = ""; // Resetear valor para permitir re-subir el mismo archivo
                    }} 
                    className="hidden" 
                  />
                  <label htmlFor="img-upload" className="block w-full py-4 border border-text text-text text-center cursor-pointer hover:bg-black hover:text-white hover:border-black transition-all lowercase text-sm tracking-[0.2em]">
                    {newImages.length > 0 ? `${newImages.length} fotos nuevas` : "+ agregar fotos"}
                  </label>

                  {/* Progreso de subida de imágenes */}
                  {newImages.length > 0 && isUploading && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-text/10">
                      {newImages.map(img => (
                        <div key={img.name} className="space-y-1">
                          <div className="flex justify-between text-xs text-text/70">
                            <span className="truncate max-w-[200px]">{img.name}</span>
                            <span className="font-medium">{uploadProgress[img.name] || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-black h-full transition-all duration-300 ease-out"
                              style={{ width: `${uploadProgress[img.name] || 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Videos */}
                <div className="space-y-6 pt-8 border-t border-text/5">
                  <h3 className="text-xs text-text font-medium uppercase tracking-widest">videos</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {currentVideos.map((vid) => (
                      <div key={vid} className={`relative aspect-video bg-gray-100 group border ${form.cover === vid ? 'border-black ring-2 ring-black/10' : 'border-text/20'}`}>
                        <video src={vid} muted className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          <button type="button" onClick={() => setForm({...form, cover: vid})} className={`text-base uppercase tracking-tighter px-2 py-1 border font-medium ${form.cover === vid ? 'bg-white text-black' : 'text-white border-white'}`}>
                            {form.cover === vid ? 'portada' : 'usar portada'}
                          </button>
                          <button type="button" onClick={() => deleteFile(vid, 'videos')} className="text-base text-red-400 uppercase tracking-tighter font-medium hover:underline">eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <input 
                    type="file" 
                    id="vid-upload" 
                    multiple 
                    accept="video/*" 
                    onChange={(e) => {
                      setNewVideos(Array.from(e.target.files || []));
                      e.target.value = ""; // Resetear valor
                    }} 
                    className="hidden" 
                  />
                  <label htmlFor="vid-upload" className="block w-full py-4 border border-text text-text text-center cursor-pointer hover:bg-black hover:text-white hover:border-black transition-all lowercase text-sm tracking-[0.2em]">
                    {newVideos.length > 0 ? `${newVideos.length} videos nuevos` : "+ agregar videos"}
                  </label>

                  {/* Progreso de subida de videos */}
                  {newVideos.length > 0 && isUploading && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-text/10">
                      {newVideos.map(vid => (
                        <div key={vid.name} className="space-y-1">
                          <div className="flex justify-between text-xs text-text/70">
                            <span className="truncate max-w-[200px]">{vid.name}</span>
                            <span className="font-medium">{uploadProgress[vid.name] || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-black h-full transition-all duration-300 ease-out"
                              style={{ width: `${uploadProgress[vid.name] || 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
            
            <div className="pt-4">
              <button type="submit" disabled={loading} className="px-16 py-4 bg-black text-white hover:bg-text-hover transition-all cursor-pointer disabled:opacity-30 lowercase tracking-[0.2em] text-sm font-medium">
                {loading ? "guardando..." : (editingSlug ? "actualizar proyecto" : "crear proyecto")}
              </button>
            </div>
          </form>
          
          <section className="mt-12 pt-16 border-t border-black">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-black text-base font-semibold uppercase tracking-[0.3em]">proyectos actuales</h2>
              <span className="text-xs text-text italic">Arrastra el icono ::: para reordenar</span>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndProjects}>
              <SortableContext items={projects.map(p => p.slug)} strategy={verticalListSortingStrategy}>
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
              <div className="mt-12 flex justify-start">
                <button 
                  onClick={saveNewOrder}
                  disabled={loading}
                  className="px-16 py-4 bg-black text-white hover:bg-text-hover transition-all cursor-pointer disabled:opacity-30 lowercase tracking-[0.2em] text-sm font-medium"
                >
                  {loading ? "guardando..." : "guardar nuevo orden"}
                </button>
              </div>
            )}
          </section>
        </div>

        {/* NOTIFICACIONES FLOTANTES */}
        {(success || error) && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-150 pointer-events-none">
            <div className={`px-10 py-4 ${error ? 'bg-red-500' : 'bg-black'} text-white text-xs uppercase tracking-[0.2em] shadow-2xl animate-bounce border-2 border-white text-center min-w-50 font-medium`}>
              {success || error}
            </div>
          </div>
        )}

        <button 
          onClick={handleLogout}
          className="fixed bottom-8 right-8 z-100 text-xs text-text hover:text-red-500 uppercase tracking-[0.3em] border border-text/20 bg-white/80 backdrop-blur-sm px-6 py-3 transition-all hover:border-red-200 font-medium"
        >
          salir del panel
        </button>
      </main>
    </>
  );
}
