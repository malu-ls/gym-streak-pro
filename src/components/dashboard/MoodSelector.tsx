"use client";

import React from 'react';

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
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 p-8 rounded-[40px] w-full max-w-sm shadow-2xl animate-in zoom-in duration-300">

        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h3 className="text-white font-black uppercase italic tracking-tighter text-2xl leading-none">
            Como foi o treino?
          </h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-3">
            Opcional: selecione seu humor
          </p>
        </div>

        {/* Grid de Emojis */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {moods.map((m) => (
            <button
              key={m.label}
              onClick={() => onSelect(m.emoji)}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-[24px]
                bg-gradient-to-br ${m.color} to-transparent
                border border-white/5 hover:border-white/20
                transition-all active:scale-95 group
              `}
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">
                {m.emoji}
              </span>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">
                {m.label}
              </span>
            </button>
          ))}
        </div>

        {/* Ações de Registro */}
        <div className="space-y-3">
          <button
            onClick={() => onSelect('🏆')}
            className="w-full py-4 rounded-[20px] bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-lg shadow-orange-500/5"
          >
            Apenas registrar treino
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-slate-600 text-[9px] font-black uppercase tracking-[0.3em] hover:text-slate-400 transition-colors"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}