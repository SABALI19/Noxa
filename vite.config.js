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
          // Only process node_modules
          if (id.includes('node_modules')) {
            
            // React Core (be very specific to avoid conflicts)
            if (id.includes('node_modules/react/') || 
                id.includes('node_modules/react-dom/') || 
                id.includes('node_modules/scheduler/')) {
              return 'react-vendor'
            }
            
            // React Router
            if (id.includes('node_modules/react-router-dom/') || 
                id.includes('node_modules/react-router/') ||
                id.includes('node_modules/@remix-run/')) {
              return 'router-vendor'
            }
            
            // Redux State Management
            if (id.includes('node_modules/@reduxjs/') || 
                id.includes('node_modules/react-redux/') || 
                id.includes('node_modules/redux/') ||
                id.includes('node_modules/reselect/') ||
                id.includes('node_modules/immer/')) {
              return 'state-vendor'
            }
            
            // Charts Library
            if (id.includes('node_modules/recharts/') || 
                id.includes('node_modules/d3-') ||
                id.includes('node_modules/victory-') ||
                id.includes('node_modules/decimal.js')) {
              return 'charts-vendor'
            }
            
            // Icons (separate from everything else)
            if (id.includes('node_modules/lucide-react/') || 
                id.includes('node_modules/react-icons/')) {
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
  
  // Optimize dependencies - CRITICAL for lucide-react
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
      'lucide-react',
      'react-icons',
    ],
    exclude: [],
  },
})