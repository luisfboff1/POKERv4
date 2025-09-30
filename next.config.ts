import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ✅ Gera arquivos estáticos para Hostinger (SSG)
  output: 'export',
  
  // ✅ Trailing slash para compatibilidade com servidor Apache
  trailingSlash: true,
  
  // ✅ Desabilita otimização de imagens (servidor estático)
  images: {
    unoptimized: true,
  },
  
  // ✅ Diretório de saída
  distDir: 'dist',
  
  // ✅ Configurações adicionais
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;

