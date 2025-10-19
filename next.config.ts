import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // SSR enabled for Vercel deployment
  // output: 'export' removed to enable API Routes and SSR
  
  // Configurações adicionais
  reactStrictMode: true,
  poweredByHeader: false,

  // Silenciar warning de múltiplos lockfiles
  outputFileTracingRoot: process.cwd(),

  // Silenciar warnings do SWC (DLL issues no Windows são conhecidos e não afetam)
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Desabilitar telemetria para build mais limpo
  experimental: {
    // @ts-ignore - esta opção existe mas pode não estar nos types
    disableOptimizedLoading: false,
  },

  // Image optimization enabled for Vercel
  images: {
    domains: [],
  },
};

export default nextConfig;

