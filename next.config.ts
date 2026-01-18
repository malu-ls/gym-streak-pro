// next.config.ts
import type { NextConfig } from 'next';

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: false,        // Impede o registro automático do sw.js padrão
  skipWaiting: false,     // Deixamos false para não atropelar seu registro manual
  sw: 'gym-ignite-push.js', // Nome customizado para fugir do padrão do plugin
  // Esta linha abaixo é o segredo: impede o plugin de processar seu arquivo
  publicExhaustive: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Desativamos o Turbopack se necessário, mas mantemos o Webpack padrão
  webpack: (config) => {
    return config;
  },
};

export default withPWA(nextConfig as any);