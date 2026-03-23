import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import viteImagemin from 'vite-plugin-imagemin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Tự động nén ảnh khi chạy `npm run build`
    // Không ảnh hưởng đến `npm run dev`
    viteImagemin({
      // Nén JPG/JPEG dùng mozjpeg
      mozjpeg: {
        quality: 80,
      },
      // Nén PNG dùng pngquant
      pngquant: {
        quality: [0.7, 0.9],
        speed: 4,
      },
      // Tối ưu SVG
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeEmptyAttrs', active: false },
        ],
      },
      // Nén WebP
      webp: {
        quality: 80,
      },
      // Tối ưu GIF (nếu có)
      gifsicle: {
        optimizationLevel: 7,
      },
    }),
  ],
})

