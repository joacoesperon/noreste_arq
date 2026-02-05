"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

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
    
    // Preload to check orientation
    const img = new window.Image();
    img.onload = () => {
      setIsVertical(img.height > img.width);
      setActiveImage(imageUrl);
      setIsFading(true);
    };
    img.src = imageUrl;
  };

  return (
    <div className="row feed-projects">
      <div className="col-12 col-md-6">
        <div className="table">
          <div className="tbody">
            {projects.map((project) => (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className="tr"
                onMouseEnter={() => handleMouseEnter(project.image)}
                onMouseLeave={() => setIsFading(false)}
              >
                <div className="td">{project.title}</div>
                <div className="td">{project.status}</div>
                <div className="td">{project.year}</div>
              </Link>
            ))}
            <div className="spacer"></div>
            <div className="spacer"></div>
          </div>
        </div>
      </div>
      
      <div className="col-12 col-md-6 d-none d-md-block text-end">
        <div className={`thumbnail ${isVertical ? "is-vertical" : ""}`}>
          {activeImage && (
            <div className={`relative w-full h-full transition-opacity duration-500 ${isFading ? "opacity-100" : "opacity-0"}`}>
              <Image
                src={activeImage}
                alt="Project thumbnail"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
