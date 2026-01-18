import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  // Ajustamos o caminho para pegar o arquivo na raiz da pasta app
  const filePath = path.join(process.cwd(), 'src', 'app', 'gym-ignite-push.js');

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error("Erro ao servir o Service Worker:", error);
    return new NextResponse("Service Worker não encontrado", { status: 404 });
  }
}