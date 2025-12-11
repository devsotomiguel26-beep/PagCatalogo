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
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 10px 40px -10px rgba(0, 0, 0, 0.25)',
        'premium-lg': '0 20px 60px -15px rgba(0, 0, 0, 0.3)',
        'glow-red': '0 0 20px rgba(220, 38, 38, 0.3)',
        'inner-subtle': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
