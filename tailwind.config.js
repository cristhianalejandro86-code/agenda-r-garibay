/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Chrome de marca: Alianza Lima (azul + blanco + celeste) ──
        alianza: {
          blue: '#003DA5', // azul principal (header, botones primarios, branding)
          'blue-dark': '#002A6E', // hover / degradados
          'blue-deep': '#001E4D', // fondo oscuro
          celeste: '#5BA4E6', // acento claro
          'celeste-soft': '#E8F2FC', // fondos suaves de acento
          white: '#FFFFFF',
        },
        // ── Colores funcionales (NO se pintan de azul: lectura rápida) ──
        prioridad: {
          alta: '#DC2626', // rojo
          normal: '#F59E0B', // ámbar
          baja: '#16A34A', // verde
        },
        estado: {
          nuevo: '#5BA4E6', // celeste / info
          progreso: '#7C3AED', // morado / azul
          completado: '#16A34A', // verde
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        base: ['16px', '1.5'],
      },
      borderRadius: {
        input: '10px',
        btn: '12px',
        card: '16px',
        section: '20px',
      },
      boxShadow: {
        // Sistema de sombras de 4 niveles
        n1: '0 1px 2px rgba(0, 30, 77, 0.06)',
        n2: '0 2px 8px rgba(0, 30, 77, 0.08)',
        n3: '0 8px 24px rgba(0, 30, 77, 0.10)',
        n4: '0 16px 48px rgba(0, 30, 77, 0.16)',
        ring: '0 0 0 3px rgba(91, 164, 230, 0.45)',
      },
      backgroundImage: {
        'gradient-alianza':
          'linear-gradient(135deg, #003DA5 0%, #002A6E 60%, #001E4D 100%)',
        'gradient-celeste': 'linear-gradient(135deg, #5BA4E6 0%, #003DA5 100%)',
      },
      transitionTimingFunction: {
        suave: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'pulse-sync': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'pulse-sync': 'pulse-sync 1.6s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in': 'slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
