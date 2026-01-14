import type { NextConfig } from 'next';

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Forçamos o fallback para Webpack para evitar o erro do Turbopack (image_8cc068)
  webpack: (config) => {
    return config;
  },
};

// Como o TypeScript está rigoroso, exportamos ignorando erros de tipo na configuração do plugin
export default withPWA(nextConfig as any);