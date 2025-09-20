import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://poker.luisfboff.com',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    // Gerar source maps para debug
    sourcemap: true,
    // Configurações de otimização
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    // Garantir que os assets são copiados
    assetsDir: 'assets',
    // Não minificar em desenvolvimento
    minify: process.env.NODE_ENV === 'production'
  },
  // Base URL para produção
  base: '/'
});