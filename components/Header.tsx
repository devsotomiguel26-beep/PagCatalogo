import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          {/* Logo - minimalista */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-lg font-medium text-gray-900 hover:text-devil-600 transition-colors duration-200 tracking-tight"
            >
              Diablos Rojos
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-8">
            <Link
              href="/galerias"
              className="text-sm font-medium text-gray-600 hover:text-devil-600 transition-colors duration-200"
            >
              Galerías
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
