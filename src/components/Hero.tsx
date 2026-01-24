"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Opacidad: 1 al inicio, se desvanece más lento (cerca del 60% del scroll)
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div ref={ref} className="h-screen">
      {/* Texto fijo que no se mueve */}
      <motion.div
        className="fixed inset-0 flex items-center justify-center pointer-events-none z-10"
        style={{ opacity }}
      >
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-carbon text-center leading-tight">
          noreste
          <br />
          arquitectura
        </h1>
      </motion.div>
    </div>
  );
}
