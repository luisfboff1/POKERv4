import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://poker.luisfboff.com',
        changeOrigin: true,
        secure: false
      }
    },
    // Força o recarregamento completo em desenvolvimento
    hmr: {
      overlay: false
    }
  },
  // Limpa o cache em desenvolvimento
  cacheDir: '.vite',
  clearScreen: false,
  build: {
    // Garante que os arquivos não sejam cacheados
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});