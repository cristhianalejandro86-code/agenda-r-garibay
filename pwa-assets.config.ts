import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Genera los íconos PWA a partir de public/icon-source.png.
// El maskable y el apple usan fondo azul de marca para cubrir borde a borde.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: {
      sizes: [512],
      padding: 0.2,
      resizeOptions: { background: '#003DA5' },
    },
    apple: {
      sizes: [180],
      padding: 0.06,
      resizeOptions: { background: '#003DA5' },
    },
  },
  images: ['public/icon-source.png'],
})
