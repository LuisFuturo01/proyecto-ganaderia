import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    // Proxy all API calls to the FastAPI backend during development
    // This avoids CORS issues and allows the frontend to use relative URLs
    proxy: {
      '/predict': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/predict-360': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/predict-360-json': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ping': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/analyze': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})
