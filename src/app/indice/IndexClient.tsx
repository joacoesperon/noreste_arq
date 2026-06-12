"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { optimizeCloudinaryVideo } from "@/lib/media";

type ProjectForIndex = {
  slug: string;
  title: string;
  status: "Construido" | "Proyecto" | "En obra";
  year: number;
  image: string;
};

type Props = {
  projects: ProjectForIndex[];
};

export default function IndexClient({ projects }: Props) {
  const [activeImage, setActiveImage] = useState(projects[0]?.image || "");
  const [isVertical, setIsVertical] = useState(false);
  const [isFading, setIsFading] = useState(true);

  const handleMouseEnter = (imageUrl: string) => {
    setIsFading(false);
    
    // Check if it's a video
    const isVideo = imageUrl.toLowerCase().endsWith('.mp4') || imageUrl.toLowerCase().endsWith('.webm');

    if (isVideo) {
        setIsVertical(false); // Default to false or handle video aspect ratio if needed
        setActiveImage(imageUrl);
        setIsFading(true);
    } else {
        // Preload to check orientation
        const img = new window.Image();
        img.onload = () => {
          setIsVertical(img.height > img.width);
          setActiveImage(imageUrl);
          setIsFading(true);
        };
        img.src = imageUrl;
    }
  };

  const isVideoActive = activeImage.toLowerCase().endsWith('.mp4') || activeImage.toLowerCase().endsWith('.webm');

  return (
    <div className="flex flex-col md:flex-row w-full min-h-[calc(100vh-170px)]">
      {/* Columna Tabla Proyectos: 50% en desktop */}
      <div className="w-full md:w-1/2 pr-0 md:pr-8">
        <div className="w-full text-title">
          <div className="flex flex-col">
            {projects.map((project) => (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className="flex items-baseline py-1.5 md:py-1.25 group transition-colors"
                onMouseEnter={() => handleMouseEnter(project.image)}
              >
                {/* Título: Toma todo el espacio disponible */}
                <div className="flex-1 text-text group-hover:text-text-hover transition-colors pr-4">
                  {project.title}
                </div>
                
                {/* Estado: Ancho estable para que no se pise, usando em para escalar con la fuente */}
                <div className="w-[7em] md:w-[8em] text-center whitespace-nowrap text-text group-hover:text-text-hover transition-colors px-2">
                  {project.status}
                </div>
                
                {/* Año: Pegado a la derecha, usando em para escalar con la fuente */}
                <div className="w-[3.5em] md:w-[4em] text-right whitespace-nowrap text-text group-hover:text-text-hover transition-colors">
                  {project.year}
                </div>
              </Link>
            ))}
            {/* Espaciadores de Tenue */}
            <div className="h-10"></div>
            <div className="h-10"></div>
          </div>
        </div>
      </div>
      
      {/* Columna Imagen Thumbnail: 50% exacto en desktop */}
      <div className="hidden md:block md:w-1/2 relative">
        <div className="sticky top-0 w-full h-[calc(100vh-170px)] overflow-hidden">
          {activeImage && (
            <div className={`relative w-full h-full transition-opacity duration-500 ${isFading ? "opacity-100" : "opacity-0"}`}>
              {isVideoActive ? (
                <video
                    src={optimizeCloudinaryVideo(activeImage, 1080)}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-contain object-top"
                />
              ) : (
                <Image
                    src={activeImage}
                    alt="Project thumbnail"
                    fill
                    className={`object-contain object-top ${isVertical ? 'max-h-[calc(100vh-170px)]' : ''}`}
                    sizes="50vw"
                    priority
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
