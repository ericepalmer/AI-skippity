import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Game only — landing page is static HTML at the site root.
export default defineConfig({
  plugins: [react()],
  base: '/skippity/',
  build: {
    outDir: resolve(__dirname, 'dist/skippity'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'skippity/index.html'),
    },
  },
  server: {
    open: '/',
  },
})
