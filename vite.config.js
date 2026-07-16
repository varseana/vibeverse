import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// DevSpaces proxies the app through a public hostname, so we allow it and
// disable HMR host checks. Adjust allowedHosts if your DEVSPACE_ID changes.
export default defineConfig({
  // Relative asset paths so the build works from any GitHub Pages path
  // (root domain or /repo-name/ subpath) without breaking.
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: true,
    hmr: { clientPort: 443 },
  },
})
