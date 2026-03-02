"use client";

import React, { useState } from 'react';

const moods = [
  { emoji: '⚡', label: 'Focado', color: 'from-orange-500/20' },
  { emoji: '😊', label: 'Feliz', color: 'from-emerald-500/20' },
  { emoji: '😐', label: 'Sério', color: 'from-slate-500/20' },
  { emoji: '😡', label: 'Bravo', color: 'from-red-500/20' },
  { emoji: '😴', label: 'Cansado', color: 'from-blue-500/20' },
  { emoji: '💪', label: 'Monstro', color: 'from-yellow-500/20' },
];

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function MoodSelector({ onSelect, onClose }: Props) {
  const [isVisible, setIsVisible] = useState(true);

  // Função mestre para garantir o fechamento
  const handleAction = (emoji?: string) => {
    setIsVisible(false); // Some da árvore do DOM localmente primeiro
    setTimeout(() => {
      if (emoji) {
        onSelect(emoji);
      } else {
        onClose();
      }
    }, 10); // Delay mínimo para o React processar o sumiço
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-md animate-in fade-in duration-300"
      onClick={() => handleAction()}
    >
      <div
        className="bg-slate-900 border border-white/10 p-8 rounded-[48px] w-full max-w-[360px] shadow-[0_32px_64px_rgba(0,0,0,0.5)] animate-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-8">
          <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-6 opacity-50 md:hidden" />
          <h3 className="text-white font-black uppercase italic tracking-tighter text-2xl leading-none">
            Análise de <span className="text-orange-500">Performance</span>
          </h3>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
            Como você se sentiu hoje?
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {moods.map((m) => (
            <button
              key={m.label}
              type="button"
              onClick={() => handleAction(m.emoji)}
              className="flex flex-col items-center gap-2 p-5 rounded-[28px] bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 hover:border-orange-500/30 transition-all active:scale-90 group"
            >
              <span className="text-3xl group-hover:scale-125 transition-transform duration-300">
                {m.emoji}
              </span>
              <span className="text-[8px] font-black text-slate-500 group-hover:text-white uppercase tracking-tighter transition-colors">
                {m.label}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => handleAction('🏆')}
            className="w-full py-5 rounded-[24px] bg-orange-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 active:scale-95"
          >
            Apenas registrar treino
          </button>

          <button
            type="button"
            onClick={() => handleAction()}
            className="w-full py-2 text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}