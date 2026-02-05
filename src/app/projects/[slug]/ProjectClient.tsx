"use client";

import { useState, useEffect, useRef } from "react";
import type { Project } from "@/lib/projects";
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import Link from "next/link";
import Image from "next/image";

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
  const galleryRef = useRef<HTMLDivElement>(null);

  // Initialize Fancybox and Masonry
  useEffect(() => {
    // Fancybox
    Fancybox.bind('[data-fancybox="gallery"]', {
      Hash: false,
      Thumbs: {
        autoStart: false,
      },
    } as any);

    // Masonry
    let msnry: any;
    if (galleryRef.current) {
      import("imagesloaded").then((imagesLoaded) => {
        import("masonry-layout").then((Masonry) => {
          if (galleryRef.current) {
            imagesLoaded.default(galleryRef.current, () => {
              msnry = new Masonry.default(galleryRef.current!, {
                percentPosition: true,
                itemSelector: ".portfolio-item",
                columnWidth: ".portfolio-item",
                transitionDuration: "0.3s",
              });
            });
          }
        });
      });
    }

    return () => {
      Fancybox.destroy();
      if (msnry) msnry.destroy();
    };
  }, [project.slug, images]);

  const toggleCredits = () => {
    setShowCredits(!showCredits);
  };

  return (
    <div className="single projects">
      {/* Content - Info del proyecto */}
      <section className="section content">
        <div className="container">
          <div className="title text-center">
            <h1>{project.title}, {project.m2}M2 , {project.year}</h1>
            <p>{project.location}.</p>

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
                  className={`accordion-content ${showCredits ? 'show' : ''}`}
                >
                  <div className="pt-4 pb-5">
                    {Object.entries(project.credits).map(([key, value]) => {
                      if (!value) return null;
                      return (
                        <div key={key} className="mb-4">
                          <p className="mb-0 text-capitalize font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}:</p>
                          <p className="mb-0">{value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="section gallery pt-0">
        <div className="container">
          <div 
            className="row g-2 g-md-5" 
            ref={galleryRef}
          >
            {images.map((img, index) => (
              <div key={index} className="col-12 col-md-6 portfolio-item mb-4">
                <a 
                  href={img.src} 
                  data-fancybox="gallery" 
                  className="noloading block relative w-full aspect-auto"
                >
                  <img
                    src={img.src}
                    alt={`${project.title} - ${img.type} ${index + 1}`}
                    className="img-fluid img-single-project w-full h-auto"
                    loading={index < 4 ? "eager" : "lazy"}
                  />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nav Projects */}
      <div className="nav-projects container">
        <div className="nav-prev">
          {prevProject && (
            <Link href={`/projects/${prevProject.slug}`} className="nav-link">
              <span className="project-name">{prevProject.title}</span>
              <br />
              <span className="arrow">&lt;</span>
            </Link>
          )}
        </div>

        <div className="nav-next">
          {nextProject && (
            <Link href={`/projects/${nextProject.slug}`} className="nav-link">
              <span className="project-name">{nextProject.title}</span>
              <br />
              <span className="arrow">&gt;</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
