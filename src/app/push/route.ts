import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Caminho absoluto para o arquivo do Service Worker
  const filePath = path.join(process.cwd(), 'src', 'app', 'gym-ignite-push.js');

  try {
    // Uso de promessa para não bloquear a thread principal do Node.js
    const fileContent = await readFile(filePath, 'utf8');

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        // Headers rigorosos para Service Worker: nunca cachear o arquivo de registro
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Service-Worker-Allowed': '/',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Arquivo não encontrado';
    console.error("[Service Worker Serve Error]:", message);

    return new NextResponse(`/* Service Worker Error: ${message} */`, {
      status: 404,
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
}