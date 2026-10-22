import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react'
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase'
          if (/node_modules\/(recharts|d3-|victory-vendor|recharts-scale)\//.test(id)) return 'charts'
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      theme_color: '#00c950',
      background_color: '#00c950',
      manifest: false,
      includeAssets: ['favicon.ico', 'favicon.svg', 'manifest.webmanifest', 'icons/*.png']
    })
  ]
})