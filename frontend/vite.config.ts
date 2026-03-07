import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    host: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'ip-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'ip-cert.pem')),
    },
    proxy: {
      '/api': {
        target: 'https://localhost:3004',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'https://localhost:3004',
        changeOrigin: true,
        ws: true,
        secure: false,
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  }
})
