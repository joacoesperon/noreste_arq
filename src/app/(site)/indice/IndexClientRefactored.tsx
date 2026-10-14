"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { optimizeCloudinaryVideo } from "@/lib/media";
import {
  WheelPicker,
  WheelPickerWrapper,
  type WheelPickerOption,
} from "@ncdai/react-wheel-picker";

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

export default function IndexClientRefactored({ projects }: Props) {

  const router = useRouter();
  const [activeImage, setActiveImage] = useState(projects[0]?.image || "");
  const [activeSlug, setActiveSlug] = useState(projects[0]?.slug || "");
  const [interactionMode, setInteractionMode] = useState<"mouse" | "touch" | "loading">("loading");
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const wheelTouching = useRef(false);

  const [pickerItemHeight, setPickerItemHeight] = useState(60);
  const PICKER_VISIBLE_COUNT = 8; // ← cambiá acá para ajustar (múltiplo de 4)

  const pickerRef = useRef<HTMLDivElement>(null);

  // Refs para poder acceder a los valores actuales dentro de los listeners nativos
  const activeSlugRef = useRef(activeSlug);
  const pickerItemHeightRef = useRef(pickerItemHeight);
  useEffect(() => { activeSlugRef.current = activeSlug; }, [activeSlug]);
  useEffect(() => { pickerItemHeightRef.current = pickerItemHeight; }, [pickerItemHeight]);

  const calcHeight = () => {
    const headerHeight = window.innerWidth >= 768 ? 78 : 60;
    const availableHeight = window.innerHeight - headerHeight;
    const isLandscape = window.innerWidth > window.innerHeight;
    const pickerZoneHeight = isLandscape ? availableHeight : availableHeight / 2;
    // El picker debe caber EXACTAMENTE en su zona ← AJUSTAR dividiendo por PICKER_VISIBLE_COUNT
    const height = Math.floor(pickerZoneHeight / PICKER_VISIBLE_COUNT);
    setPickerItemHeight(height);
  };

  useEffect(() => {
    calcHeight();
    window.addEventListener("resize", calcHeight);
    window.addEventListener("orientationchange", calcHeight);
    return () => {
      window.removeEventListener("resize", calcHeight);
      window.removeEventListener("orientationchange", calcHeight);
    };
  }, []);

  useEffect(() => {
    const checkUI = () => {
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      setInteractionMode(hasTouch ? "touch" : "mouse");
    };
    checkUI();
    window.addEventListener("resize", checkUI);
    return () => window.removeEventListener("resize", checkUI);
  }, []);

  // Bloquear scroll de página en modo touch
  useEffect(() => {
    if (interactionMode !== "touch") return;
    const preventScroll = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("touchmove", preventScroll);
    };
  }, [interactionMode]);

  // ── Listeners nativos en fase CAPTURA para interceptar antes que el picker ──
  // Se registran una sola vez cuando el picker está montado en modo touch.
  // capture: true → se ejecutan ANTES que los listeners del picker.
  useEffect(() => {
    if (interactionMode !== "touch") return;
    const container = pickerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartPos.current) return;
      const touch = e.changedTouches[0];
      const dist = Math.sqrt(
        Math.pow(touch.clientX - touchStartPos.current.x, 2) +
        Math.pow(touch.clientY - touchStartPos.current.y, 2)
      );

      if (dist < 10 && !wheelTouching.current) {
        const rect = container.getBoundingClientRect();
        const clickY = touch.clientY - rect.top;
        const centerY = rect.height / 2;
        // ← AJUSTAR zoneHeight si cambiás optionItemHeight
        const zoneHeight = pickerItemHeightRef.current;

        if (clickY > centerY - zoneHeight / 2 && clickY < centerY + zoneHeight / 2) {
          const slug = activeSlugRef.current;
          if (slug) {
            // stopImmediatePropagation en fase de captura detiene
            // los listeners nativos del picker antes de que los procese
            e.stopImmediatePropagation();
            router.push(`/projects/${slug}`);
          }
        }
      }

      touchStartPos.current = null;
    };

    // capture: true es la clave — se ejecuta antes que los listeners del picker
    container.addEventListener("touchstart", handleTouchStart, { capture: true });
    container.addEventListener("touchend", handleTouchEnd, { capture: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart, { capture: true });
      container.removeEventListener("touchend", handleTouchEnd, { capture: true });
    };
  }, [interactionMode, router]); // solo se re-registra si cambia el modo o router

  const updateMedia = (imageUrl: string, slug: string) => {
    if (activeSlug === slug && activeImage === imageUrl) return;
    setActiveSlug(slug);
    setActiveImage(imageUrl);
  };

  const handleMouseEnter = (imageUrl: string, slug: string) => {
    if (interactionMode === "mouse") updateMedia(imageUrl, slug);
  };

  const handleWheelChange = (slug: string) => {
    wheelTouching.current = true;
    const project = projects.find((p) => p.slug === slug);
    if (project) updateMedia(project.image, project.slug);
    setTimeout(() => { wheelTouching.current = false; }, 300);
  };

  if (interactionMode === "loading") {
    return <div className="w-full bg-white" style={{ height: "calc(100svh - 60px)" }} />;
  }

  const wheelOptions: WheelPickerOption[] = projects.map((p) => ({
    label: (
      <div className="flex w-full h-full items-center px-4 text-base">
        <span className="flex-1 text-left truncate pr-2">{p.title}</span>
        <span className="w-[6em] text-center opacity-60 text-sm">{p.status}</span>
        <span className="w-[3em] text-right opacity-60 text-sm">{p.year}</span>
      </div>
    ),
    value: p.slug,
  }));

  const isVideoActive =
    activeImage.toLowerCase().endsWith(".mp4") ||
    activeImage.toLowerCase().endsWith(".webm");

  // ─── MODO TOUCH ────────────────────────────────────────────────────────────
  if (interactionMode === "touch") {
    return (
      <div className="fixed inset-0 overflow-hidden bg-white flex flex-col landscape:flex-row">
        <div
          className="
            w-full h-full
            flex flex-col landscape:flex-row
            items-stretch

            pt-[10vh]
            pb-[5vh]
            gap-[5vh]
            px-[5vw]

            landscape:pt-[15vh]
            landscape:pb-[5vh]
            landscape:px-[2vw]
            landscape:gap-0
          "
        >
          {/* ── WHEEL PICKER ── */}
          <div
            ref={pickerRef}
            className="
              w-full landscape:w-1/2
              h-[35vh] landscape:h-full
              flex items-center justify-center
              min-h-0
            "
            // onTouchStart y onTouchEnd ya no van aquí —
            // están registrados como listeners nativos en el useEffect de arriba
          >
            <WheelPickerWrapper className="w-full h-full border-none bg-transparent">
              <WheelPicker
                options={wheelOptions}
                value={activeSlug}
                onValueChange={handleWheelChange}
                optionItemHeight={pickerItemHeight} /* ← AJUSTAR altura de cada fila */
                visibleCount={PICKER_VISIBLE_COUNT * 4} /* ← AJUSTAR cuántas filas se ven */
                classNames={{
                  optionItem: "text-(--color-text) transition-colors duration-300",
                  highlightWrapper: "bg-white border-y border-gray-100 h-[60px] z-10",
                  highlightItem: "text-(--color-text-hover) font-semibold text-lg z-20 [&_span]:opacity-100",
                }}
              />
            </WheelPickerWrapper>
          </div>

          {/* ── IMAGEN / VIDEO ── */}
          <div
            className="
              w-full landscape:w-1/2
              h-[45vh] landscape:h-full
              relative
              min-h-0
            "
          >
            {activeImage && (
              <div key={activeImage} className="absolute inset-0">
                {isVideoActive ? (
                  <video
                    src={optimizeCloudinaryVideo(activeImage, 1080)}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-contain object-center"
                  />
                ) : (
                  <Image
                    src={activeImage}
                    alt="Project thumbnail"
                    fill
                    className="object-contain object-center"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── MODO MOUSE ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-row w-full h-[70vh] min-h-125">

      {/* Lista de proyectos con hover */}
      <div className="w-1/2 h-full flex items-start justify-start bg-white z-10 overflow-y-auto custom-scrollbar">
        <div className="w-full text-title pr-8 flex flex-col">
          {projects.map((project) => (
            <Link
              key={project.slug}
              href={`/projects/${project.slug}`}
              className={`
                flex items-baseline py-1.25 transition-colors duration-200
                ${activeSlug === project.slug
                  ? "text-text-hover font-medium"
                  : "text-text/40"
                }
                hover:text-text-hover
              `}
              onMouseEnter={() => handleMouseEnter(project.image, project.slug)}
            >
              <div className="flex-1 pr-4">{project.title}</div>
              <div className="w-[8em] text-center whitespace-nowrap px-2">{project.status}</div>
              <div className="w-[4em] text-right whitespace-nowrap">{project.year}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Imagen / Video */}
      <div className="w-1/2 h-full relative">
        <div className="w-full h-full overflow-hidden relative">
          {activeImage && (
            <div key={activeImage} className="relative w-full h-full">
              {isVideoActive ? (
                <video
                  src={optimizeCloudinaryVideo(activeImage, 1080)}
                  autoPlay muted loop playsInline
                  className="w-full h-full object-contain object-top"
                />
              ) : (
                <Image
                  src={activeImage}
                  alt="Project thumbnail"
                  fill
                  className="object-contain object-top"
                  sizes="50vw"
                  priority
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}