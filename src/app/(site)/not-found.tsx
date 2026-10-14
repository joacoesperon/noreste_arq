"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-[clamp(100px,15vw,180px)] font-light leading-none tracking-tighter text-text opacity-20 select-none">
            404
          </h1>

          <div className="-mt-5 md:-mt-10">
            <h2 className="text-xl font-normal text-text-hover lowercase tracking-widest">
              página no encontrada
            </h2>

            <p className="mt-6 text-text text-base lowercase max-w-xs mx-auto leading-relaxed">
              El enlace que sigues puede estar roto o la página puede haber sido eliminada.
            </p>

            <div className="mt-12">
              <Link 
                href="/" 
                className="inline-block border border-text px-8 py-3 text-text hover:bg-text hover:text-white transition-all duration-300 text-xs uppercase tracking-[0.3em]"
              >
                volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}