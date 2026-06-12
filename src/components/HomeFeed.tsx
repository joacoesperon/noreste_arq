"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import Image from "next/image";
import { optimizeCloudinaryVideo } from "@/lib/media";

gsap.registerPlugin(ScrollTrigger);

type ProjectForFeed = {
  slug: string;
  title: string;
  image: string;
};

type Props = {
  projects: ProjectForFeed[];
  logoImage: string;
};

export default function HomeFeed({ projects, logoImage }: Props) {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const presentationSectionRef = useRef<HTMLDivElement>(null);
  const logoContainerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Detectar cambio en accesibilidad
  useEffect(() => {
    const checkMotion = () => {
      const motion = document.documentElement.getAttribute("data-a11y-motion");
      setIsReducedMotion(motion === "reduced");
    };

    checkMotion();

    const observer = new MutationObserver(checkMotion);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-a11y-motion"]
    });

    return () => observer.disconnect();
  }, []);

  // 2. Lógica para el modo NORMAL (GSAP) y Presentación (Logo)
  useEffect(() => {
    // Bloquear scroll del root solo en esta página
    document.documentElement.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      const scroller = scrollerRef.current;
      const presentationSection = presentationSectionRef.current;
      const logoContainer = logoContainerRef.current;

      if (!scroller) return;

      // --- LÓGICA DE VIDEOS (Solo modo normal) ---
      const checkAndPlayVideos = () => {
        if (isReducedMotion) return;
        const feedItems = itemsRef.current.filter((item): item is HTMLAnchorElement => item !== null);
        feedItems.forEach((item, index) => {
          const video = videoRefs.current[index];
          if (!video) return;
          const imageWrapper = item.querySelector(".home__feed__item__img");
          if (!imageWrapper) return;
          const currentScale = gsap.getProperty(imageWrapper, "scale") as number;
          if (currentScale >= 0.8) {
            // iOS bloquea el autoplay si el video no está muteado en el momento
            // de llamar a play(); lo forzamos por las dudas.
            video.muted = true;
            video.play().catch((err) => {
              console.warn("No se pudo reproducir el video del feed:", err);
            });
          } else {
            video.pause();
          }
        });
      };

      // --- MANEJADOR DE SCROLL (Común a ambos modos para el Logo) ---
      const handleScroll = () => {
        const scrollTop = scroller.scrollTop;
        
        // Control de visibilidad del Logo
        if (logoContainer) {
          if (scrollTop > 200) logoContainer.classList.add('scroll');
          else logoContainer.classList.remove('scroll');
        }

        // Lógica de videos (Solo si no es movimiento reducido)
        if (!isReducedMotion) {
          videoRefs.current.forEach(v => v?.pause());
          if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
          // Reproducir el video apenas frenás el scroll (0.125 s) en vez de medio segundo.
          scrollTimeoutRef.current = setTimeout(() => {
            checkAndPlayVideos();
          }, 125);
        }
      };

      scroller.addEventListener('scroll', handleScroll);

      // Animación de Presentación (Logo) - COMÚN A AMBAS VERSIONES
      if (presentationSection) {
        gsap.to(presentationSection, { 
          opacity: 0, 
          scrollTrigger: { 
            trigger: ".presentation-spacer", 
            start: "top top", 
            end: "center top", 
            scrub: 0.5, 
            scroller: scroller 
          } 
        });
      }

      // Si es movimiento reducido, abortamos la lógica de los proyectos individuales animadps
      if (isReducedMotion) {
        ScrollTrigger.refresh();
        // Devolvemos el cleanup del listener de scroll para el modo reducido
        return () => scroller.removeEventListener('scroll', handleScroll);
      }

      const feedItems = itemsRef.current.filter((item): item is HTMLAnchorElement => item !== null);
      if (feedItems.length === 0) return;

      const feedScrub = 1000;

      function createIndexScrollTrigger() {
        ScrollTrigger.getAll().forEach(trigger => {
            // No matar el trigger de la presentación
            if (trigger.vars.trigger !== ".presentation-spacer") {
                trigger.kill();
            }
        });
        
        ScrollTrigger.defaults({ scroller: scroller });

        gsap.matchMedia().add({
            desktop: "(min-aspect-ratio: 1068/798)",
            tablet: "(max-aspect-ratio: 1068/798)",
            mobile: "(max-aspect-ratio: 695/924)"
        }, context => {
            const { desktop: _isDesktop, tablet: isTablet, mobile: isMobile } = context.conditions || {};
            const scale = 0.15;
            let yPercentVal = 31.75, animDuration = 0.185, startPos = "0% 100%", endPos = "100% 0%", scrubValue: boolean | number = true;
            if (isTablet) { yPercentVal = 41; animDuration = 0.24; scrubValue = feedScrub / 1000; }
            if (isMobile) { yPercentVal = 56.5; animDuration = 0.3334; startPos = "0% 125%"; endPos = "100% -25%"; scrubValue = feedScrub / 1000; }

            feedItems.forEach((item) => {
                const imageElement = item.querySelector(".home__feed__item__img");
                const labelElement = item.querySelector(".home__feed__item__label");
                if (!imageElement || !item) return;
                gsap.set(imageElement, { clearProps: "all" });
                const timeline = gsap.timeline({ scrollTrigger: { trigger: item, start: startPos, end: endPos, scrub: scrubValue } });
                timeline.from(imageElement, { scale: scale, ease: "linear", duration: 0.5 }, "0").to(imageElement, { scale: scale, ease: "linear", duration: 0.5 }, "0.5");
                if (isMobile) {
                    if (labelElement) {
                        timeline.from(labelElement, { height: `${scale * 100}%`, ease: "linear", duration: 0.5 }, "0");
                        timeline.to(labelElement, { height: `${scale * 100}%`, ease: "linear", duration: 0.5 }, "0.5");
                    }
                    timeline.fromTo(imageElement, { yPercent: -85 }, { yPercent: -28.5, duration: 1/6, ease: "linear" }, 0);
                    timeline.fromTo(imageElement, { yPercent: -28.5 }, { yPercent: 0, duration: 1/6, ease: "linear" }, 1/6);
                    timeline.fromTo(imageElement, { yPercent: 0 }, { yPercent: 28.5, duration: 1/6, ease: "linear" }, 1 - 1/3);
                    timeline.fromTo(imageElement, { yPercent: 28.5 }, { yPercent: 85, duration: 1/6, ease: "linear" }, 1 - 1/6);
                } else {
                    if (labelElement) {
                        timeline.from(labelElement, { height: `${scale * 100}%`, ease: "linear", duration: 0.5 }, "0");
                        timeline.to(labelElement, { height: `${scale * 100}%`, ease: "linear", duration: 0.5 }, "0.5");
                    }
                    timeline.fromTo(imageElement, { yPercent: -yPercentVal }, { yPercent: 0, duration: animDuration, ease: "linear" }, 0);
                    timeline.fromTo(imageElement, { yPercent: 0 }, { yPercent: yPercentVal, duration: animDuration, ease: "linear" }, 1 - animDuration);
                }
            });
        });

        ScrollTrigger.refresh();
      }

      createIndexScrollTrigger();
      window.addEventListener('resize', createIndexScrollTrigger);

      return () => {
        scroller.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', createIndexScrollTrigger);
      };
    }, containerRef);

    return () => {
      document.documentElement.style.overflow = "auto";
      ctx.revert();
    };
  }, [projects, isReducedMotion]);


  return (
    <div ref={containerRef} className="page-wrapper">
      <div ref={scrollerRef} className="page home home-scroll">
        <div className="presentation-spacer"></div>
        
        {/* Presentación (Logo inicial) común a ambas versiones */}
        <section ref={presentationSectionRef} className="section presentation">
          <div className="container mx-auto px-4 max-w-400">
            <div ref={logoContainerRef} className="logo w-full flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoImage} alt="Logo" className="w-full h-auto block max-w-300" />
            </div>
          </div>
        </section>

        {isReducedMotion ? (
          /* VERSIÓN A: MODO REDUCIR MOVIMIENTO (Galería Estática Compacta) */
          <section className="w-full bg-white pt-10 pb-40">
            <div className="w-full">
              {projects.map((project) => {
                const isVideo = project.image.toLowerCase().endsWith('.mp4') || project.image.toLowerCase().endsWith('.webm');
                return (  
                  <div key={project.slug} className="home-reduced-item-wrapper mb-24">
                    <Link 
                      href={`/projects/${project.slug}`} 
                      className="group block w-full"
                    >
                      <p className="text-base text-text mt-4">
                        {project.title}
                      </p>
                      {isVideo ? (
                        <video
                          src={optimizeCloudinaryVideo(project.image, 720)}
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="home-reduced-img"
                        />
                      ) : (
                        <Image
                          src={project.image}
                          alt={project.title}
                          width={1200}
                          height={800}
                          style={{ width: '100%', height: 'auto' }}
                          className="home-reduced-img"
                        />
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          /* VERSIÓN B: MODO NORMAL (GSAP / Animado) */
          <section className="section projects pt-0">
            <div className="container mx-auto px-4 max-w-400">
              <div className="home__feed">
                {projects.map((project, index) => {
                  const isVideo = project.image.toLowerCase().endsWith('.mp4') || project.image.toLowerCase().endsWith('.webm');
                  return (
                    <Link 
                      href={`/projects/${project.slug}`}
                      key={project.slug}
                      className="home__feed__item"
                      ref={(el) => { itemsRef.current[index] = el; }}
                    >
                      <div className="home__feed__item__img relative overflow-hidden">
                        {isVideo ? (
                          <video
                            ref={(el) => { videoRefs.current[index] = el; }}
                            src={optimizeCloudinaryVideo(project.image, 720)}
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            className="w-auto max-w-full h-full block object-cover z-10"
                          />
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={project.image} alt={project.title} loading={index < 3 ? "eager" : "lazy"} className="relative z-10" />
                        )}
                      </div>

                      <div className="home__feed__item__label">
                        <p>{project.title}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="h-[20vh] md:hidden"></div>
          </section>
        )}
      </div>
    </div>
  );
}
