import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  
  // Build optimizations
  build: {
    // Increase warning limit
    chunkSizeWarningLimit: 1000,
    
    // Minify for production
    minify: 'terser',
    
    // Enable sourcemaps for debugging (optional)
    sourcemap: false, // Set to true for debugging
    
    // Optimize rollup bundling
    rollupOptions: {
      output: {
        // Manual chunking for better caching
        manualChunks(id) {
          // Group by package
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor'
            }
            if (id.includes('@reduxjs') || id.includes('react-redux')) {
              return 'state-vendor'
            }
            if (id.includes('recharts')) {
              return 'charts-vendor'
            }
            if (id.includes('react-icons') || id.includes('lucide-react')) {
              return 'icons-vendor'
            }
            // Group all other node_modules
            return 'vendor'
          }
        },
        
        // Better naming for chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    },
    
    // Report compressed sizes
    reportCompressedSize: true,
    
    // Target modern browsers
    target: 'es2020',
  },
  
  // Development server
  server: {
    port: 3000,
    host: true,
    open: true,
  },
  
  // Preview server
  preview: {
    port: 4173,
    host: true,
  },
  
  // CSS optimization
  css: {
    devSourcemap: false, // Disable sourcemaps in dev for faster builds
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
    ],
    exclude: [],
  },
})