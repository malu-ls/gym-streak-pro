"use client";

import { TrendingUp, CalendarCheck, Zap } from 'lucide-react';

interface Props {
  consistencia: number; // Porcentagem (0-100)
  dataEst: string;      // Ex: "15/12/26" ou "MISSÃO CUMPRIDA"
  diasAtrasado: number; // Quantos treinos faltam para bater a meta da semana atual
}

export default function StatsGrid({ consistencia, dataEst, diasAtrasado }: Props) {
  // Lógica de alerta: se a data prevista não for em 2026, o usuário está fora do ritmo anual
  const isAtrasadoMetaAnual = dataEst.includes('/27') || dataEst.includes('/28');
  const isConcluido = dataEst.includes('MISSÃO') || dataEst.includes('CONCLUÍDO');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">

      {/* 1. Fidelidade à Meta - Histórico Real */}
      <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-orange-500/5 blur-2xl rounded-full" />

        <div className="flex items-center gap-2 mb-4 relative z-10">
          <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Fidelidade à Meta</p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-black text-white italic tracking-tighter">
              {consistencia}
            </span>
            <span className="text-xl font-black text-orange-500 italic">%</span>
          </div>

          <div className="space-y-2">
            <div className="w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${consistencia}%` }}
              />
            </div>
            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest leading-none">
              Média desde o seu primeiro check-in
            </p>
          </div>
        </div>
      </div>

      {/* 2. Previsão 2026 - Otimizado para Meta Dinâmica */}
      <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-[32px] border border-white/5 shadow-2xl flex flex-col justify-between group relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <CalendarCheck className={`w-3.5 h-3.5 ${isAtrasadoMetaAnual ? 'text-rose-500' : 'text-orange-500'}`} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Previsão de Carga</p>
        </div>

        <div className="space-y-2 relative z-10">
          <p className={`text-2xl font-black italic tracking-tighter uppercase leading-none ${isAtrasadoMetaAnual ? 'text-rose-500' : isConcluido ? 'text-emerald-400' : 'text-white'
            }`}>
            {dataEst}
          </p>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isAtrasadoMetaAnual ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-orange-500 shadow-[0_0_8px_#f97316]'}`} />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
              {isAtrasadoMetaAnual ? 'Ritmo abaixo do objetivo anual' : 'Projeção de encerramento da meta'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Status de Ritmo - Feedback Semanal Imediato */}
      <div className={`p-6 rounded-[32px] border transition-all duration-500 flex flex-col justify-between shadow-2xl relative overflow-hidden ${diasAtrasado > 0 ? 'bg-rose-500/5 border-rose-500/10' : 'bg-emerald-500/5 border-emerald-500/10'
        }`}>
        <div className="flex items-center gap-2 mb-4">
          <Zap className={`w-3.5 h-3.5 ${diasAtrasado > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status de Ritmo</p>
        </div>

        <div className="space-y-2">
          <p className={`text-2xl font-black italic uppercase tracking-tighter leading-none ${diasAtrasado > 0 ? 'text-rose-500' : 'text-emerald-400'
            }`}>
            {diasAtrasado > 0 ? `${diasAtrasado} pendentes` : 'Frequência Blindada'}
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
            {diasAtrasado > 0 ? 'Recupere o volume esta semana' : 'Você está em dia com seu alvo semanal'}
          </p>
        </div>
      </div>

    </div>
  );
}