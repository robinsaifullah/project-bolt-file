import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      fastRefresh: true
    }),
    tsconfigPaths(),
    compression({
      algorithm: 'brotli',
      ext: '.br'
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Trading Platform',
        short_name: 'Trading',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    modulePreload: {
      polyfill: false
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', '@tanstack/react-query'],
          utils: ['ethers', 'web3', 'decimal.js', 'date-fns'],
          trading: ['ccxt', 'axios', 'ws']
        }
      }
    },
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-error-boundary',
      'ethers',
      'web3',
      'decimal.js',
      '@tanstack/react-query'
    ],
    exclude: ['ccxt']
  },
  resolve: {
    alias: {
      '@': '/src',
      'socks-proxy-agent': 'axios',
      'http-proxy-agent': 'axios',
      'https-proxy-agent': 'axios',
      'agent-base': 'axios'
    }
  },
  server: {
    hmr: {
      overlay: false
    }
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['./src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html']
    }
  }
});