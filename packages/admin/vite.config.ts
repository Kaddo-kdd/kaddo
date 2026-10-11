import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Reuse the official brand assets that power the public site. This keeps the
  // Admin mark faithful to Kaddo instead of maintaining a duplicate icon.
  publicDir: '../../apps/docs/public',
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:4173',
    },
  },
})
