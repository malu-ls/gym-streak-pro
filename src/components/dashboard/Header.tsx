"use client";

import { Flame, Bell, BellOff, BellRing, User, LogOut, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  treinosCount: number;
  metaSemanal: number;
  userName: string;
}

export default function Header({
  treinosCount,
  userName,
}: HeaderProps) {
  const [isSaindo, setIsSaindo] = useState(false);
  const [isInscrito, setIsInscrito] = useState<boolean | null>(null);
  const [isCarregandoPush, setIsCarregandoPush] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Verifica o estado atual da inscrição ao carregar
  useEffect(() => {
    async function checkSubscription() {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsInscrito(!!subscription);
      }
    }
    checkSubscription();
  }, []);

  const handlePushSubscription = async () => {
    if (isCarregandoPush) return;
    setIsCarregandoPush(true);

    try {
      // 1. Solicita permissão
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        alert('Você precisa permitir as notificações para ativar os lembretes de treino.');
        setIsInscrito(false);
        return;
      }

      // 2. Registra o Service Worker e obtém a inscrição
      const registration = await navigator.serviceWorker.ready;

      // Converte a chave VAPID pública de base64 para Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
      };

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      });

      // 3. Envia para a API que criamos
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      if (res.ok) {
        setIsInscrito(true);
        alert('A chama agora te avisa! Notificações ativadas. 🔥');
      }
    } catch (error) {
      console.error('Erro ao inscrever para push:', error);
      alert('Erro ao ativar notificações. Verifique se o app está instalado.');
    } finally {
      setIsCarregandoPush(false);
    }
  };

  const handleLogout = async () => {
    if (isSaindo) return;
    setIsSaindo(true);
    try {
      await supabase.auth.signOut();
      router.refresh();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
      setIsSaindo(false);
    }
  };

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden text-white">
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-orange-500/10 rounded-lg">
            <User className="w-3 h-3 text-orange-500" />
          </div>
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
            Bem-vindo, {userName}
          </span>
        </div>

        <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
          GYM <span className="text-orange-500">IGNITE</span>
        </h1>
        <p className="text-slate-500 text-[10px] font-bold mt-2 uppercase tracking-[0.4em] opacity-80">
          A chama nunca apaga
        </p>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
        {/* BOTÃO DE NOTIFICAÇÃO DINÂMICO */}
        <button
          onClick={handlePushSubscription}
          disabled={isCarregandoPush}
          className={`p-4 rounded-3xl border transition-all active:scale-90 group flex items-center gap-2 ${isInscrito
            ? 'bg-orange-500/10 border-orange-500/20'
            : 'bg-slate-800/50 border-white/5 hover:bg-slate-800'
            }`}
          title={isInscrito ? "Lembretes Ativados" : "Ativar Lembretes"}
        >
          {isCarregandoPush ? (
            <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
          ) : isInscrito ? (
            <BellRing className="w-5 h-5 text-orange-500 animate-pulse" />
          ) : isInscrito === false ? (
            <BellOff className="w-5 h-5 text-slate-500" />
          ) : (
            <Bell className="w-5 h-5 text-slate-400 group-hover:text-orange-500" />
          )}
        </button>

        <button
          onClick={handleLogout}
          disabled={isSaindo}
          className="p-4 bg-slate-800/50 hover:bg-red-500/10 rounded-3xl border border-white/5 hover:border-red-500/20 transition-all active:scale-90 group"
        >
          {isSaindo ? (
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          ) : (
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
          )}
        </button>

        <div className="flex-1 md:flex-none flex items-center gap-4 bg-orange-500/10 px-6 py-4 rounded-3xl border border-orange-500/20 group hover:bg-orange-500/20 transition-all">
          <div className="relative">
            <Flame className="w-8 h-8 text-orange-500 fill-orange-500" />
            <div className="absolute inset-0 bg-orange-500 blur-lg opacity-20" />
          </div>

          <div className="flex flex-col">
            <span className="text-2xl font-black leading-none">
              {treinosCount}
            </span>
            <span className="text-[9px] font-black text-orange-500/80 uppercase tracking-widest mt-1">
              Check-ins
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}