import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  esbuild:
    mode === 'production'
      ? {
          drop: ['console', 'debugger'],
        }
      : undefined,
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    cssCodeSplit: true,
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          const normalizedId = id.replaceAll('\\', '/');

          if (normalizedId.includes('/react-router-dom/')) {
            return 'vendor-router';
          }

          if (normalizedId.includes('/lucide-react/')) {
            return 'vendor-lucide';
          }

          if (normalizedId.includes('/socket.io-client/')) {
            return 'vendor-socket';
          }

          if (
            normalizedId.includes('/react-dom/')
            || normalizedId.includes('/react/')
            || normalizedId.includes('/scheduler/')
          ) {
            return 'vendor-react';
          }

          return 'vendor';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}));
