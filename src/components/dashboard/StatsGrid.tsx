"use client";

import { TrendingUp, CalendarCheck, Zap, AlertCircle } from 'lucide-react';

interface Props {
  consistencia: number;
  dataEst: string;
  diasAtrasado: number;
}

export default function StatsGrid({ consistencia, dataEst, diasAtrasado }: Props) {
  // Se a previsão cair em 2027, significa que o ritmo atual não fecha a meta em 2026
  const isAtrasadoMetaAnual = dataEst.includes('/27') || dataEst.includes('/28');
  const isConcluido = dataEst.includes('MISSÃO');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* 1. Consistência - Agora focado no histórico real do usuário */}
      <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fidelidade à Meta</p>
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-white italic tracking-tighter">
              {consistencia}
            </span>
            <span className="text-lg font-black text-orange-500 italic">%</span>
          </div>

          <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden border border-white/5 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(249,115,22,0.3)]"
              style={{ width: `${consistencia}%` }}
            />
          </div>
          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">Cálculo baseado desde o seu cadastro</p>
        </div>
      </div>

      {/* 2. Previsão de Conclusão - Otimizado para Meta Dinâmica */}
      <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-[32px] border border-white/5 shadow-2xl flex flex-col justify-between group">
        <div className="flex items-center gap-2 mb-4">
          <CalendarCheck className={`w-3.5 h-3.5 ${isAtrasadoMetaAnual ? 'text-red-400' : 'text-orange-500'}`} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Previsão 2026</p>
        </div>

        <div className="space-y-1">
          <p className={`text-2xl font-black italic tracking-tighter uppercase leading-none ${isAtrasadoMetaAnual ? 'text-red-400' : isConcluido ? 'text-emerald-400' : 'text-white'
            }`}>
            {dataEst}
          </p>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isAtrasadoMetaAnual ? 'bg-red-500' : 'bg-orange-500'}`} />
            <p className="text-[9px] font-bold text-slate-500 uppercase">
              {isAtrasadoMetaAnual ? 'Ritmo abaixo da meta' : 'Projeção de encerramento'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Status de Ritmo - Integrado com a Meta Semanal */}
      <div className={`p-6 rounded-[32px] border transition-all duration-500 flex flex-col justify-between shadow-2xl ${diasAtrasado > 0
        ? 'bg-red-500/5 border-red-500/10'
        : 'bg-emerald-500/5 border-emerald-500/10'
        }`}>
        <div className="flex items-center gap-2 mb-4">
          <Zap className={`w-3.5 h-3.5 ${diasAtrasado > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status de Ritmo</p>
        </div>

        <div className="space-y-1">
          <p className={`text-xl font-black italic uppercase tracking-tighter leading-none ${diasAtrasado > 0 ? 'text-red-400' : 'text-emerald-400'
            }`}>
            {diasAtrasado > 0 ? `${diasAtrasado} dias pendentes` : 'Ritmo Blindado!'}
          </p>
          <p className="text-[9px] font-bold text-slate-600 uppercase">
            {diasAtrasado > 0 ? 'Aumente a frequência' : 'Meta semanal em dia'}
          </p>
        </div>
      </div>

    </div>
  );
}