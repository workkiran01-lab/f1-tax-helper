import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

// `vite preview` serves index.html for any unknown address. In production index.html is the
// pre-rendered landing page and vercel.json sends other routes to the empty app shell, so the
// preview server applies the same rewrites; otherwise local browser tests would start every
// app route from the landing page's HTML. A build without the rewrite's file (the signed-in
// test build is not pre-rendered) falls through to Vite's default.
function vercelRewrites() {
  return {
    name: 'vercel-rewrites-in-preview',
    configurePreviewServer(server) {
      const outDir = resolve(server.config.root, server.config.build.outDir)
      const rewrites = JSON.parse(readFileSync(resolve(server.config.root, 'vercel.json'), 'utf8')).rewrites.map(
        (r) => ({ source: new RegExp(`^${r.source}$`), destination: r.destination }),
      )
      const isFile = (path) => {
        try {
          return statSync(join(outDir, path)).isFile()
        } catch {
          return false
        }
      }
      server.middlewares.use((req, _res, next) => {
        const [path, query] = (req.url || '/').split('?')
        if (req.method !== 'GET' || isFile(path)) return next()
        const match = rewrites.find((r) => r.source.test(path))
        if (match && existsSync(join(outDir, match.destination)))
          req.url = match.destination + (query ? `?${query}` : '')
        next()
      })
    },
  }
}

// Vendor code changes rarely, so it gets its own long-cached files and downloads in
// parallel with the app code. pdf-lib stays out of this list on purpose: it is loaded
// only when someone generates a Form 8843.
const vendorGroups = [
  ['react-vendor', ['react', 'react-dom', 'react-router', 'react-router-dom', 'scheduler']],
  ['motion-vendor', ['framer-motion', 'motion-dom', 'motion-utils']],
  ['supabase-vendor', ['@supabase']],
  ['sentry-vendor', ['@sentry']],
]

export default defineConfig({
  plugins: [react(), vercelRewrites()],
  // The signed-in browser tests serve a build under the production hostname (see
  // playwright.config.js), so the preview server has to accept it.
  preview: { allowedHosts: ['www.f1taxhelper.com'] },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          for (const [name, packages] of vendorGroups)
            if (packages.some((p) => id.includes(`/node_modules/${p}/`) || id.includes(`/node_modules/${p}`)))
              return name
          return undefined
        },
      },
    },
  },
})
