"use client";

import React, { useState, useRef } from 'react';
import { Calendar, ArrowRight, CalendarDays } from 'lucide-react';

interface Props {
  onSave: (data: { ultimo_ciclo: string; duracao_ciclo: number }) => void;
}

export default function FemaleOnboarding({ onSave }: Props) {
  const [data, setData] = useState({
    ultimo_ciclo: '',
    duracao_ciclo: 28
  });

  // Referência para o input de data
  const dateInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-slate-900/60 backdrop-blur-3xl p-8 rounded-[40px] border border-orange-500/30 shadow-2xl animate-in zoom-in duration-500">
      <div className="flex flex-col items-center text-center gap-4 mb-8">
        <div className="p-4 bg-orange-500/20 rounded-2xl">
          <Calendar className="text-orange-500 w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter leading-none">Sincronia Biológica</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Ajuste sua performance ao seu ciclo</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Campo de Data com gatilho para abrir o calendário */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Início do último ciclo</label>
          <div
            className="relative cursor-pointer group"
            onClick={() => dateInputRef.current?.showPicker()} // Abre o calendário ao clicar na div
          >
            <input
              ref={dateInputRef}
              type="date"
              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-orange-500 transition-all font-bold appearance-none"
              onChange={(e) => setData({ ...data, ultimo_ciclo: e.target.value })}
            />
            <CalendarDays className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none group-hover:scale-110 transition-transform" size={20} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Duração média do ciclo</label>
          <div className="grid grid-cols-4 gap-2">
            {[26, 28, 30, 32].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setData({ ...data, duracao_ciclo: d })}
                className={`py-3 rounded-xl font-black text-xs transition-all ${data.duracao_ciclo === d
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105'
                  : 'bg-slate-800 text-slate-500 hover:text-white'
                  }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onSave(data)}
          disabled={!data.ultimo_ciclo}
          className="w-full bg-white text-black font-black py-5 rounded-[24px] flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-20 shadow-xl mt-2"
        >
          ATIVAR PREDIÇÕES <ArrowRight size={18} />
        </button>

        <p className="text-[9px] text-slate-600 text-center font-bold uppercase leading-relaxed px-4">
          *Seus dados são privados e usados apenas para <br /> cálculos de performance no app.
        </p>
      </div>
    </div>
  );
}