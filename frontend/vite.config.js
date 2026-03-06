import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: './ip-key.pem',
      cert: './ip-cert.pem'
    },
    port: 8080,
    host: '192.168.4.35',
    proxy: {
      '/api': {
        target: 'http://192.168.4.35:3004',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://192.168.4.35:3004',
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: {
      port: 8081, // Use different port for HMR to avoid certificate issues
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
