"use client";

import React, { useRef, useState } from 'react';
import { Loader2, Share2, Trophy, Flame, Scale } from 'lucide-react';
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
      // Pequeno delay para garantir que o DOM está pronto
      await new Promise(resolve => setTimeout(resolve, 400));

      const blob = await toBlob(artRef.current, {
        quality: 1,
        pixelRatio: 2, // 2 é suficiente para boa qualidade sem travar o mobile
        backgroundColor: '#020617',
        width: 1080,
        height: 1920,
      });

      if (!blob) throw new Error("Falha ao gerar imagem");

      const arquivo = new File([blob], `ignite-evolution-${Date.now()}.png`, { type: 'image/png' });

      // Lógica de Compartilhamento Nativo (Mobile)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [arquivo] })) {
        await navigator.share({
          files: [arquivo],
          title: 'Minha Evolução no Ignite',
          text: 'Mais um degrau vencido! 💪 #GymIgnite #Evolução',
        });
      } else {
        // Fallback: Download (Desktop/Navegadores Antigos)
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `minha-evolucao-ignite.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Erro ao compartilhar:", e);
    } finally {
      setIsCompartilhando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020617]/98 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center p-6 text-white overflow-hidden">

      {/* --- ARTE PARA EXPORTAÇÃO (RENDEREZIDA FORA DA TELA) --- */}
      <div className="absolute left-[-9999px] top-0 pointer-events-none">
        <div
          ref={artRef}
          className="bg-[#020617] w-[1080px] h-[1920px] flex flex-col p-[100px] relative overflow-hidden font-sans"
        >
          {/* Luzes de Fundo Estilizadas */}
          <div className="absolute top-0 right-0 w-[1200px] h-[1200px] bg-orange-500/10 blur-[180px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[900px] h-[900px] bg-blue-500/5 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/2" />

          {/* Header da Arte */}
          <div className="relative z-10 text-center mt-20 mb-32">
            <h1 className="text-[140px] font-black italic uppercase leading-none tracking-tighter text-white">
              GYM <span className="text-orange-500">IGNITE</span>
            </h1>
            <div className="h-2 w-40 bg-orange-500 mx-auto mt-6" />
            <p className="text-slate-500 text-4xl font-black uppercase tracking-[0.6em] mt-10">
              REPORT DE EVOLUÇÃO • {mesAtual}
            </p>
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-center gap-16">
            {/* Cards de Peso */}
            <div className="flex justify-between items-center px-10">
              <div className="space-y-4">
                <p className="text-slate-500 text-3xl font-black uppercase tracking-widest">Peso Inicial</p>
                <p className="text-[90px] font-black italic text-white leading-none">{pesoInicial.toFixed(1)}kg</p>
              </div>
              <div className="h-32 w-px bg-white/10" />
              <div className="space-y-4 text-right">
                <p className="text-slate-500 text-3xl font-black uppercase tracking-widest">Peso Atual</p>
                <p className="text-[90px] font-black italic text-white leading-none">{pesoAtual.toFixed(1)}kg</p>
              </div>
            </div>

            {/* Placa de Resultado */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-[120px] p-24 shadow-[0_60px_120px_rgba(249,115,22,0.3)] relative overflow-hidden text-center">
              <div className="absolute -top-10 -right-10 opacity-10">
                <Flame size={450} color="white" strokeWidth={3} />
              </div>

              <p className="text-orange-100 text-4xl font-black uppercase tracking-[0.4em] mb-6 relative z-10">Peso Eliminado</p>
              <div className="flex items-center justify-center relative z-10">
                <p className="text-[280px] font-black italic leading-none tracking-tighter text-white">
                  -{perdaTotal.toFixed(1)}<span className="text-6xl ml-6">KG</span>
                </p>
              </div>
            </div>

            {/* Comparação Divertida */}
            <div className="bg-slate-900/40 border border-white/5 rounded-[90px] p-20 text-center backdrop-blur-3xl">
              <span className="text-[130px] mb-10 block leading-none">{comp.emoji}</span>
              <p className="text-white font-black text-5xl uppercase leading-tight tracking-tight px-10">
                "Isso equivale a <span className="text-orange-500">{comp.texto}</span> que você não carrega mais!"
              </p>
            </div>
          </div>

          {/* Footer da Arte */}
          <div className="mt-auto pt-20 border-t border-white/10 text-center pb-10">
            <p className="text-slate-400 font-black italic text-4xl uppercase tracking-widest mb-6">A disciplina é a sua chama.</p>
            <p className="text-orange-500 font-black text-3xl uppercase tracking-[0.8em]">ignite.fit</p>
          </div>
        </div>
      </div>

      {/* --- INTERFACE DO USUÁRIO (O QUE ELE VÊ NO APP) --- */}
      <div className="w-full max-w-[340px] flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-6 duration-500">

        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-24 h-24 bg-orange-500 rounded-[32px] flex items-center justify-center shadow-2xl shadow-orange-500/40 rotate-12">
            <Trophy className="text-white w-12 h-12 -rotate-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Arte Gerada!</h2>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
              Sua evolução de {mesAtual} está pronta <br /> para os stories.
            </p>
          </div>
        </div>

        {/* Preview do Status */}
        <div className="w-full bg-white/5 border border-white/10 rounded-[40px] p-8 flex items-center justify-between shadow-inner">
          <div className="flex flex-col gap-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Status</p>
            <p className="text-3xl font-black italic text-orange-500">-{perdaTotal.toFixed(1)}kg</p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="flex flex-col items-end gap-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Peso Atual</p>
            <p className="text-2xl font-black italic text-white">{pesoAtual.toFixed(1)}kg</p>
          </div>
        </div>

        <div className="w-full flex flex-col gap-4">
          <button
            onClick={compartilharImagem}
            disabled={isCompartilhando}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-6 rounded-[28px] flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-50 shadow-[0_20px_40px_rgba(249,115,22,0.3)] group"
          >
            {isCompartilhando ? <Loader2 className="w-6 h-6 animate-spin" /> : <Share2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
            <span className="uppercase text-xs tracking-[0.2em]">Compartilhar nos Stories</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-slate-600 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
          >
            Fechar Relatório
          </button>
        </div>
      </div>
    </div>
  );
}