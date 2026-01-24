"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Coloca tu imagen de info en: public/images/info.webp (o .jpg, .png)
// Por ahora usamos un placeholder
const infoImage = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80";

export default function InfoPage() {
  return (
    <>
      <Header />
      <main className="main clearfix wrapper">
        <div className="page contact">
          <section className="section content pt-3">
            <div className="container">
              {/* Imagen */}
              <div className="image">
                <img src={infoImage} alt="Equipo noreste arq" className="img-fluid" />
              </div>

              {/* Contenido: 2 columnas */}
              <div className="row pt-5 g-3">
                {/* Contacto - izquierda */}
                <div className="col-12 col-md-4 order-md-1">
                  <article>
                    <div className="title mb-0">
                      <h1>Contact</h1>
                    </div>

                    <div className="data">
                      <ul className="vias list-unstyled">
                        <li className="email">
                          <a href="mailto:contacto@norestearq.com" target="_blank">
                            contacto@norestearq.com
                          </a>
                        </li>
                        <li className="whatsapp mb-3">
                          <a href="https://wa.me/59893593767" target="_blank">
                            + 598 93 593 767
                          </a>
                        </li>
                        <li className="mb-3">
                          Paseo de La Barra,
                          <br />
                          Local 28,
                          <br />
                          La Barra, Uruguay.
                        </li>
                      </ul>

                      <div className="socialmedia">
                        <ul className="list-unstyled">
                          <li>@norestearq</li>
                        </ul>
                      </div>
                    </div>
                  </article>
                </div>

                {/* About - derecha */}
                <div className="col-12 col-md-5 about order-md-2">
                  <article>
                    <div className="title mb-0">
                      <h3>About</h3>
                    </div>
                    <div className="data">
                      <p>
                        Noreste arq es un estudio de arquitectura y diseño con base en Punta del Este, 
                        desde donde desarrollamos proyectos residenciales de diversas escalas.
                        <br />
                        <br />
                        Luego de varios años de práctica en el ámbito local, el Estudio ha logrado 
                        construir un lenguaje propio mediante el uso de la madera como material predominante, 
                        tanto desde el punto de vista formal como constructivo. Nuestros proyectos se 
                        caracterizan por una lectura precisa del contexto, el clima y la geografía esteña.
                      </p>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
