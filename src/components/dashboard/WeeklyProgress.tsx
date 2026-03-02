"use client";

import React, { useMemo } from 'react';
import { CheckCircle2, Circle, Flame } from 'lucide-react';

interface Props {
  treinos: { data: string }[];
  metaSemanal: number;
}

export default function WeeklyProgress({ treinos, metaSemanal }: Props) {
  // Memoizamos o cálculo da semana para evitar processamento desnecessário
  const statsSemanal = useMemo(() => {
    const hoje = new Date();
    const diaDaSemana = hoje.getDay(); // 0 (domingo) a 6 (sábado)

    // Início da semana (Domingo 00:00:00)
    const domingo = new Date(hoje);
    domingo.setDate(hoje.getDate() - diaDaSemana);
    domingo.setHours(0, 0, 0, 0);

    // Fim da semana (Sábado 23:59:59)
    const sabado = new Date(domingo);
    sabado.setDate(domingo.getDate() + 6);
    sabado.setHours(23, 59, 59, 999);

    // Filtra treinos dentro desta janela específica
    const treinosDaSemana = treinos.filter(t => {
      const dataTreino = new Date(t.data + "T00:00:00");
      return dataTreino >= domingo && dataTreino <= sabado;
    });

    const concluidos = treinosDaSemana.length;
    const porcentagem = Math.min(100, (concluidos / metaSemanal) * 100);

    return { concluidos, porcentagem };
  }, [treinos, metaSemanal]);

  return (
    <section className="bg-slate-900/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Detalhe de luz ambiente */}
      <div className="absolute -left-10 -top-10 w-32 h-32 bg-orange-500/5 blur-[60px] pointer-events-none" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none">
              Esforço Semanal
            </span>
          </div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
            {statsSemanal.concluidos} de {metaSemanal} <span className="text-orange-500">Check-ins</span>
          </h2>
        </div>

        {/* Círculos de Status - Ajustados para Responsividade */}
        <div className="flex flex-wrap gap-2 md:gap-0 md:-space-x-2">
          {Array.from({ length: metaSemanal }).map((_, i) => (
            <div
              key={i}
              className={`w-9 h-9 md:w-10 md:h-10 rounded-full border-4 border-[#020617] flex items-center justify-center transition-all duration-500 ${i < statsSemanal.concluidos
                ? 'bg-orange-500 text-white scale-110 z-10 shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                : 'bg-slate-800 text-slate-600'
                }`}
            >
              {i < statsSemanal.concluidos ? (
                <CheckCircle2 size={16} strokeWidth={3} className="animate-in zoom-in" />
              ) : (
                <Circle size={14} strokeWidth={3} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="h-3.5 w-full bg-slate-950/50 rounded-full overflow-hidden p-1 border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(249,115,22,0.3)]"
            style={{ width: `${statsSemanal.porcentagem}%` }}
          />
        </div>

        <div className="flex justify-between items-center px-1">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            {statsSemanal.porcentagem === 100
              ? "META DA SEMANA BATIDA! 🔥"
              : "Ritmo Atual • Ciclo Dom-Sáb"}
          </p>
          <p className="text-[9px] font-black text-white uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
            {Math.round(statsSemanal.porcentagem)}%
          </p>
        </div>
      </div>
    </section>
  );
}