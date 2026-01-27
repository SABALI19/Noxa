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
    sourcemap: false,
    
    // Optimize rollup bundling
    rollupOptions: {
      output: {
        // Manual chunking for better caching
        manualChunks(id) {
          // Group by package
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') && !id.includes('react-router') && !id.includes('react-redux') && !id.includes('react-icons')) {
              return 'react-vendor'
            }
            // React Router
            if (id.includes('react-router')) {
              return 'router-vendor'
            }
            // Redux
            if (id.includes('@reduxjs') || id.includes('react-redux') || id.includes('redux')) {
              return 'state-vendor'
            }
            // Charts
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts-vendor'
            }
            // Icons - Keep lucide-react and react-icons together
            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'icons-vendor'
            }
            // All other node_modules
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
    devSourcemap: false,
  },
  
  // Optimize dependencies - IMPORTANT: Include lucide-react
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
      'lucide-react',  // Add this
    ],
    exclude: [],
  },
})