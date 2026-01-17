"use client";

import React from 'react';
import { CheckCircle2, Circle, Flame } from 'lucide-react';

interface Props {
  treinos: { data: string }[];
  metaSemanal: number;
}

export default function WeeklyProgress({ treinos, metaSemanal }: Props) {
  // 1. Calcular o início (segunda) e fim (domingo) da semana atual
  const hoje = new Date();
  const diaDaSemana = hoje.getDay(); // 0 (dom) a 6 (sab)
  const diffParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;

  const segundaFeira = new Date(hoje);
  segundaFeira.setDate(hoje.getDate() + diffParaSegunda);
  segundaFeira.setHours(0, 0, 0, 0);

  // 2. Filtrar treinos que aconteceram nesta semana
  const treinosDaSemana = treinos.filter(t => {
    const dataTreino = new Date(t.data + "T00:00:00");
    return dataTreino >= segundaFeira && dataTreino <= hoje;
  });

  const concluidos = treinosDaSemana.length;
  const porcentagem = Math.min(100, (concluidos / metaSemanal) * 100);

  return (
    <section className="bg-slate-900/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-xl shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              Esforço Semanal
            </span>
          </div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
            {concluidos} de {metaSemanal} <span className="text-orange-500">Treinos</span>
          </h2>
        </div>

        <div className="flex -space-x-2">
          {/* Visualização de Check-ins Rápidos */}
          {Array.from({ length: metaSemanal }).map((_, i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-full border-4 border-[#020617] flex items-center justify-center transition-all ${i < concluidos
                ? 'bg-orange-500 text-white scale-110 z-10'
                : 'bg-slate-800 text-slate-600'
                }`}
            >
              {i < concluidos ? <CheckCircle2 size={16} /> : <Circle size={14} />}
            </div>
          ))}
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="space-y-3">
        <div className="h-4 w-full bg-slate-800/50 rounded-full overflow-hidden p-1 border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(249,115,22,0.4)]"
            style={{ width: `${porcentagem}%` }}
          />
        </div>

        <div className="flex justify-between items-center px-1">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            {porcentagem === 100 ? "META ATINGIDA! 🔥" : "Mantenha a chama acesa"}
          </p>
          <p className="text-[9px] font-black text-white uppercase tracking-widest">
            {Math.round(porcentagem)}%
          </p>
        </div>
      </div>
    </section>
  );
}