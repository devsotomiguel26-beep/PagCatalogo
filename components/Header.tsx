import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-red-600">
              Diablos Rojos Foto
            </Link>
          </div>
          <div className="flex space-x-8">
            <Link
              href="/galerias"
              className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Galerías
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
