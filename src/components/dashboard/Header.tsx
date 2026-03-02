"use client";

import { Bell, BellRing, User, LogOut, Loader2, Flame } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  treinosCount: number;
  userName: string;
}

// Helper para converter a chave VAPID pública
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function Header({ treinosCount, userName }: HeaderProps) {
  const [isSaindo, setIsSaindo] = useState(false);
  const [isInscrito, setIsInscrito] = useState<boolean | null>(null);
  const [isCarregandoPush, setIsCarregandoPush] = useState(false);
  const router = useRouter();

  // Memoização do cliente para estabilidade
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const checkSubscription = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        setIsInscrito(!!subscription);
      }
    } catch (error: unknown) {
      console.error("[Header] Erro ao checar inscrição:", error);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const handlePushSubscription = async () => {
    if (isCarregandoPush) return;
    setIsCarregandoPush(true);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Autorize as notificações para receber os lembretes da chama.');
        return;
      }

      // Rota dinâmica que serve o Service Worker (src/app/push/route.ts)
      const swUrl = '/push';

      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/',
      });

      await registration.update();
      const activeReg = await navigator.serviceWorker.ready;

      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) throw new Error("VAPID key missing");

      const subscription = await activeReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      if (res.ok) {
        setIsInscrito(true);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao ativar notificações";
      console.error('[Push Error]:', message);
      alert('Falha ao ativar. Tente limpar o cache do navegador.');
    } finally {
      setIsCarregandoPush(false);
    }
  };

  const handleLogout = async () => {
    if (isSaindo) return;
    setIsSaindo(true);
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden text-white">
      {/* Glow Effect no Background */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <User className="w-3 h-3 text-orange-500" />
          </div>
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] leading-none">
            Operador: {userName}
          </span>
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
          GYM <span className="text-orange-500">IGNITE</span>
        </h1>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
        {/* Notificações Push */}
        <button
          onClick={handlePushSubscription}
          disabled={isCarregandoPush}
          className={`p-4 rounded-3xl border transition-all active:scale-95 flex items-center gap-2 ${isInscrito ? 'bg-orange-500/10 border-orange-500/20 shadow-inner' : 'bg-slate-800/50 border-white/5'
            }`}
          title={isInscrito ? "Notificações Ativas" : "Ativar Notificações"}
        >
          {isCarregandoPush ? (
            <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
          ) : isInscrito ? (
            <BellRing className="w-5 h-5 text-orange-500 animate-pulse" />
          ) : (
            <Bell className="w-5 h-5 text-slate-500" />
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isSaindo}
          className="p-4 bg-slate-800/50 hover:bg-red-500/10 hover:border-red-500/20 rounded-3xl border border-white/5 transition-all active:scale-95 group"
        >
          {isSaindo ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-500" />
          )}
        </button>

        {/* Contador de Treinos (Check-ins) */}
        <div className="flex-1 md:flex-none flex items-center gap-4 bg-orange-500/10 px-6 py-4 rounded-3xl border border-orange-500/20 group relative overflow-hidden">
          <div className="absolute inset-0 bg-orange-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <div className="relative">
            <Flame className="w-8 h-8 text-orange-500 fill-orange-500 animate-pulse" />
            <div className="absolute inset-0 blur-lg bg-orange-500 opacity-20" />
          </div>
          <div className="flex flex-col relative">
            <span className="text-2xl font-black leading-none">{treinosCount}</span>
            <span className="text-[9px] font-black text-orange-500/80 uppercase tracking-tighter">Check-ins</span>
          </div>
        </div>
      </div>
    </header>
  );
}