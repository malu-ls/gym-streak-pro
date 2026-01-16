"use client";

import React, { useState, useMemo } from 'react';
import { Info, Calculator } from 'lucide-react';

export default function BMICalculator() {
  const [altura, setAltura] = useState('');
  const [peso, setPeso] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  const imcResult = useMemo(() => {
    const alt = parseFloat(altura) / 100;
    const pes = parseFloat(peso);
    if (alt > 0 && pes > 0) {
      const imc = pes / (alt * alt);

      let categoria = "";
      let cor = "";
      if (imc < 18.5) { categoria = "Abaixo do peso"; cor = "text-blue-400"; }
      else if (imc < 25) { categoria = "Peso ideal"; cor = "text-green-400"; }
      else if (imc < 30) { categoria = "Sobrepeso"; cor = "text-yellow-400"; }
      else { categoria = "Obesidade"; cor = "text-red-400"; }

      // Peso ideal baseado no IMC 22 (meio do caminho do saudável)
      const pesoIdeal = (22 * (alt * alt)).toFixed(1);

      return { valor: imc.toFixed(1), categoria, cor, pesoIdeal };
    }
    return null;
  }, [altura, peso]);

  return (
    <section className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Calculator className="w-3 h-3" /> Calculadora de IMC
          </h3>
        </div>

        {/* Botão de Info com Alerta Responsável */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500 hover:text-orange-500"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {showInfo && (
        <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl animate-in fade-in zoom-in duration-300">
          <p className="text-[10px] leading-relaxed text-orange-200 font-medium">
            <span className="font-black uppercase block mb-1">Aviso Importante:</span>
            O IMC é um cálculo geral e não diferencia massa muscular de gordura.
            Não deve ser o único fator para definir sua saúde.
            <span className="text-white font-bold"> Consulte um(a) nutricionista</span> para um exame de bioimpedância completo e definição do seu peso ideal personalizado.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Altura (cm)</label>
          <input
            type="number"
            placeholder="Ex: 175"
            value={altura}
            onChange={(e) => setAltura(e.target.value)}
            className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 outline-none focus:border-orange-500 font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Peso (kg)</label>
          <input
            type="number"
            placeholder="Ex: 80"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 outline-none focus:border-orange-500 font-bold"
          />
        </div>
      </div>

      {imcResult && (
        <div className="mt-6 pt-6 border-t border-slate-800 flex justify-between items-end animate-in slide-in-from-top-2">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase">Seu IMC</p>
            <p className="text-4xl font-black text-white">{imcResult.valor}</p>
            <p className={`text-[10px] font-bold uppercase ${imcResult.cor}`}>{imcResult.categoria}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase italic">Peso Ref. (IMC 22)</p>
            <p className="text-xl font-black text-white">{imcResult.pesoIdeal} kg</p>
          </div>
        </div>
      )}
    </section>
  );
}