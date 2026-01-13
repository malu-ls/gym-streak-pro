import type { NextConfig } from 'next';
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Desativa o PWA em desenvolvimento para não travar o cache do navegador
  disable: process.env.NODE_ENV === 'development',
  // Garante que o service worker seja atualizado imediatamente
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  // Configurações para suportar o Turbopack e evitar erros de compilação
  reactStrictMode: true,
  compiler: {
    // Remove console.log em produção para performance e privacidade
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Se você tiver problemas com o Turbopack e PWA,
  // pode forçar o webpack aqui ou simplesmente rodar com a flag --webpack
};

export default withPWA(nextConfig);