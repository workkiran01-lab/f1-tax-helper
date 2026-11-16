import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
  plugins: [react()],
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
