import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-white">
        {/* Hero Section - Minimalista */}
        <section className="relative bg-white">
          <div className="max-w-5xl mx-auto px-8 lg:px-12 py-24 md:py-32 lg:py-40">
            <div className="text-center fade-in">
              {/* Tagline pequeño */}
              <p className="text-sm font-medium text-devil-600 mb-6 tracking-wide uppercase">
                Fotografía Deportiva
              </p>

              {/* Título principal - minimalista pero impactante */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-gray-900 mb-8 tracking-tight leading-tight">
                Capturamos la emoción
                <br />
                de cada <span className="font-semibold text-devil-600">momento</span>
              </h1>

              {/* Subtítulo */}
              <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                Fotografía profesional de partidos, torneos y eventos deportivos.
                Revive tus mejores jugadas en alta calidad.
              </p>

              {/* CTA - simple y directo */}
              <Link
                href="/galerias"
                className="inline-flex items-center gap-2 bg-devil-600 text-white px-8 py-3.5 rounded-md font-medium text-base hover:bg-devil-700 transition-colors duration-200"
              >
                Ver Galerías
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Divider sutil */}
          <div className="border-t border-gray-100"></div>
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
