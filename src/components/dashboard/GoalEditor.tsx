"use client";

import React from 'react';
import { Trophy, Target, CalendarDays, Info } from 'lucide-react';

interface Props {
  metaSemanal: number;
  metaAnual: number;
  onUpdateMeta: (valor: number) => void;
  isEditing: boolean;
  setIsEditing: (valor: boolean) => void;
}

export default function GoalEditor({ metaSemanal, metaAnual, onUpdateMeta, isEditing, setIsEditing }: Props) {
  const dias = [1, 2, 3, 4, 5, 6, 7];

  return (
    <section className="bg-slate-900/40 rounded-[32px] border border-white/5 backdrop-blur-xl overflow-hidden transition-all duration-500 shadow-2xl">
      <button
        onClick={() => setIsEditing(!isEditing)}
        className="w-full p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/10 rounded-xl group-hover:scale-110 transition-transform">
            <Trophy className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-0.5">Seu Objetivo</span>
            <p className="text-sm font-black text-white uppercase italic tracking-tight">
              {metaSemanal}x por semana <span className="text-slate-600 ml-2">|</span> <span className="text-orange-500 ml-2">{metaAnual} treinos previstos</span>
            </p>
          </div>
        </div>

        <span className="text-[9px] font-black uppercase tracking-widest bg-slate-800 text-slate-400 px-4 py-2 rounded-full border border-white/5">
          {isEditing ? "Concluir" : "Editar"}
        </span>
      </button>

      {isEditing && (
        <div className="px-6 pb-8 space-y-6 animate-in slide-in-from-top-4 duration-500">
          <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent w-full" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-2">
                <Target className="w-3 h-3" /> Frequência Desejada
              </label>
              <span className="text-[9px] font-bold text-orange-500 uppercase">Ajuste conforme sua rotina</span>
            </div>

            {/* Seleção de dias com botões */}
            <div className="grid grid-cols-7 gap-2">
              {dias.map((dia) => (
                <button
                  key={dia}
                  onClick={() => onUpdateMeta(dia)}
                  className={`py-4 rounded-2xl font-black transition-all border ${metaSemanal === dia
                    ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20 scale-105'
                    : 'bg-slate-800/50 border-white/5 text-slate-500 hover:border-orange-500/30'
                    }`}
                >
                  {dia}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-2xl space-y-3">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] text-orange-200/70 font-bold leading-relaxed uppercase tracking-tight">
                  Sua meta anual foi recalculada dinamicamente.
                </p>
                <p className="text-[11px] text-white font-black italic uppercase">
                  Faltam {metaAnual} sessões para encerrar o seu 2026.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}