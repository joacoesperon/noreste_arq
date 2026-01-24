"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";

type Project = {
  slug: string;
  title: string;
  m2: number;
  status: "Construido" | "Proyecto";
  year: number;
  location: string;
  credits: {
    proyecto: string;
    equipo: string;
    fotografias: string;
  };
  exteriorImages: string[];
  interiorImages: string[];
};

type ProjectForm = {
  slug: string;
  title: string;
  m2: number;
  status: "Construido" | "Proyecto";
  year: number;
  location: string;
  creditsProyecto: string;
  creditsEquipo: string;
  creditsFotografias: string;
};

const emptyForm: ProjectForm = {
  slug: "",
  title: "",
  m2: 0,
  status: "Proyecto",
  year: new Date().getFullYear(),
  location: "",
  creditsProyecto: "norestearq",
  creditsEquipo: "",
  creditsFotografias: "",
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Lista de proyectos
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  
  // Formulario
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [images, setImages] = useState<File[]>([]);
  
  // Cargar proyectos
  const loadProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (e) {
      console.error("Error loading projects:", e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    }
  }, [isAuthenticated]);

  // Autenticación
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "norestearq2024") {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Contraseña incorrecta");
    }
  };

  // Generar slug desde título
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

  // Editar proyecto existente
  const handleEdit = (project: Project) => {
    setEditingSlug(project.slug);
    setForm({
      slug: project.slug,
      title: project.title,
      m2: project.m2,
      status: project.status,
      year: project.year,
      location: project.location,
      creditsProyecto: project.credits.proyecto,
      creditsEquipo: project.credits.equipo,
      creditsFotografias: project.credits.fotografias,
    });
    setImages([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Eliminar proyecto
  const handleDelete = async (slug: string) => {
    if (!confirm(`¿Eliminar el proyecto "${slug}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${slug}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess("Proyecto eliminado correctamente");
        loadProjects();
      } else {
        const data = await res.json();
        setError(data.error || "Error al eliminar");
      }
    } catch (e) {
      setError("Error de conexión");
    }
    setLoading(false);
  };

  // Crear o actualizar proyecto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    const projectData = {
      slug: form.slug,
      title: form.title,
      m2: form.m2,
      status: form.status,
      year: form.year,
      location: form.location,
      credits: {
        proyecto: form.creditsProyecto,
        equipo: form.creditsEquipo,
        fotografias: form.creditsFotografias,
      },
      exteriorImages: [] as string[],
      interiorImages: [] as string[],
    };

    try {
      let res;
      
      if (editingSlug) {
        // Actualizar
        res = await fetch(`/api/projects/${editingSlug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectData),
        });
      } else {
        // Crear nuevo
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
      
      // Subir imágenes si hay
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((img) => {
          formData.append("images", img);
        });
        
        const imgRes = await fetch(`/api/projects/${form.slug}/images`, {
          method: "POST",
          body: formData,
        });
        
        if (!imgRes.ok) {
          setError("Proyecto guardado pero hubo error subiendo imágenes");
        }
      }
      
      setSuccess(editingSlug ? "Proyecto actualizado correctamente" : "Proyecto creado correctamente");
      setForm(emptyForm);
      setImages([]);
      setEditingSlug(null);
      loadProjects();
      
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
    
    setLoading(false);
  };

  // Cancelar edición
  const handleCancel = () => {
    setForm(emptyForm);
    setImages([]);
    setEditingSlug(null);
    setError("");
    setSuccess("");
  };

  // Pantalla de login
  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-bone pt-20 px-6">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl text-carbon mb-8">Admin</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-concrete mb-2">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-concrete/30 bg-bone text-carbon focus:outline-none focus:border-carbon"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                className="px-6 py-2 bg-carbon text-bone hover:bg-anthracite transition-colors cursor-pointer"
              >
                Entrar
              </button>
            </form>
          </div>
        </main>
      </>
    );
  }

  // Panel de admin
  return (
    <>
      <Header />
      <main className="min-h-screen bg-bone pt-20 px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl text-carbon mb-8">
            {editingSlug ? `Editando: ${editingSlug}` : "Nuevo Proyecto"}
          </h1>
          
          {/* Mensajes */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-100 text-green-700 rounded">
              {success}
            </div>
          )}
          
          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Título */}
              <div>
                <label className="block text-sm text-concrete mb-2">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={handleTitleChange}
                  required
                  className="w-full px-4 py-2 border border-concrete/30 bg-bone text-carbon focus:outline-none focus:border-carbon"
                />
              </div>
              
              {/* Slug */}
              <div>
                <label className="block text-sm text-concrete mb-2">Slug (URL)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  disabled={!!editingSlug}
                  className="w-full px-4 py-2 border border-concrete/30 bg-bone text-carbon focus:outline-none focus:border-carbon disabled:opacity-50"
                />
              </div>
              
              {/* M2 */}
              <div>
                <label className="block text-sm text-concrete mb-2">Metros cuadrados *</label>
                <input
                  type="number"
                  value={form.m2}
                  onChange={(e) => setForm({ ...form, m2: parseInt(e.target.value) || 0 })}
                  required
                  className="w-full px-4 py-2 border border-concrete/30 bg-bone text-carbon focus:outline-none focus:border-carbon"
                />
              </div>
              
              {/* Año */}
              <div>
                <label className="block text-sm text-concrete mb-2">Año *</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || 2024 })}
                  required
                  className="w-full px-4 py-2 border border-concrete/30 bg-bone text-carbon focus:outline-none focus:border-carbon"
                />
              </div>
              
              {/* Status */}
              <div>
                <label className="block text-sm text-concrete mb-2">Estado *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "Construido" | "Proyecto" })}
                  className="w-full px-4 py-2 border border-concrete/30 bg-bone text-carbon focus:outline-none focus:border-carbon cursor-pointer"
                >
                  <option value="Proyecto">Proyecto</option>
                  <option value="Construido">Construido</option>
                </select>
              </div>
              
              {/* Ubicación */}
              <div>
                <label className="block text-sm text-concrete mb-2">Ubicación *</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                  placeholder="Ciudad, Departamento, País"
                  className="w-full px-4 py-2 border border-concrete/30 bg-bone text-carbon focus:outline-none focus:border-carbon"
                />
              </div>
            </div>
            
            {/* Créditos */}
            <div className="border-t border-concrete/20 pt-6">
              <h2 className="text-lg text-carbon mb-4">Créditos</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm text-concrete mb-2">Proyecto</label>
                  <input
                    type="text"
                    value={form.creditsProyecto}
                    onChange={(e) => setForm({ ...form, creditsProyecto: e.target.value })}
                    className="w-full px-4 py-2 border border-concrete/30 bg-bone text-carbon focus:outline-none focus:border-carbon"
                  />
                </div>
                <div>
                  <label className="block text-sm text-concrete mb-2">Equipo</label>
                  <input
                    type="text"
                    value={form.creditsEquipo}
                    onChange={(e) => setForm({ ...form, creditsEquipo: e.target.value })}
                    className="w-full px-4 py-2 border border-concrete/30 bg-bone text-carbon focus:outline-none focus:border-carbon"
                  />
                </div>
                <div>
                  <label className="block text-sm text-concrete mb-2">Fotografías</label>
                  <input
                    type="text"
                    value={form.creditsFotografias}
                    onChange={(e) => setForm({ ...form, creditsFotografias: e.target.value })}
                    className="w-full px-4 py-2 border border-concrete/30 bg-bone text-carbon focus:outline-none focus:border-carbon"
                  />
                </div>
              </div>
            </div>
            
            {/* Imágenes */}
            <div className="border-t border-concrete/20 pt-6">
              <h2 className="text-lg text-carbon mb-4">Imágenes</h2>
              <p className="text-sm text-concrete mb-4">
                Selecciona las imágenes del proyecto. Se guardarán en la carpeta del proyecto.
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setImages(Array.from(e.target.files || []))}
                className="w-full px-4 py-2 border border-concrete/30 bg-bone text-carbon cursor-pointer"
              />
              {images.length > 0 && (
                <p className="mt-2 text-sm text-concrete">
                  {images.length} imágenes seleccionadas
                </p>
              )}
            </div>
            
            {/* Botones */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-carbon text-bone hover:bg-anthracite transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? "Guardando..." : (editingSlug ? "Actualizar" : "Crear Proyecto")}
              </button>
              {editingSlug && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-concrete text-concrete hover:border-carbon hover:text-carbon transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
          
          {/* Lista de proyectos */}
          <div className="border-t border-concrete/20 pt-8">
            <h2 className="text-xl text-carbon mb-6">Proyectos existentes</h2>
            
            {projects.length === 0 ? (
              <p className="text-concrete">No hay proyectos aún.</p>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div
                    key={project.slug}
                    className="flex items-center justify-between p-4 border border-concrete/20 hover:border-concrete/40 transition-colors"
                  >
                    <div>
                      <span className="text-carbon font-medium">{project.title}</span>
                      <span className="text-concrete ml-4">{project.year}</span>
                      <span className="text-concrete/60 ml-4 text-sm">{project.slug}</span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(project)}
                        className="text-sm text-concrete hover:text-carbon transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(project.slug)}
                        disabled={loading}
                        className="text-sm text-red-500 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                      <a
                        href={`/projects/${project.slug}`}
                        target="_blank"
                        className="text-sm text-concrete hover:text-carbon transition-colors"
                      >
                        Ver →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
