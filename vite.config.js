import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const configDir = dirname(fileURLToPath(import.meta.url));
  const env = loadEnv(mode, configDir, '');
  const backendProxyTarget = env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:4000';

  return ({
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

            // Avatar generation / visual assets
            if (id.includes('node_modules/@dicebear/')) {
              return 'avatars-vendor'
            }

            // Networking and fetch utilities
            if (id.includes('node_modules/axios/') ||
                id.includes('node_modules/node-fetch/')) {
              return 'network-vendor'
            }

            // Smaller UI utilities
            if (id.includes('node_modules/react-image-crop/') ||
                id.includes('node_modules/react-is/')) {
              return 'ui-utils-vendor'
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
    proxy: {
      '/api': {
        target: backendProxyTarget,
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: backendProxyTarget,
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
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
})
