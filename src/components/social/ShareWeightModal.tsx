"use client";

import React, { useRef, useState } from 'react';
import { Loader2, Share2, Trophy, Flame, X, Scale } from 'lucide-react';
import { toBlob } from 'html-to-image';

interface Props {
  pesoInicial: number;
  pesoAtual: number;
  perdaTotal: number;
  onClose: () => void;
}

export default function ShareWeightModal({ pesoInicial, pesoAtual, perdaTotal, onClose }: Props) {
  const artRef = useRef<HTMLDivElement>(null);
  const [isCompartilhando, setIsCompartilhando] = useState(false);

  const obterComparacao = (kg: number) => {
    const v = Math.abs(kg);
    if (v >= 20) return { texto: "um pneu de trator", emoji: "🚜" };
    if (v >= 15) return { texto: "um cão de porte médio", emoji: "🐕" };
    if (v >= 10) return { texto: "dois sacos de arroz", emoji: "🍚" };
    if (v >= 5) return { texto: "uma melancia grande", emoji: "🍉" };
    if (v >= 2) return { texto: "uma garrafa de 2L", emoji: "🥤" };
    return { texto: "um haltere leve", emoji: "🏋️‍♂️" };
  };

  const comp = obterComparacao(perdaTotal);
  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();

  const compartilharImagem = async () => {
    if (!artRef.current) return;
    setIsCompartilhando(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const blob = await toBlob(artRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: '#020617',
        width: 1080,
        height: 1920,
      });

      if (!blob) throw new Error("Falha ao gerar imagem");
      const arquivo = new File([blob], `ignite-evolution-${Date.now()}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], title: 'Minha Evolução', text: 'O trabalho devolve! 💪' });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `minha-evolucao-ignite.png`;
        link.href = url;
        link.click();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCompartilhando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020617]/98 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center p-6 text-white">

      {/* --- ARTE PARA EXPORTAÇÃO (OCULTA) --- */}
      <div className="absolute left-[-9999px] top-0">
        <div
          ref={artRef}
          className="bg-[#020617] w-[1080px] h-[1920px] flex flex-col p-[100px] relative overflow-hidden"
        >
          {/* Elementos visuais de fundo */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-500/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 text-center mb-20">
            <h1 className="text-[120px] font-black italic uppercase leading-none tracking-tighter">
              GYM <span className="text-orange-500">IGNITE</span>
            </h1>
            <p className="text-slate-500 text-3xl font-black uppercase tracking-[0.6em] mt-4">
              Evolution Report • {mesAtual}
            </p>
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-20 px-10">
              <div className="space-y-2">
                <p className="text-slate-500 text-2xl font-black uppercase tracking-widest">Início</p>
                <p className="text-6xl font-black italic">{pesoInicial.toFixed(1)}kg</p>
              </div>
              <div className="h-20 w-px bg-white/10" />
              <div className="space-y-2 text-right">
                <p className="text-slate-500 text-2xl font-black uppercase tracking-widest">Atual</p>
                <p className="text-6xl font-black italic">{pesoAtual.toFixed(1)}kg</p>
              </div>
            </div>

            {/* Container Total Eliminado com sinal de negativo */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-[100px] p-20 shadow-[0_50px_100px_rgba(249,115,22,0.2)] relative overflow-hidden text-center">
              <div className="absolute top-0 right-0 p-10 opacity-20">
                <Flame size={200} color="white" strokeWidth={3} />
              </div>
              <p className="text-orange-100 text-3xl font-black uppercase tracking-[0.3em] mb-4">Total Eliminado</p>
              <div className="flex items-center justify-center">
                <p className="text-[220px] font-black italic leading-none tracking-tighter">
                  -{perdaTotal.toFixed(1)}<span className="text-5xl ml-4">KG</span>
                </p>
              </div>
            </div>

            <div className="mt-20 bg-slate-900/50 border border-white/5 rounded-[80px] p-16 text-center backdrop-blur-xl">
              <span className="text-[100px] mb-8 block leading-none">{comp.emoji}</span>
              <p className="text-white font-black text-4xl uppercase leading-tight tracking-tight">
                "Isso equivale a <span className="text-orange-500">{comp.texto}</span> que você não carrega mais!"
              </p>
            </div>
          </div>

          <div className="mt-auto pt-20 border-t border-white/5 text-center">
            <p className="text-slate-500 font-black italic text-4xl uppercase tracking-widest mb-4">O trabalho devolve.</p>
            <p className="text-orange-500/50 text-2xl font-bold uppercase tracking-[0.8em]">gymignite.app</p>
          </div>
        </div>
      </div>

      {/* --- UI DO MODAL SIMPLIFICADA (SEM PREVIEW) --- */}
      <div className="w-full max-w-[320px] flex flex-col items-center gap-10 animate-in fade-in slide-in-from-bottom-4">

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/40">
            <Trophy className="text-white w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Evolução Pronta</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Sua arte de {mesAtual} está gerada</p>
          </div>
        </div>

        {/* Resumo Rápido Visual para confirmação antes de compartilhar */}
        <div className="w-full bg-white/5 border border-white/10 rounded-[32px] p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Scale className="text-orange-500 w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Perda Total</p>
              <p className="text-xl font-black italic text-orange-500">-{perdaTotal.toFixed(1)}kg</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Peso Atual</p>
            <p className="text-xl font-black italic text-white">{pesoAtual.toFixed(1)}kg</p>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={compartilharImagem}
            disabled={isCompartilhando}
            className="w-full bg-white text-black font-black py-6 rounded-[24px] flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-50 shadow-xl"
          >
            {isCompartilhando ? <Loader2 className="w-6 h-6 animate-spin" /> : <Share2 className="w-6 h-6" />}
            <span className="uppercase text-xs tracking-[0.2em]">Compartilhar Agora</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors"
          >
            Agora não, obrigado
          </button>
        </div>
      </div>
    </div>
  );
}