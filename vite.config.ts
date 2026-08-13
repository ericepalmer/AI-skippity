import { existsSync, createReadStream } from 'node:fs'
import { extname, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const rootDir = resolve(__dirname)
const portalDir = resolve(rootDir, 'portal')
const publicDir = resolve(rootDir, 'public')

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}

/**
 * Landing lives in portal/ and is served at /.
 * Root index.html is the Skippity game (so base:/skippity/ maps to /skippity/).
 *
 * Middleware must register WITHOUT returning a post-hook — otherwise Vite strips
 * the /skippity base first and /skippity/ looks like /, serving the landing again.
 */
function servePortal(): Plugin {
  return {
    name: 'serve-portal',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || req.method !== 'GET') return next()

        const pathOnly = req.url.split('?')[0] ?? ''

        const sendFile = (filePath: string) => {
          if (!existsSync(filePath)) return false
          const type =
            MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
          res.statusCode = 200
          res.setHeader('Content-Type', type)
          createReadStream(filePath).pipe(res)
          return true
        }

        if (pathOnly === '/' || pathOnly === '/index.html') {
          if (sendFile(resolve(portalDir, 'index.html'))) return
        }
        if (pathOnly === '/landing.css') {
          if (sendFile(resolve(portalDir, 'landing.css'))) return
        }
        if (pathOnly.startsWith('/images/')) {
          if (sendFile(resolve(publicDir, pathOnly.slice(1)))) return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), servePortal()],
  appType: 'mpa',
  base: '/skippity/',
  publicDir: 'public',
  build: {
    outDir: resolve(rootDir, 'dist/skippity'),
    emptyOutDir: true,
  },
  server: {
    open: '/',
    port: 5173,
  },
})
