import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-devil-900 via-devil-700 to-devil-600 text-white overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-gold rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
            <div className="text-center animate-slide-up">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold mb-6 tracking-tight">
                DIABLOS ROJOS
                <br />
                <span className="text-accent-gold">FOTOGRAFÍA</span>
              </h1>
              <p className="text-xl md:text-2xl lg:text-3xl mb-4 text-devil-100 max-w-3xl mx-auto font-light">
                Captura. Revive. Comparte.
              </p>
              <p className="text-base md:text-lg mb-10 text-devil-200 max-w-2xl mx-auto">
                Los mejores momentos de tus partidos y torneos de fútbol infantil en alta calidad
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/galerias"
                  className="group relative inline-flex items-center gap-2 bg-white text-devil-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-accent-warm transition-all duration-300 shadow-premium hover:shadow-premium-lg hover:scale-105"
                >
                  <span>Ver Galerías</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Modern wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 1440 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto"
            >
              <path
                d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
                fill="#fafafa"
              />
            </svg>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-accent-warm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-4 text-gray-900">
              ¿QUÉ OFRECEMOS?
            </h2>
            <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
              Servicios profesionales de fotografía deportiva diseñados para capturar la emoción del juego
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group text-center p-8 bg-white rounded-2xl hover-lift border border-gray-100">
                <div className="bg-gradient-to-br from-devil-500 to-devil-700 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Cobertura Completa</h3>
                <p className="text-gray-600 leading-relaxed">
                  Fotografías profesionales de partidos, torneos y eventos especiales
                </p>
              </div>

              <div className="group text-center p-8 bg-white rounded-2xl hover-lift border border-gray-100">
                <div className="bg-gradient-to-br from-devil-500 to-devil-700 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Galerías Organizadas</h3>
                <p className="text-gray-600 leading-relaxed">
                  Fotos organizadas por categoría, fecha y tipo de evento para fácil acceso
                </p>
              </div>

              <div className="group text-center p-8 bg-white rounded-2xl hover-lift border border-gray-100">
                <div className="bg-gradient-to-br from-devil-500 to-devil-700 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Compra Fácil y Rápida</h3>
                <p className="text-gray-600 leading-relaxed">
                  Selecciona tus favoritas, paga online y recibe las fotos en alta resolución
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="relative bg-gradient-to-br from-devil-600 via-devil-700 to-devil-900 py-20 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-gold rounded-full blur-3xl"></div>
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-white">
              ¿LISTO PARA VER TUS FOTOS?
            </h2>
            <p className="text-xl text-devil-100 mb-10 max-w-2xl mx-auto">
              Revive los mejores momentos de los partidos y torneos. Encuentra, selecciona y descarga tus favoritas.
            </p>
            <Link
              href="/galerias"
              className="inline-flex items-center gap-2 bg-white text-devil-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-accent-warm transition-all duration-300 shadow-premium hover:shadow-premium-lg hover:scale-105"
            >
              <span>Explorar Galerías</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
