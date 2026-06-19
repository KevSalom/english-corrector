import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://api.213.58.150.32.sslip.io/',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
