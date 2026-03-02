"use client";

import React, { useState, useMemo } from 'react';
import { Info, Calculator } from 'lucide-react';

export default function BMICalculator() {
  const [altura, setAltura] = useState('');
  const [peso, setPeso] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  // Memoização do cálculo para evitar re-renders desnecessários
  const imcResult = useMemo(() => {
    const alt = parseFloat(altura) / 100;
    const pes = parseFloat(peso);

    if (alt > 0 && pes > 0) {
      const imc = pes / (alt * alt);

      let categoria = "";
      let cor = "";

      if (imc < 18.5) {
        categoria = "Abaixo do peso";
        cor = "text-blue-400";
      } else if (imc < 25) {
        categoria = "Peso ideal";
        cor = "text-green-400";
      } else if (imc < 30) {
        categoria = "Sobrepeso";
        cor = "text-yellow-400";
      } else {
        categoria = "Obesidade";
        cor = "text-red-400";
      }

      // Cálculo do peso ideal baseado no IMC 22 (referência saudável)
      const pesoIdeal = (22 * (alt * alt)).toFixed(1);

      return { valor: imc.toFixed(1), categoria, cor, pesoIdeal };
    }
    return null;
  }, [altura, peso]);

  return (
    <section className="bg-slate-900/50 p-6 rounded-[32px] border border-white/5 relative overflow-hidden backdrop-blur-md">
      {/* Luz de fundo decorativa */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/5 blur-[50px] pointer-events-none" />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <Calculator className="w-3.5 h-3.5 text-orange-500" /> Calculadora de IMC
          </h3>
        </div>

        <button
          onClick={() => setShowInfo(!showInfo)}
          className={`p-2 rounded-xl transition-all ${showInfo ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-500 hover:text-orange-500'}`}
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {showInfo && (
        <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-[10px] leading-relaxed text-orange-200/80 font-medium">
            <span className="font-black uppercase block mb-1 text-orange-500">Nota Legal:</span>
            O IMC é uma métrica geral. Atletas e praticantes de musculação podem ter IMC elevado devido à massa magra.
            <span className="text-white font-bold"> Consulte um nutricionista</span> para uma avaliação de bioimpedância detalhada.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Altura (cm)</label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Ex: 175"
            value={altura}
            onChange={(e) => setAltura(e.target.value)}
            className="w-full bg-slate-800/40 p-4 rounded-2xl border border-white/5 outline-none focus:border-orange-500/50 font-bold text-white transition-all placeholder:text-slate-700"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Peso (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Ex: 80"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            className="w-full bg-slate-800/40 p-4 rounded-2xl border border-white/5 outline-none focus:border-orange-500/50 font-bold text-white transition-all placeholder:text-slate-700"
          />
        </div>
      </div>

      {imcResult && (
        <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-end animate-in slide-in-from-bottom-2 duration-500 relative z-10">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Seu IMC</p>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-black text-white tracking-tighter">{imcResult.valor}</p>
            </div>
            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${imcResult.cor}`}>
              {imcResult.categoria}
            </p>
          </div>

          <div className="text-right bg-white/5 p-4 rounded-2xl border border-white/5">
            <p className="text-[9px] font-black text-slate-500 uppercase italic tracking-tighter mb-1">Peso Sugerido</p>
            <p className="text-xl font-black text-white">{imcResult.pesoIdeal}<span className="text-[10px] ml-1 text-slate-500 font-bold">kg</span></p>
          </div>
        </div>
      )}
    </section>
  );
}