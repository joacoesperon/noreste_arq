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
    const rows = document.querySelectorAll('.page.projects .tr');
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
    <div className="row feed-projects">
      <div className="col-12 col-md-6">
        <div className="table">
          <div className="tbody">
            {projects.map((project) => (
              <a
                key={project.slug}
                href={`/projects/${project.slug}`}
                className="tr"
                data-image={project.image}
              >
                <div className="td">{project.title}</div>
                <div className="td">{project.status}</div>
                <div className="td">{project.year}</div>
              </a>
            ))}
            <div className="spacer"></div>
            <div className="spacer"></div>
          </div>
        </div>
      </div>
      
      <div className="col-12 col-md-6 d-none d-md-block text-end">
        <div className="thumbnail" ref={thumbnailContainerRef}>
          <img
            id="project-thumbnail"
            ref={thumbnailRef}
            src={projects[0]?.image}
            alt=""
            className="img-fluid"
          />
        </div>
      </div>
    </div>
  );
}
