"use client";

import { useRef, useEffect } from "react";

type ProjectForIndex = {
  slug: string;
  title: string;
  status: "Construido" | "Proyecto";
  year: number;
  image: string;
};

type Props = {
  projects: ProjectForIndex[];
};

export default function IndexClient({ projects }: Props) {
  const thumbnailRef = useRef<HTMLImageElement>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rows = document.querySelectorAll(".project-row");
    const thumbnail = thumbnailRef.current;
    const thumbnailContainer = thumbnailContainerRef.current;

    if (!thumbnail || !thumbnailContainer) return;

    const handleMouseOver = function (this: HTMLElement) {
      const imageUrl = this.getAttribute("data-image");
      if (imageUrl) {
        const img = new Image();
        img.onload = function () {
          thumbnailContainer.classList.remove("is-vertical");
          if (img.height > img.width) {
            thumbnailContainer.classList.add("is-vertical");
          }
          thumbnail.classList.remove("fade-in");
          thumbnail.src = imageUrl;
          setTimeout(() => {
            thumbnail.classList.add("fade-in");
          }, 10);
        };
        img.src = imageUrl;
      }
    };

    const handleMouseOut = function () {
      thumbnail.classList.remove("fade-in");
    };

    rows.forEach((row) => {
      row.addEventListener("mouseover", handleMouseOver);
      row.addEventListener("mouseout", handleMouseOut);
    });

    return () => {
      rows.forEach((row) => {
        row.removeEventListener("mouseover", handleMouseOver);
        row.removeEventListener("mouseout", handleMouseOut);
      });
    };
  }, []);

  return (
    <div className="flex flex-wrap">
      {/* Tabla proyectos - 50% */}
      <div className="w-full md:w-1/2 md:pr-4">
        <div className="table-container">
          {projects.map((project) => (
            <a
              key={project.slug}
              href={`/projects/${project.slug}`}
              className="project-row"
              data-image={project.image}
            >
              <span className="project-title">{project.title}</span>
              <span className="project-status">{project.status}</span>
              <span className="project-year">{project.year}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Thumbnail preview - 50% */}
      <div className="hidden md:block w-1/2 pl-4 text-right">
        <div className="thumbnail sticky top-16" ref={thumbnailContainerRef}>
          <img
            ref={thumbnailRef}
            src={projects[0]?.image}
            alt=""
            className="inline-block"
          />
        </div>
      </div>
    </div>
  );
}
