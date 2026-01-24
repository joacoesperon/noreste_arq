"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
  const feedItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const titleCurrentRef = useRef<HTMLSpanElement>(null);
  const presentationLogoRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const feedItems = feedItemsRef.current.filter(Boolean) as HTMLAnchorElement[];
    const titleSpan = titleCurrentRef.current;
    const presentationLogo = presentationLogoRef.current;
    const titleCurrent = document.querySelector('.title_current');
    const page = pageRef.current;

    if (!page || feedItems.length === 0) return;

    const feedScrub = 1000;

    // Función para obtener el elemento actual del feed
    const getCurrentFeedScrollElement = () => {
      const scrollPosition = window.scrollY;
      let currentItemIndex = 0;

      feedItems.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const itemTop = rect.top + scrollPosition;
        const itemHeight = item.offsetHeight;

        if (scrollPosition >= itemTop - window.innerHeight / 2 && 
            scrollPosition < itemTop + itemHeight - window.innerHeight / 2) {
          currentItemIndex = index;
        }
      });

      if (titleSpan) {
        const currentItem = feedItems[currentItemIndex];
        if (currentItem) {
          const labelElement = currentItem.querySelector(".home__feed__item__label p");
          if (labelElement) {
            titleSpan.textContent = labelElement.textContent;
          }
        }
      }
    };

    // Función para actualizar el título en scroll (móvil)
    const updateTitleOnScroll = (item: HTMLAnchorElement) => {
      if (titleSpan) {
        const labelElement = item.querySelector('.home__feed__item__label');
        if (labelElement) {
          titleSpan.textContent = labelElement.textContent;
        }
      }
    };

    // Crear ScrollTriggers - usando window como scroller (sin scroller: específico)
    const createIndexScrollTrigger = () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());

      gsap.matchMedia().add({
        desktop: "(min-aspect-ratio: 1068/798)",
        tablet: "(max-aspect-ratio: 1068/798)",
        mobile: "(max-aspect-ratio: 695/924)"
      }, context => {
        const { desktop: isDesktop, tablet: isTablet, mobile: isMobile } = context.conditions || {};
        
        let scale = 0.15;
        let yPercentDesktop = 31.75;
        let animationDurationDesktop = 0.185;
        let startDesktop = "0% 100%";
        let endDesktop = "100% 0%";
        let scrubValue: boolean | number = true;

        if (isTablet) {
          yPercentDesktop = 41;
          animationDurationDesktop = 0.24;
          scrubValue = feedScrub / 1000;
        }

        if (isMobile) {
          yPercentDesktop = 56.5;
          animationDurationDesktop = 0.3334;
          startDesktop = "0% 125%";
          endDesktop = "100% -25%";
          scrubValue = feedScrub / 1000;
        }

        feedItems.forEach((item, index) => {
          const imageElement = item.querySelector(".home__feed__item__img") as HTMLElement;
          const labelElement = item.querySelector(".home__feed__item__label") as HTMLElement;
          const imgElement = item.querySelector(".home__feed__item__img") as HTMLElement;

          if (!imageElement) return;

          // Reset transformations
          gsap.set(imageElement, { clearProps: "all" });

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: item,
              start: startDesktop,
              end: endDesktop,
              scrub: scrubValue,
              // Sin scroller = usa window
              onUpdate: () => {
                if (isMobile) {
                  updateTitleOnScroll(item);
                }
              }
            }
          });

          // Escala: de pequeño a grande a pequeño
          timeline.from(imageElement, {
            scale: scale,
            ease: "linear",
            duration: 0.5
          }, "0");

          timeline.to(imageElement, {
            scale: scale,
            ease: "linear",
            duration: 0.5
          }, "0.5");

          if (isMobile) {
            timeline.fromTo(imgElement,
              { yPercent: -85 },
              { yPercent: -28.5, duration: 1 / 6, ease: "linear" },
              0
            );
            timeline.fromTo(imgElement,
              { yPercent: -28.5 },
              { yPercent: 0, duration: 1 / 6, ease: "linear" },
              1 / 6
            );
            timeline.fromTo(imgElement,
              { yPercent: 0 },
              { yPercent: 28.5, duration: 1 / 6, ease: "linear" },
              1 - 1 / 3
            );
            timeline.fromTo(imgElement,
              { yPercent: 28.5 },
              { yPercent: 85, duration: 1 / 6, ease: "linear" },
              1 - 1 / 6
            );
          } else {
            if (index !== 0 && labelElement) {
              timeline.from(labelElement, {
                height: scale * 100 + "%",
                ease: "linear",
                duration: 0.5
              }, "0");
              timeline.to(labelElement, {
                height: scale * 100 + "%",
                ease: "linear",
                duration: 0.5
              }, "0.5");
            }

            timeline.fromTo(imgElement,
              { yPercent: -yPercentDesktop },
              { yPercent: 0, duration: animationDurationDesktop, ease: "linear" },
              0
            );
            timeline.fromTo(imgElement,
              { yPercent: 0 },
              { yPercent: yPercentDesktop, duration: animationDurationDesktop, ease: "linear" },
              1 - animationDurationDesktop
            );
          }
        });

        setTimeout(() => {
          getCurrentFeedScrollElement();
        }, 0);

        window.addEventListener('scroll', getCurrentFeedScrollElement);

        return () => {
          window.removeEventListener('scroll', getCurrentFeedScrollElement);
        };
      });

      // Presentation animation - usando window
      const presentationElement = document.querySelector('.presentation');
      if (presentationElement) {
        gsap.to(".presentation", {
          opacity: 0,
          scrollTrigger: {
            trigger: ".presentation-spacer",
            start: "top top",
            end: "center top",
            scrub: 0.5,
            // Sin scroller = usa window
          }
        });
      }

      ScrollTrigger.refresh();
    };

    createIndexScrollTrigger();

    // Scroll events para título móvil y logo - usando window
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      
      if (titleCurrent) {
        if (scrollTop > 0) {
          titleCurrent.classList.add('scroll');
        } else {
          titleCurrent.classList.remove('scroll');
        }
      }

      if (presentationLogo) {
        if (scrollTop > 200) {
          presentationLogo.classList.add('scroll');
        } else {
          presentationLogo.classList.remove('scroll');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);

    const handleResize = () => {
      createIndexScrollTrigger();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [projects]);

  return (
    <div className="page home" ref={pageRef}>
      <div className="presentation-spacer"></div>
      
      <section className="section presentation">
        <div className="container">
          <div className="logo" ref={presentationLogoRef}>
            <img src={logoImage} alt="noreste arq" className="img-fluid w-100" />
          </div>
        </div>
      </section>

      <section className="section projects pt-0">
        <div className="container">
          <div className="home__feed">
            {projects.map((project, index) => (
              <a
                key={project.slug}
                href={`/projects/${project.slug}`}
                className="home__feed__item"
                data-index={index + 1}
                ref={(el) => { feedItemsRef.current[index] = el; }}
              >
                <div className="home__feed__item__img">
                  <picture className="img__to__preload">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="img img-fluid"
                      loading={index < 3 ? "eager" : "lazy"}
                    />
                  </picture>
                </div>

                <div className="home__feed__item__label">
                  <p>{project.title}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="title_current">
        <span ref={titleCurrentRef}></span>
      </div>
    </div>
  );
}
