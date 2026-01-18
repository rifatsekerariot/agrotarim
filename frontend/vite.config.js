import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg'],
            manifest: {
                name: 'Seram - Sera Otomasyon',
                short_name: 'Seram',
                description: 'Sera Otomasyon ve İzleme Platformu',
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
                        type: 'image/png'
                    }
                ]
            }
        })
    ],
    server: {
        host: true,
        allowedHosts: ['www.adanateknotarim.org', 'adanateknotarim.org', 'localhost'],
        proxy: {
            '/api': {
                target: 'http://localhost:3009', // ✅ FIX: Correct backend port
                changeOrigin: true,
                secure: false,
                ws: true
            }
        }
    }
})
