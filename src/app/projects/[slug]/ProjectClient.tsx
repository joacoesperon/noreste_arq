"use client";

import { useState, useEffect, useRef } from "react";
import type { Project } from "@/lib/projects";

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
  const galleryRef = useRef<HTMLDivElement>(null);

  // Esperar a que las imágenes carguen para masonry
  useEffect(() => {
    loadedCount.current = 0;
    setImagesLoaded(false);
  }, [project.slug]);

  const handleImageLoad = () => {
    loadedCount.current += 1;
    if (loadedCount.current >= images.length) {
      setImagesLoaded(true);
      // Inicializar Masonry después de que todas las imágenes carguen
      if (galleryRef.current && typeof window !== 'undefined') {
        import('masonry-layout').then((Masonry) => {
          import('imagesloaded').then((imagesLoaded) => {
            const container = galleryRef.current;
            if (container) {
              imagesLoaded.default(container, () => {
                new Masonry.default(container, {
                  percentPosition: true,
                  itemSelector: '.portfolio-item',
                });
              });
            }
          });
        });
      }
    }
  };

  const toggleCredits = () => {
    setShowCredits(!showCredits);
  };

  return (
    <>
      {/* Content - Info del proyecto */}
      <section className="section content">
        <div className="container">
          <div className="title text-center">
            <h1>{project.title}, {project.m2}M<sup>2</sup>, {project.year}</h1>
            <p>{project.location}</p>

            {/* Acordeón para créditos */}
            <div className="accordion" id="accordionCredits">
              <div className="item">
                <button
                  type="button"
                  className={showCredits ? 'active' : ''}
                  onClick={toggleCredits}
                  aria-expanded={showCredits}
                  aria-controls="seeMore"
                ></button>

                <div 
                  id="seeMore" 
                  className={`accordion-collapse ${showCredits ? 'show' : ''}`}
                >
                  <br />
                  <p>Project:</p>
                  <p>{project.credits.proyecto}</p>
                  <br />
                  <p>Team:</p>
                  <p>{project.credits.equipo}</p>
                  <br />
                  <p>Photography:</p>
                  <p>{project.credits.fotografias}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="section gallery">
        <div className="container">
          <div 
            className="row g-2 g-md-5" 
            ref={galleryRef}
            data-masonry='{"percentPosition": true}'
          >
            {images.map((img, index) => (
              <div key={index} className="col-12 col-md-6 portfolio-item">
                <a href={img.src} data-fancybox="gallery" className="noloading">
                  <img
                    src={img.src}
                    alt={`${project.title} - ${img.type} ${index + 1}`}
                    className="img-fluid img-single-project"
                    loading="lazy"
                    onLoad={handleImageLoad}
                    style={{ opacity: imagesLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
                  />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nav Projects */}
      <div className="nav-projects container">
        <div className="prev">
          {prevProject ? (
            <a href={`/projects/${prevProject.slug}`}>
              {prevProject.title}
              <br />
              &lt;
            </a>
          ) : (
            <span style={{ opacity: 0.3 }}>
              —
              <br />
              &lt;
            </span>
          )}
        </div>

        <div className="next text-end">
          {nextProject ? (
            <a href={`/projects/${nextProject.slug}`}>
              {nextProject.title}
              <br />
              &gt;
            </a>
          ) : (
            <span style={{ opacity: 0.3 }}>
              —
              <br />
              &gt;
            </span>
          )}
        </div>
      </div>
    </>
  );
}
