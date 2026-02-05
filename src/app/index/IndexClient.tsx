"use client";

import { useRef } from "react";

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

  const handleMouseOver = (imageUrl: string) => {
    const thumbnail = thumbnailRef.current;
    const thumbnailContainer = thumbnailContainerRef.current;

    if (!thumbnail || !thumbnailContainer || !imageUrl) return;

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
  };

  const handleMouseOut = () => {
    const thumbnail = thumbnailRef.current;
    if (thumbnail) {
      thumbnail.classList.remove("fade-in");
    }
  };

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
                onMouseOver={() => handleMouseOver(project.image)}
                onMouseOut={handleMouseOut}
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
            src={projects[0]?.image || ''}
            alt=""
            className="img-fluid"
          />
        </div>
      </div>
    </div>
  );
}
