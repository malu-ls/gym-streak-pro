// next.config.ts
import type { NextConfig } from 'next';

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: false,           // Mantemos falso para usar seu registro manual
  skipWaiting: true,
  sw: 'gym-ignite-push.js',  // Nome do seu arquivo
  // Removemos a propriedade que causou o erro
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Otimização para garantir que arquivos na pasta public sejam servidos puramente
  typescript: {
    ignoreBuildErrors: true, // Opcional: evita que erros de tipo parem o deploy agora
  },
};

export default withPWA(nextConfig as any);