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
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo/Título */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/admin/dashboard" className="text-xl font-bold text-red-600">
                  Admin Panel
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                <Link
                  href="/admin/dashboard"
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                    pathname === '/admin/dashboard'
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-700 hover:text-red-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/galerias"
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                    pathname?.startsWith('/admin/galerias')
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-700 hover:text-red-600'
                  }`}
                >
                  Galerías
                </Link>
                <Link
                  href="/admin/solicitudes"
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                    pathname?.startsWith('/admin/solicitudes')
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-700 hover:text-red-600'
                  }`}
                >
                  Solicitudes
                </Link>
                <Link
                  href="/admin/configuracion"
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                    pathname?.startsWith('/admin/configuracion')
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-700 hover:text-red-600'
                  }`}
                >
                  Configuración
                </Link>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
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

        {/* Mobile menu */}
        <div className="sm:hidden border-t border-gray-200">
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
              href="/admin/configuracion"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname?.startsWith('/admin/configuracion')
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
              }`}
            >
              Configuración
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
