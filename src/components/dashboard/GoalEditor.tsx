"use client";

import React from 'react';
import { Trophy, Target, Info } from 'lucide-react';

interface Props {
  metaSemanal: number;
  metaAnual: number;
  onUpdateMeta: (valor: number) => void;
  isEditing: boolean;
  setIsEditing: (valor: boolean) => void;
}

export default function GoalEditor({
  metaSemanal,
  metaAnual,
  onUpdateMeta,
  isEditing,
  setIsEditing
}: Props) {
  const dias = [1, 2, 3, 4, 5, 6, 7];

  return (
    <section className="bg-slate-900/40 rounded-[32px] border border-white/5 backdrop-blur-xl overflow-hidden transition-all duration-500 shadow-2xl">
      <button
        onClick={() => setIsEditing(!isEditing)}
        className="w-full p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <Trophy className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-1 leading-none">
              Configuração de Alvo
            </span>
            <p className="text-sm font-black text-white uppercase italic tracking-tight flex items-center gap-2">
              {metaSemanal}x Semanais
              <span className="text-slate-700 font-normal">|</span>
              <span className="text-orange-500">{metaAnual} treinos no ano</span>
            </p>
          </div>
        </div>

        <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border transition-all ${isEditing
          ? "bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20"
          : "bg-slate-800 text-slate-400 border-white/5 hover:text-white"
          }`}>
          {isEditing ? "Salvar" : "Editar"}
        </span>
      </button>

      {isEditing && (
        <div className="px-6 pb-8 space-y-6 animate-in slide-in-from-top-4 duration-500">
          <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent w-full" />

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-orange-500" /> Frequência Desejada
              </label>
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Dias por semana</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {dias.map((dia) => (
                <button
                  key={dia}
                  onClick={() => onUpdateMeta(dia)}
                  className={`py-4 rounded-2xl font-black text-sm transition-all border active:scale-90 ${metaSemanal === dia
                    ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/40 scale-105 z-10'
                    : 'bg-slate-800/50 border-white/5 text-slate-600 hover:border-orange-500/30 hover:text-slate-300'
                    }`}
                >
                  {dia}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-2xl">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] text-orange-200/70 font-bold leading-relaxed uppercase tracking-tight">
                  Baseado na sua data de cadastro e meta semanal:
                </p>
                <p className="text-[11px] text-white font-black italic uppercase">
                  A chama exige {metaAnual} vitórias até o fim de 2026.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}