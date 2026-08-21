import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icon.svg'],
    manifest: { name: 'LT Weather', short_name: 'LT Weather', description: '虫採り・昆虫観察のための夜間気象情報', theme_color: '#07111f', background_color: '#07111f', display: 'standalone', start_url: '/', orientation: 'portrait-primary', icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }] },
    workbox: { runtimeCaching: [{ urlPattern: /^https:\/\/api\.open-meteo\.com\//, handler: 'NetworkFirst', options: { cacheName: 'weather-api', networkTimeoutSeconds: 8, expiration: { maxEntries: 30, maxAgeSeconds: 3600 } } }] }
  })]
})
