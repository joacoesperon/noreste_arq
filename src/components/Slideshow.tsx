"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SCALE_MIN = 0.15;
const SCALE_MAX = 1;

type ProjectForSlideshow = {
  slug: string;
  title: string;
  image: string;
};

type Props = {
  projects: ProjectForSlideshow[];
};

export default function Slideshow({ projects }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const items = itemsRef.current.filter(Boolean) as HTMLDivElement[];
    
    items.forEach((item, idx) => {
      const imageElement = item.querySelector(".image-wrapper") as HTMLElement;
      if (!imageElement) return;

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: item,
          start: "0% 100%",
          end: "100% 0%",
          scrub: true,
        }
      });

      // Escala: de MIN a MAX a MIN
      timeline.from(imageElement, {
        scale: SCALE_MIN,
        ease: "linear",
        duration: 0.5
      }, "0");
      
      timeline.to(imageElement, {
        scale: SCALE_MIN,
        ease: "linear",
        duration: 0.5
      }, "0.5");

      // Y percent para compensar zoom
      const yPercent = 31.75;
      const duration = 0.185;
      
      timeline.fromTo(imageElement, 
        { yPercent: -yPercent },
        { yPercent: 0, duration: duration, ease: "linear" },
        0
      );
      
      timeline.fromTo(imageElement,
        { yPercent: 0 },
        { yPercent: yPercent, duration: duration, ease: "linear" },
        1 - duration
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-[300vh] w-full flex-col items-center px-4 pt-[20vh] pb-[12.5vh]"
    >
      {projects.map((project, index) => (
        <div
          key={project.slug}
          ref={(el) => { itemsRef.current[index] = el; }}
          className={`h-[75vh] flex items-center justify-center ${index !== 0 ? '-mt-[20vh]' : 'mt-[50px]'}`}
        >
          <a
            href={`/projects/${project.slug}`}
            className="block group h-full flex items-center justify-center"
          >
            <div 
              className="image-wrapper relative overflow-hidden"
              style={{ 
                width: "60vw",
                aspectRatio: "16/10",
              }}
            >
              <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority={index === 0}
              />
              
              <div className="absolute inset-0 bg-carbon/0 group-hover:bg-carbon/20 transition-colors duration-300" />
              
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                <h2 className="text-bone text-lg md:text-xl font-light tracking-wide drop-shadow-lg">
                  {project.title}
                </h2>
              </div>
            </div>
          </a>
        </div>
      ))}
    </div>
  );
}
