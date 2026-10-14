import Header from "@/components/Header";
import Image from "next/image";

export default function InfoPage() {
  return (
    <>
      <Header />
      {/* 
        main: 
        - Por defecto (Mobile/Portrait): relative, alto automático y scroll habilitado.
        - lg:landscape: Solo en pantallas grandes HORIZONTALES se habilita el scroll si el contenido excede el alto.
      */}
      <main className="relative h-auto overflow-y-auto pt-15 lg:landscape:absolute lg:landscape:inset-0 lg:landscape:top-19.5 lg:landscape:overflow-y-auto lg:landscape:pt-0 lg:landscape:pb-10">
        
        {/* section: Una sola columna por defecto, dos columnas solo en LG + Landscape */}
        <section className="min-h-full lg:landscape:min-h-full grid grid-cols-1 lg:landscape:grid-cols-2">

          {/* Columna Izquierda: Textos centrados */}
          <div className="flex flex-col justify-center p-6 md:p-12 lg:landscape:px-20 xl:landscape:px-24">
            
            <div className="space-y-10 lg:landscape:space-y-16 xl:landscape:space-y-20 py-8 lg:landscape:py-0">
              
              {/* Sección Contacto */}
              <article>
                <div className="mb-4">
                  <h1 className="text-text text-base uppercase tracking-[0.2em] font-medium m-0 opacity-50">
                    Contacto
                  </h1>
                </div>
                <div className="text-text text-base leading-[1.8]">
                  <ul className="list-none p-0 m-0 space-y-1 md:space-y-3">
                    <li className="pb-2 md:pb-4 font-medium text-base">
                      Arq. Juan Esperon <br />
                      Arq. Josefina Gardey
                    </li>
                    <li>
                      <a href="mailto:norestearquitectura@gmail.com" className="underline underline-offset-2 hover:text-text-hover transition-colors">
                        norestearquitectura@gmail.com
                      </a>
                    </li>
                    <li className="flex flex-col space-y-0">
                      <a href="https://wa.me/5491150511959" target="_blank" className="underline underline-offset-2 hover:text-text-hover transition-colors">
                        +54 911 5051-1959
                      </a>
                      <a href="https://wa.me/+5492478511254" target="_blank" className="underline underline-offset-2 hover:text-text-hover transition-colors">
                        +54 924 7851-1254
                      </a>
                    </li>
                    <li>Buenos Aires, Argentina.</li>
                    <li>
                      <a href="https://www.instagram.com/noreste.arq/" target="_blank" className="underline underline-offset-2 hover:text-text-hover transition-colors">
                        @noreste.arq
                      </a>
                    </li>
                  </ul>
                </div>
              </article>

              {/* Sección Nosotros */}
              <article>
                <div className="mb-4">
                  <h3 className="text-text text-base uppercase tracking-[0.2em] font-medium m-0 opacity-50">
                    Nosotros
                  </h3>
                </div>
                <div className="text-text text-base leading-[1.8] max-w-125">
                  <p className="mb-4">
                    Estudio de arquitectura y diseño dedicado al desarrollo de proyectos de distintas escalas y programas, con foco en el diseño de espacios y la experiencia de habitar.
                  </p>
                  <p>
                    La arquitectura surge de una lectura sensible del lugar, integrando contexto, clima y entorno como parte esencial del proyecto.
                  </p>
                </div>
              </article>
            </div>
          </div>

          {/* Columna Derecha: Imagen */}
          <div className="order-first lg:landscape:order-last aspect-video lg:landscape:aspect-auto lg:landscape:h-full pt-4 lg:landscape:py-4 px-4 lg:landscape:px-4 flex flex-col">
            <div className="relative flex-1 w-full">
              <Image
                src="https://res.cloudinary.com/noresta/image/upload/v1773088598/WhatsApp_Image_2026-03-09_at_5.23.30_PM_zxs5ab.webp"
                alt="Estudio Noreste Arq"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

        </section>
      </main>
    </>
  );
}
