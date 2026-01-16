import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero Section - Con imagen de fondo y gradient overlay */}
        <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
          {/* Imagen de fondo */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/GRUPALDR2-1.jpg"
              alt="Comunidad Diablos Rojos"
              fill
              priority
              quality={90}
              className="object-cover object-center"
              sizes="100vw"
            />
          </div>

          {/* Gradient overlay - De oscuro arriba a más claro abajo */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/35 z-10"></div>

          {/* Contenido sobre la imagen */}
          <div className="relative z-20 max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
            <div className="fade-in">
              {/* Tagline pequeño */}
              <p className="text-sm font-medium text-white/90 mb-6 tracking-wide uppercase drop-shadow-lg">
                Fotografía Deportiva
              </p>

              {/* Título principal - Emocional y familiar */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-6 tracking-tight leading-tight drop-shadow-2xl">
                Capturamos los momentos que
                <br />
                unen a nuestra <span className="font-semibold">familia Diablos Rojos</span>
              </h1>

              {/* Subtítulo - Más emocional */}
              <p className="text-lg md:text-xl lg:text-2xl text-white/95 mb-12 max-w-3xl mx-auto font-light leading-relaxed drop-shadow-lg">
                Revive cada jugada, cada gol, cada abrazo.<br className="hidden sm:block" />
                Fotografías que cuentan la historia de tu familia en el campo.
              </p>

              {/* CTA - Rojo vibrante que resalte */}
              <Link
                href="/galerias"
                className="inline-flex items-center gap-2 bg-devil-600 text-white px-10 py-4 rounded-lg font-semibold text-base hover:bg-devil-700 transition-all duration-200 shadow-2xl hover:shadow-devil-600/50 hover:scale-105"
              >
                Ver Galerías
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Indicador de scroll opcional */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
            <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </section>

        {/* Features Section - Minimalista */}
        <section className="py-20 lg:py-28 bg-gray-50">
          <div className="max-w-6xl mx-auto px-8 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
              {/* Feature 1 */}
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-devil-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Cobertura Profesional</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  Fotografías de alta calidad de partidos, torneos y eventos especiales
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-devil-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Galerías Organizadas</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  Encuentra tus fotos fácilmente, organizadas por evento y fecha
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-devil-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Compra Online</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  Selecciona, paga y recibe tus fotos en alta resolución por email
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action - Minimalista */}
        <section className="bg-white py-20 lg:py-28">
          <div className="max-w-4xl mx-auto px-8 lg:px-12 text-center">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6 tracking-tight">
              Explora nuestras <span className="font-semibold">galerías</span>
            </h2>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto font-light">
              Encuentra tus mejores momentos y descárgalos en alta resolución
            </p>
            <Link
              href="/galerias"
              className="inline-flex items-center gap-2 bg-devil-600 text-white px-8 py-3.5 rounded-md font-medium hover:bg-devil-700 transition-colors duration-200"
            >
              Ir a Galerías
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
