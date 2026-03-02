import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Configurações de Viewport para PWA (Cor da barra de status e zoom)
export const viewport: Viewport = {
  themeColor: '#020617', // Slate 950 para fundir com o fundo do seu app
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Evita zoom acidental ao clicar em inputs no mobile
};

export const metadata: Metadata = {
  manifest: '/manifest.json',
  title: {
    default: "Gym Ignite",
    template: "%s | Gym Ignite"
  },
  description: "Evolua sua chama. Treine com constância.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gym Ignite",
  },
  icons: {
    apple: "/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#020617] text-slate-50`}
      >
        {children}
      </body>
    </html>
  );
}