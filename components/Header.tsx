import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-2xl md:text-3xl font-display font-bold text-gradient-red hover:scale-105 transition-transform duration-200 inline-block"
            >
              DIABLOS ROJOS FOTO
            </Link>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-6">
            <Link
              href="/galerias"
              className="relative text-gray-700 hover:text-devil-600 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 group"
            >
              <span className="relative z-10">Galerías</span>
              <span className="absolute inset-0 bg-devil-50 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-200"></span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
