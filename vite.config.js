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
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/poker/api')
      }
    }
  },
  build: {
    // Limpar a pasta dist antes do build
    emptyOutDir: true,
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
    // Minificar em produção
    minify: process.env.NODE_ENV === 'production',
    // Garantir que o index.html é copiado
    copyPublicDir: true
  },
  // Base URL para produção
  base: '/poker/'
});