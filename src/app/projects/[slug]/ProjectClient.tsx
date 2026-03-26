"use client";

import { useState, useEffect, useRef } from "react";
import type { Project } from "@/lib/projects";
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import Link from "next/link";
import Image from "next/image";

type ProjectMedia = {
  src: string;
  type: "image" | "video";
};

type Props = {
  project: Project;
  media: ProjectMedia[];
  prevProject: Project | null;
  nextProject: Project | null;
};

// Definimos una interfaz mínima para Masonry para evitar errores de tipo
interface MasonryInstance {
  layout(): void;
  destroy(): void;
}

export default function ProjectClient({ project, media, prevProject, nextProject }: Props) {
  const [showCredits, setShowCredits] = useState(false);
  const masonryGridRef = useRef<HTMLDivElement>(null);
  const masonryInstance = useRef<MasonryInstance | null>(null);

  // Initialize Fancybox and Masonry
  useEffect(() => {
    Fancybox.bind('[data-fancybox="gallery"]', {
      hash: false,
      thumbs: {
        autoStart: true,
      },
    } as never);

    // Initialize Masonry only on client-side
    const initMasonry = async () => {
      const Masonry = (await import("masonry-layout")).default;
      const imagesLoaded = (await import("imagesloaded")).default;

      if (masonryGridRef.current) {
        masonryInstance.current = new Masonry(masonryGridRef.current, {
          itemSelector: ".masonry-item",
          columnWidth: ".masonry-sizer",
          percentPosition: true,
          gutter: 0, // Gutters handled via padding in items
          transitionDuration: "0.4s",
        }) as unknown as MasonryInstance;

        // Layout again after each image loads to prevent overlapping/imbalance
        imagesLoaded(masonryGridRef.current).on("progress", () => {
          masonryInstance.current?.layout();
        });
      }
    };

    initMasonry();

    return () => {
      Fancybox.destroy();
      masonryInstance.current?.destroy();
    };
  }, [project.slug, media]);

  const toggleCredits = () => {
    setShowCredits(!showCredits);
  };

  return (
    <div className="w-full">
      {/* Content - Info del proyecto */}
      <section className="mt-17.5 py-7.5 md:py-15">
        <div className="mx-auto px-4 md:px-8 max-w-400">
          <div className="text-center">
            <h1 className="text-lg font-medium mb-0 text-text">
              {project.title}, {project.m2}M2 , {project.year}
            </h1>
            <p className="text-lg text-text">
              {project.location}.
            </p>

            {/* Acordeón para créditos */}
            <div className="mt-4">
              <div className="relative inline-block">
                <button
                  type="button"
                  className={`relative w-7.5 h-7.5 bg-transparent border-none cursor-pointer ${showCredits ? "after:content-['-']" : "after:content-['+']"} after:text-text after:text-2xl after:absolute after:left-1/2 after:top-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:transition-all after:duration-300`}
                  onClick={toggleCredits}
                  aria-expanded={showCredits}
                ></button>

                <div 
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${showCredits ? 'max-h-750 opacity-100 visible' : 'max-h-0 opacity-0 invisible'}`}
                >
                  <div className="pt-4 pb-5 text-text">
                    {Object.entries(project.credits).map(([key, value]) => {
                      if (!value) return null;
                      return (
                        <div key={key} className="mb-4 text-base">
                          <p className="m-0 capitalize font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}:</p>
                          <p className="m-0">{value}</p>
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
      <section className="pt-0 pb-0 md:pb-0">
        <div className="mx-auto px-4 md:px-8 max-w-400">
          {/* Masonry Container */}
          <div ref={masonryGridRef} className="w-full">
            {/* Sizer for responsive columns */}
            <div className="masonry-sizer w-full md:w-1/2"></div>
            
            {media.map((item, index) => (
              <div 
                key={index} 
                className="masonry-item w-full md:w-1/2 mb-5 md:mb-15 px-0 md:px-7.5 group transition-transform duration-300 hover:scale-[1.01]"
              >
                <div className="w-full h-auto overflow-hidden">
                  {item.type === "image" ? (
                    <a 
                      href={item.src} 
                      data-fancybox="gallery" 
                      className="block relative w-full h-auto"
                    >
                      <Image
                        src={item.src}
                        alt={`${project.title} - ${index + 1}`}
                        width={1200}
                        height={1200}
                        style={{ width: '100%', height: 'auto' }}
                        className="block"
                        priority={index < 4}
                      />
                    </a>
                  ) : (
                    <div className="relative w-full h-auto overflow-hidden bg-black">
                      <video
                        controls
                        preload="auto"
                        playsInline
                        src={item.src} 
                        className="w-full h-auto block"
                      />
                      <a 
                        href={item.src}
                        data-fancybox="gallery" 
                        data-type="html5video"
                        data-thumb={`${item.src}#t=0.001`}
                        className="hidden"
                        aria-hidden="true"
                      ></a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nav Projects */}
      <div className="mx-auto px-4 md:px-8 max-w-400 flex justify-between pb-12 text-text">
        <div className="text-left">
          {prevProject && (
            <Link href={`/projects/${prevProject.slug}`} className="group">
              <span className="text-sm md:text-base group-hover:text-text-hover group-hover:underline transition-colors">{prevProject.title}</span>
              <br />
              <span className="text-xl md:text-2xl group-hover:text-text-hover group-hover:underline transition-colors">&lt;</span>
            </Link>
          )}
        </div>

        <div className="text-right">
          {nextProject && (
            <Link href={`/projects/${nextProject.slug}`} className="group">
              <span className="text-sm md:text-base group-hover:text-text-hover group-hover:underline transition-colors">{nextProject.title}</span>
              <br />
              <span className="text-xl md:text-2xl group-hover:text-text-hover group-hover:underline transition-colors">&gt;</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
