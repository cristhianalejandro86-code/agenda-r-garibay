/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Chrome de marca: Alianza Lima (camiseta: azul marino + franjas blancas + celeste) ──
        alianza: {
          blue: '#003DA5', // azul principal (header, botones primarios, branding)
          'blue-dark': '#002A6E', // hover / degradados
          'blue-deep': '#001E4D', // fondo oscuro
          navy: '#03143A', // base profunda tipo camiseta (login)
          celeste: '#5BA4E6', // acento claro
          'celeste-bright': '#7FC0FF', // brillo/destello
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
          progreso: '#7C3AED', // morado
          completado: '#16A34A', // verde
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        // Tipografía display tipo "dorsal" para títulos y cifras grandes
        display: ['"Barlow Condensed"', '"Inter"', 'system-ui', 'sans-serif'],
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
        // Sistema de sombras de profundidad (más marcado que el original)
        n1: '0 1px 2px rgba(0, 30, 77, 0.06)',
        n2: '0 4px 14px rgba(0, 30, 77, 0.08)',
        n3: '0 10px 30px rgba(0, 30, 77, 0.12)',
        n4: '0 18px 46px rgba(0, 30, 77, 0.18)',
        ring: '0 0 0 3px rgba(91, 164, 230, 0.45)',
        glow: '0 12px 30px rgba(10, 71, 168, 0.5)',
      },
      backgroundImage: {
        'gradient-alianza': 'linear-gradient(135deg, #003DA5 0%, #002A6E 58%, #001E4D 100%)',
        'gradient-celeste': 'linear-gradient(135deg, #5BA4E6 0%, #003DA5 100%)',
        'gradient-login': 'linear-gradient(150deg, #0A2E73 0%, #062253 45%, #03143A 100%)',
        // Franjas verticales tipo camiseta (overlay sutil sobre el chrome navy)
        'rayas-alianza': 'repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 3px, transparent 3px 28px)',
        'rayas-login': 'repeating-linear-gradient(90deg, rgba(255,255,255,.045) 0 4px, transparent 4px 34px)',
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
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        // Destello celeste que recorre la línea inferior del header
        sheen: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        // Deriva suave de los glows del login
        float: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(14px, 18px)' },
        },
      },
      animation: {
        'pulse-sync': 'pulse-sync 1.6s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in': 'slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        sheen: 'sheen 4.5s linear infinite',
        float: 'float 14s ease-in-out infinite',
        'float-slow': 'float 18s ease-in-out infinite reverse',
      },
    },
  },
  plugins: [],
}
