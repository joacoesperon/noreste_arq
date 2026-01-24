"use client";

import Header from "@/components/Header";

const ownerImage = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=2000&q=80&auto=format&fit=crop";

export default function InfoPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-bone">
        {/* Imagen hero: 95% width, viewport height */}
        <section className="w-full flex justify-center">
          <img
            src={ownerImage}
            alt="Equipo norestearq"
            className="w-[95%] h-[95vh] object-cover"
          />
        </section>

        {/* Contenido */}
        <section className="px-6 md:px-12 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            {/* Contacto - izquierda */}
            <div className="md:pr-10">
              <h2 className="text-xl text-carbon mb-4">Contacto</h2>
              <div className="space-y-2 text-base text-concrete leading-snug">
                <div>
                  <a href="mailto:contacto@norestearq.com" className="underline hover:text-carbon transition-colors">
                    contacto@norestearq.com
                  </a>
                </div>
                <div>
                  <a href="tel:+59893593767" className="underline hover:text-carbon transition-colors">
                    +598 93 593 767
                  </a>
                </div>
                <div className="space-y-0.5">
                  <div>Paseo de La Barra,</div>
                  <div>Local 28,</div>
                  <div>La Barra, Uruguay.</div>
                </div>
                <div>
                  <a href="https://instagram.com/norestearq" target="_blank" rel="noreferrer" className="hover:text-carbon transition-colors">
                    @norestearq
                  </a>
                </div>
              </div>
            </div>

            {/* Nosotros - derecha */}
            <div className="md:pl-10">
              <h2 className="text-xl text-carbon mb-4">Nosotros</h2>
              <div className="space-y-4 text-base text-concrete leading-relaxed">
                <p>
                  Norestearq es un estudio de arquitectura con base en Punta del Este. Trabajamos proyectos residenciales y comerciales con un enfoque sensible al contexto, la luz y la materialidad.
                </p>
                <p>
                  Creemos en la síntesis entre técnica y paisaje. Cada encargo se resuelve con un lenguaje austero, detalles precisos y una búsqueda constante de calidez habitable.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
