"use client";

import React, { useRef, useState } from 'react';
import { Loader2, Share2, Trophy, Flame } from 'lucide-react';
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
      // Pequeno delay para garantir que o navegador processou as fontes
      await new Promise(resolve => setTimeout(resolve, 300));

      const blob = await toBlob(artRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#020617',
        width: 1080,
        height: 1920,
        cacheBust: true,
        // Forçamos a captura a ignorar o que está fora do elemento
        style: {
          opacity: '1',
          visibility: 'visible',
          display: 'flex'
        }
      });

      if (!blob) throw new Error("Falha ao gerar imagem");

      const arquivo = new File([blob], `gym-ignite-evolution.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [arquivo] })) {
        await navigator.share({
          files: [arquivo],
          title: 'Minha Evolução no Ignite',
          text: 'Mais um degrau vencido! 💪 #GymIgnite',
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `evolucao-ignite.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Erro na exportação:", e);
      alert("Não foi possível gerar a imagem. Tente novamente.");
    } finally {
      setIsCompartilhando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020617]/98 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center p-6 text-white overflow-hidden">

      {/* --- ARTE DE EXPORTAÇÃO (INVISÍVEL MAS RENDERIZADA) --- */}
      {/* Usamos opacity-0 e pointer-events-none para não aparecer no fundo */}
      <div
        ref={artRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '1080px',
          height: '1920px',
          opacity: 0, // Invisível para o usuário
          pointerEvents: 'none', // Não interfere nos cliques
          zIndex: -1,
        }}
        className="bg-[#020617] flex flex-col p-[100px] font-sans items-center text-center"
      >
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-orange-500/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10 mt-20 mb-20">
          <h1 className="text-[110px] font-black italic uppercase leading-none tracking-tighter text-white">
            GYM <span className="text-orange-500">IGNITE</span>
          </h1>
          <div className="h-2 w-40 bg-orange-500 mx-auto mt-6" />
          <p className="text-slate-500 text-3xl font-black uppercase tracking-[0.4em] mt-8">
            EVOLUTION REPORT • {mesAtual}
          </p>
        </div>

        <div className="relative z-10 w-full flex justify-between items-center px-10 mb-20 mt-10">
          <div className="flex flex-col items-start text-left">
            <p className="text-slate-500 text-2xl font-black uppercase tracking-widest">Início</p>
            <p className="text-[80px] font-black text-white italic leading-none">{pesoInicial.toFixed(1)}kg</p>
          </div>
          <div className="h-24 w-px bg-white/10" />
          <div className="flex flex-col items-end text-right">
            <p className="text-slate-500 text-2xl font-black uppercase tracking-widest">Atual</p>
            <p className="text-[80px] font-black text-white italic leading-none">{pesoAtual.toFixed(1)}kg</p>
          </div>
        </div>

        <div className="relative z-10 w-full bg-orange-600 rounded-[100px] py-20 px-10 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-10">
            <Flame size={400} color="white" strokeWidth={3} />
          </div>
          <p className="text-orange-100 text-3xl font-black uppercase tracking-[0.3em] mb-4">Total Eliminado</p>
          <div className="flex items-baseline justify-center">
            <p className="text-[220px] font-black italic leading-none tracking-tighter text-white">
              -{perdaTotal.toFixed(1)}
            </p>
            <span className="text-6xl font-black italic text-white ml-4">KG</span>
          </div>
        </div>

        <div className="relative z-10 w-full mt-20 bg-slate-900/40 border border-white/5 rounded-[80px] p-16 flex flex-col items-center">
          <span className="text-[120px] mb-8 leading-none">{comp.emoji}</span>
          <p className="text-white font-black text-4xl uppercase leading-tight tracking-tight px-6 text-center">
            "Isso equivale a <span className="text-orange-500">{comp.texto.toUpperCase()}</span> que você não carrega mais!"
          </p>
        </div>

        <div className="mt-auto relative z-10 mb-10">
          <p className="text-slate-500 font-black italic text-3xl uppercase tracking-widest mb-4">O trabalho devolve.</p>
          <p className="text-orange-500 font-black text-2xl uppercase tracking-[0.6em]">GYMIGNITE.APP</p>
        </div>
      </div>

      {/* --- UI DO MODAL (INTERFACE VISÍVEL) --- */}
      <div className="w-full max-w-[340px] flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-orange-500 rounded-[32px] flex items-center justify-center shadow-2xl shadow-orange-500/40 rotate-12">
          <Trophy className="text-white w-12 h-12 -rotate-12" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Arte Gerada!</h2>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest text-center">
            Sua evolução de {mesAtual} está pronta <br /> para os stories.
          </p>
        </div>

        <button
          onClick={compartilharImagem}
          disabled={isCompartilhando}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-6 rounded-[28px] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-xl"
        >
          {isCompartilhando ? <Loader2 className="w-6 h-6 animate-spin" /> : <Share2 className="w-6 h-6" />}
          <span className="uppercase text-xs tracking-[0.2em]">Compartilhar Agora</span>
        </button>

        <button onClick={onClose} className="py-2 text-slate-600 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">
          Fechar Relatório
        </button>
      </div>
    </div>
  );
}