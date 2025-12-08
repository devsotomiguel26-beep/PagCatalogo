export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold text-red-500 mb-2">
              Diablos Rojos Foto
            </h3>
            <p className="text-gray-400 text-sm">
              Fotografía deportiva profesional para equipos de fútbol infantil.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">Enlaces</h4>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Inicio
                </a>
              </li>
              <li>
                <a href="/galerias" className="hover:text-white transition-colors">
                  Galerías
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">Redes Sociales</h4>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                Instagram
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
          <p>&copy; {currentYear} Diablos Rojos Fotografía. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
