import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173, // Ensure we're using port 5173 as required by pythagora.ai
    host: true,
    proxy: {
      '/api': {
        target: process.env.API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        proxyTimeout: 30000, // Increased timeout for larger requests
        ws: false, // Disable WebSockets
      },
      '/logs': {
        target: 'http://localhost:4444',
        changeOrigin: true,
      }
    },
    allowedHosts: [
      'localhost',
      '.pythagora.ai'
    ],
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**', '**/public/**', '**/log/**']
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    chunkSizeWarningLimit: 1600, // Increase the size warning limit
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-toast', '@radix-ui/react-label', '@radix-ui/react-slot'],
        }
      }
    }
  },
})