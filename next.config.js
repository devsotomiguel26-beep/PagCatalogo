/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    // Formatos optimizados (WebP/AVIF automáticamente)
    formats: ['image/avif', 'image/webp'],
    // Tamaños responsivos predefinidos
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Calidad óptima para fotografía (75-80 es el balance perfecto)
    minimumCacheTTL: 60,
  },
  eslint: {
    // Solo para deploy inicial - ignorar errores de ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Solo para deploy inicial - ignorar errores de TypeScript
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
