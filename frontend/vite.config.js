import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' ? 'http://localhost:3001' : 'http://backend:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['daisyui', '@tailwindcss/typography'],
          'query-vendor': ['@tanstack/react-query'],
          'markdown-vendor': ['react-markdown', 'remark-gfm', 'rehype-highlight', 'rehype-raw'],
          // Feature chunks
          'pages': [
            './src/pages/Sessions',
            './src/pages/Characters',
            './src/pages/Locations',
            './src/pages/Search',
            './src/pages/Adventures',
            './src/pages/MagicItems',
            './src/pages/NPCs',
            './src/pages/Quests',
            './src/pages/DiceRoller',
            './src/pages/CombatTracker',
            './src/pages/Relationships',
            './src/pages/WikiImport',
            './src/pages/ParkingLot'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 600 // Increase limit slightly
  }
})