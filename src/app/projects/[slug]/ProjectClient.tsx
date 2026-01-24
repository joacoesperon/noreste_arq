"use client";

import { useState, useEffect, useRef } from "react";
import type { Project } from "@/lib/projects";
import Masonry from "react-masonry-css";

type ProjectImage = {
  src: string;
  type: "exterior" | "interior";
};

type Props = {
  project: Project;
  images: ProjectImage[];
  prevProject: Project | null;
  nextProject: Project | null;
};

export default function ProjectClient({ project, images, prevProject, nextProject }: Props) {
  const [showCredits, setShowCredits] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const loadedCount = useRef(0);

  // Esperar a que las imágenes carguen para un mejor layout de masonry
  useEffect(() => {
    loadedCount.current = 0;
    setImagesLoaded(false);
  }, [project.slug]);

  const handleImageLoad = () => {
    loadedCount.current += 1;
    if (loadedCount.current >= images.length) {
      setImagesLoaded(true);
    }
  };

  // Breakpoints para Masonry
  const breakpointColumns = {
    default: 2,
    768: 1
  };

  return (
    <>
      {/* Info del proyecto - centrado como tenue */}
      <section className="pt-16 px-6 md:px-12 pb-12 text-center">
        {/* Título, M2, Año */}
        <h1 className="text-2xl md:text-3xl text-carbon font-normal mb-4">
          {project.title}, {project.m2}M<sup>2</sup>, {project.year}
        </h1>

        {/* Ubicación */}
        <p className="text-base text-concrete mb-6">
          {project.location}
        </p>

        {/* Botón + para expandir créditos */}
        <button
          onClick={() => setShowCredits(!showCredits)}
          className="text-2xl text-concrete hover:text-carbon transition-colors cursor-pointer leading-none"
          aria-expanded={showCredits}
          aria-label={showCredits ? "Cerrar créditos" : "Ver créditos"}
        >
          {showCredits ? "−" : "+"}
        </button>

        {/* Créditos (expandible) */}
        {showCredits && (
          <div className="mt-6 pt-6 border-t border-concrete/20 max-w-md mx-auto">
            <div className="space-y-2 text-base text-concrete">
              <p><span className="text-carbon">Proyecto:</span> {project.credits.proyecto}</p>
              <p><span className="text-carbon">Equipo:</span> {project.credits.equipo}</p>
              <p><span className="text-carbon">Fotografías:</span> {project.credits.fotografias}</p>
            </div>
          </div>
        )}
      </section>

      {/* Galería Masonry */}
      <section className="px-6 md:px-12 pb-12">
        <Masonry
          breakpointCols={breakpointColumns}
          className="masonry-grid"
          columnClassName="masonry-grid-column"
        >
          {images.map((img, index) => (
            <div key={index} className="mb-4">
              <img
                src={img.src}
                alt={`${project.title} - ${img.type} ${index + 1}`}
                className={`w-full h-auto transition-opacity duration-300 ${imagesLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={handleImageLoad}
              />
            </div>
          ))}
        </Masonry>
      </section>

      {/* Navegación prev/next */}
      <section className="px-6 md:px-12 py-16 border-t border-concrete/20">
        <div className="flex justify-between items-center">
          {/* Proyecto anterior */}
          <div className="text-left">
            {prevProject ? (
              <a
                href={`/projects/${prevProject.slug}`}
                className="group inline-block"
              >
                <span className="block text-sm text-concrete mb-1 group-hover:text-carbon transition-colors">
                  {prevProject.title}
                </span>
                <span className="text-2xl text-carbon">
                  ←
                </span>
              </a>
            ) : (
              <div className="opacity-30">
                <span className="block text-sm text-concrete mb-1">—</span>
                <span className="text-2xl text-carbon">←</span>
              </div>
            )}
          </div>

          {/* Proyecto siguiente */}
          <div className="text-right">
            {nextProject ? (
              <a
                href={`/projects/${nextProject.slug}`}
                className="group inline-block"
              >
                <span className="block text-sm text-concrete mb-1 group-hover:text-carbon transition-colors">
                  {nextProject.title}
                </span>
                <span className="text-2xl text-carbon">
                  →
                </span>
              </a>
            ) : (
              <div className="opacity-30">
                <span className="block text-sm text-concrete mb-1">—</span>
                <span className="text-2xl text-carbon">→</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
