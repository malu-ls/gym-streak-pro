"use client";

import { Flame, Bell, User, LogOut, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr'; // Corrigido aqui
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  treinosCount: number;
  metaSemanal: number;
  userName: string;
  onSolicitarNotificacao: () => Promise<void> | void;
}

export default function Header({
  treinosCount,
  metaSemanal,
  userName,
  onSolicitarNotificacao
}: HeaderProps) {
  const [isSaindo, setIsSaindo] = useState(false);
  const router = useRouter();

  // Inicializa o cliente do Supabase compatível com seu projeto
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
      {/* Detalhe de luz de fundo */}
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
        <button
          onClick={onSolicitarNotificacao}
          className="p-4 bg-slate-800/50 hover:bg-slate-800 rounded-3xl border border-white/5 transition-all active:scale-90 group"
        >
          <Bell className="w-5 h-5 text-slate-400 group-hover:text-orange-500 transition-colors" />
        </button>

        {/* Botão de Sair com lógica corrigida */}
        <button
          onClick={handleLogout}
          disabled={isSaindo}
          className="p-4 bg-slate-800/50 hover:bg-red-500/10 rounded-3xl border border-white/5 hover:border-red-500/20 transition-all active:scale-90 group"
        >
          {isSaindo ? (
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          ) : (
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
          )}
        </button>

        <div className="flex-1 md:flex-none flex items-center gap-4 bg-orange-500/10 px-6 py-4 rounded-3xl border border-orange-500/20 group hover:bg-orange-500/20 transition-all">
          <div className="relative">
            <Flame className="w-8 h-8 text-orange-500 fill-orange-500 animate-pulse" />
            <div className="absolute inset-0 bg-orange-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
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