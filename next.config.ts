import type { NextConfig } from 'next';
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  // Isso silencia o erro do Turbopack na Vercel
  experimental: {
    turbo: {
      // Configurações vazias forçam o fallback para Webpack
    },
  },
};

export default withPWA(nextConfig);