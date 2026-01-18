// next.config.ts
import type { NextConfig } from 'next';

const withPWA = require('next-pwa')({
  dest: 'public',
  register: false, // Nós vamos registrar manualmente
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  sw: 'notifications-sw.js', // Nome que acabamos de dar
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config: any) => {
    return config;
  },
};

export default withPWA(nextConfig as any);