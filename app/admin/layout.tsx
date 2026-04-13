'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          setLoading(false);
        } else {
          setUser(null);
          if (pathname !== '/admin/login') {
            router.push('/admin/login');
          }
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  async function checkUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      setUser(session.user);
      setLoading(false);
    } else {
      setUser(null);
      if (pathname !== '/admin/login') {
        router.push('/admin/login');
      }
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/admin/login');
  }

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Si estamos en login y no hay usuario, mostrar la página de login sin layout
  if (pathname === '/admin/login' && !user) {
    return <>{children}</>;
  }

  // Si no hay usuario y no estamos en login, no renderizar nada (se redirigirá)
  if (!user) {
    return null;
  }

  // Layout completo para usuarios autenticados
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center min-h-[4rem]">
            <div className="flex items-center flex-1 min-w-0">
              {/* Logo/Título */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/admin/dashboard" className="text-xl font-bold text-red-600">
                  Admin
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="hidden lg:ml-6 lg:flex lg:flex-wrap lg:gap-x-1 lg:gap-y-1">
                <Link
                  href="/admin/dashboard"
                  className={`inline-flex items-center px-2 py-1.5 text-xs font-medium whitespace-nowrap ${
                    pathname === '/admin/dashboard'
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-700 hover:text-red-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/galerias"
                  className={`inline-flex items-center px-2 py-1.5 text-xs font-medium whitespace-nowrap ${
                    pathname?.startsWith('/admin/galerias')
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-700 hover:text-red-600'
                  }`}
                >
                  Galerías
                </Link>
                <Link
                  href="/admin/solicitudes"
                  className={`inline-flex items-center px-2 py-1.5 text-xs font-medium whitespace-nowrap ${
                    pathname?.startsWith('/admin/solicitudes')
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-700 hover:text-red-600'
                  }`}
                >
                  Solicitudes
                </Link>
                <Link
                  href="/admin/fotografos"
                  className={`inline-flex items-center px-2 py-1.5 text-xs font-medium whitespace-nowrap ${
                    pathname?.startsWith('/admin/fotografos')
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-700 hover:text-red-600'
                  }`}
                >
                  Fotógrafos
                </Link>
                <Link
                  href="/admin/liquidaciones"
                  className={`inline-flex items-center px-2 py-1.5 text-xs font-medium whitespace-nowrap ${
                    pathname?.startsWith('/admin/liquidaciones')
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-700 hover:text-red-600'
                  }`}
                >
                  Liquidaciones
                </Link>
                <Link
                  href="/admin/reportes"
                  className={`inline-flex items-center px-2 py-1.5 text-xs font-medium whitespace-nowrap ${
                    pathname?.startsWith('/admin/reportes')
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-700 hover:text-red-600'
                  }`}
                >
                  Reportes
                </Link>
                <Link
                  href="/admin/promociones"
                  className={`inline-flex items-center px-2 py-1.5 text-xs font-medium whitespace-nowrap ${
                    pathname?.startsWith('/admin/promociones')
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-700 hover:text-red-600'
                  }`}
                >
                  Promociones
                </Link>
                <Link
                  href="/admin/configuracion"
                  className={`inline-flex items-center px-2 py-1.5 text-xs font-medium whitespace-nowrap ${
                    pathname?.startsWith('/admin/configuracion')
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-700 hover:text-red-600'
                  }`}
                >
                  Configuración
                </Link>
              </div>
            </div>

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-red-600 hover:bg-gray-100"
              aria-label="Abrir menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Right side actions */}
            <div className="hidden lg:flex items-center space-x-3 flex-shrink-0 ml-4">
              <Link
                href="/"
                target="_blank"
                className="text-sm text-gray-700 hover:text-red-600"
              >
                Ver sitio público
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu (visible en pantallas < lg) */}
        {menuOpen && <div className="lg:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/admin/dashboard"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/admin/dashboard'
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/galerias"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname?.startsWith('/admin/galerias')
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
              }`}
            >
              Galerías
            </Link>
            <Link
              href="/admin/solicitudes"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname?.startsWith('/admin/solicitudes')
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
              }`}
            >
              Solicitudes
            </Link>
            <Link
              href="/admin/fotografos"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname?.startsWith('/admin/fotografos')
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
              }`}
            >
              Fotógrafos
            </Link>
            <Link
              href="/admin/liquidaciones"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname?.startsWith('/admin/liquidaciones')
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
              }`}
            >
              Liquidaciones
            </Link>
            <Link
              href="/admin/reportes"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname?.startsWith('/admin/reportes')
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
              }`}
            >
              Reportes
            </Link>
            <Link
              href="/admin/promociones"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname?.startsWith('/admin/promociones')
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
              }`}
            >
              Promociones
            </Link>
            <Link
              href="/admin/configuracion"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname?.startsWith('/admin/configuracion')
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
              }`}
            >
              Configuración
            </Link>
            <div className="border-t border-gray-200 mt-2 pt-2">
              <Link
                href="/"
                target="_blank"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50"
              >
                Ver Sitio Público
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>}
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
