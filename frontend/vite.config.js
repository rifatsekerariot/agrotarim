import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
            manifest: {
                name: 'AgroMeta - Akıllı Tarım',
                short_name: 'AgroMeta',
                description: 'Tarımsal Hava Tahmini, IoT ve Yapay Zeka Platformu',
                theme_color: '#10b981',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                // Cache API responses for offline use
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/servis\.mgm\.gov\.tr\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'mgm-api-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 // 1 hour
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /\/api\/telemetry\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'telemetry-cache',
                            expiration: {
                                maxEntries: 20,
                                maxAgeSeconds: 60 * 5 // 5 minutes
                            },
                            networkTimeoutSeconds: 10
                        }
                    },
                    {
                        urlPattern: /\/api\/expert\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'expert-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 10 // 10 minutes
                            },
                            networkTimeoutSeconds: 10
                        }
                    }
                ]
            }
        })
    ],
    server: {
        host: true,
        allowedHosts: ['www.adanateknotarim.org', 'adanateknotarim.org'],
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    }
})
