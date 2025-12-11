import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Diablos Rojos Premium Color System
        devil: {
          900: '#7f1d1d',  // Rojo oscuro profundo
          800: '#991b1b',  // Rojo oscuro
          700: '#b91c1c',  // Rojo medio oscuro
          600: '#dc2626',  // Rojo principal
          500: '#ef4444',  // Rojo vibrante
          400: '#f87171',  // Rojo claro
          100: '#fee2e2',  // Rojo suave
          50: '#fef2f2',   // Rojo muy suave
        },
        accent: {
          gold: '#fbbf24',     // Dorado para destacados
          dark: '#0a0a0a',     // Negro premium
          warm: '#fafafa',     // Blanco cálido
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
        'card': '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
        'hover': '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
