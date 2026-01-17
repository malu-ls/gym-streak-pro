"use client";

import React, { useState, useRef, useMemo } from 'react';
import { Zap, Coffee, Flower2, Activity, RefreshCw, Calendar as CalendarIcon, X, Check, Hash, Info, ChevronRight } from 'lucide-react';

interface Props {
  ultimoCiclo: string;
  duracaoCiclo: number;
  onReset?: (novaData: string, novaDuracao: number) => void;
}

export default function CyclePredictor({ ultimoCiclo, duracaoCiclo, onReset }: Props) {
  const [isEditando, setIsEditando] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [duracaoSelecionada, setDuracaoSelecionada] = useState(duracaoCiclo);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const statusCiclo = useMemo(() => {
    const hoje = new Date();
    const inicio = new Date(ultimoCiclo);
    const diffms = hoje.getTime() - inicio.getTime();
    const diffDias = Math.floor(diffms / (1000 * 60 * 60 * 24));

    const diaAtual = (diffDias % duracaoCiclo) + 1;
    const percentagem = Math.min(Math.max((diaAtual / duracaoCiclo) * 100, 0), 100);

    let faseInfo;
    // Lógica baseada em evidências de performance fisiológica
    if (diaAtual <= 5) {
      faseInfo = {
        nome: "Fase Menstrual",
        Icon: Flower2,
        cor: "bg-red-500",
        border: "border-red-500/20",
        bgCard: "from-red-500/10",
        iconColor: "text-red-400",
        status: "Recuperação",
        protocolo: "Deload & Técnica",
        explicacao: "A energia pode oscilar. É normal sentir-se mais cansada; foque em mobilidade e cargas moderadas sem cobrança."
      };
    } else if (diaAtual <= 13) {
      faseInfo = {
        nome: "Fase Folicular",
        Icon: Zap,
        cor: "bg-orange-500",
        border: "border-orange-500/20",
        bgCard: "from-orange-500/10",
        iconColor: "text-orange-500",
        status: "Força Máxima",
        protocolo: "Progressão de Carga",
        explicacao: "Seu corpo está no pico hormonal (estrogênio). Momento ideal para bater recordes (PRs) e aumentar pesos!"
      };
    } else if (diaAtual <= 21) {
      faseInfo = {
        nome: "Fase Lútea Inicial",
        Icon: Activity,
        cor: "bg-emerald-500",
        border: "border-emerald-500/20",
        bgCard: "from-emerald-500/10",
        iconColor: "text-emerald-400",
        status: "Consistência",
        protocolo: "Manutenção",
        explicacao: "A força está estável, mas a temperatura corporal sobe. Mantenha o ritmo constante e hidrate-se bem."
      };
    } else {
      faseInfo = {
        nome: "Fase Pré-Menstrual",
        Icon: Coffee,
        cor: "bg-blue-500",
        border: "border-blue-500/20",
        bgCard: "from-blue-500/10",
        iconColor: "text-blue-400",
        status: "Baixa Energia",
        protocolo: "Redução de Volume",
        explicacao: "A força pode cair até 20% pela progesterona alta. Não se sinta fraca: seu corpo está apenas priorizando a recuperação."
      };
    }

    return { ...faseInfo, diaAtual, percentagem };
  }, [ultimoCiclo, duracaoCiclo]);

  const IconComponent = statusCiclo.Icon;

  return (
    <>
      <div className={`relative overflow-hidden p-6 rounded-[32px] border ${statusCiclo.border} bg-gradient-to-br ${statusCiclo.bgCard} to-transparent backdrop-blur-xl transition-all duration-500`}>
        {/* Header do Card */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex gap-4">
            <div className="p-3 bg-slate-950/50 rounded-2xl border border-white/5 shadow-inner">
              <IconComponent className={statusCiclo.iconColor} size={24} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Dia {statusCiclo.diaAtual} do Ciclo</span>
                <div className="w-1 h-1 bg-white/10 rounded-full" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{statusCiclo.status}</span>
              </div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">{statusCiclo.nome}</h3>
            </div>
          </div>

          <button
            onClick={() => setIsEditando(true)}
            className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 py-2 px-3 rounded-xl transition-all active:scale-95"
          >
            <RefreshCw size={12} className="text-orange-500 group-hover:rotate-180 transition-transform duration-700" />
            <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Ajustar</span>
          </button>
        </div>

        {/* Seção de Performance e Barra */}
        <div className="mt-6 space-y-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Info size={12} className="text-slate-500" />
                <span className="text-[9px] font-black uppercase tracking-widest">Protocolo de Treino</span>
              </div>
              <span className="text-[10px] font-black text-white/40 uppercase leading-none">{Math.round(statusCiclo.percentagem)}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full ${statusCiclo.cor} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(249,115,22,0.3)]`}
                style={{ width: `${statusCiclo.percentagem}%` }}
              />
            </div>
          </div>

          {/* Box de Estratégia de Carga */}
          <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${statusCiclo.cor} animate-pulse`} />
                <span className="text-[11px] font-black text-white uppercase italic tracking-tight">
                  Estratégia: {statusCiclo.protocolo}
                </span>
              </div>
              <ChevronRight size={14} className="text-slate-600" />
            </div>
            <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic pr-4">
              "{statusCiclo.explicacao}"
            </p>
          </div>
        </div>

        <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12 pointer-events-none">
          <IconComponent size={120} />
        </div>
      </div>

      {/* Modal de Ajuste (Refatorado para melhor UX) */}
      {isEditando && (
        <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-[40px] w-full max-w-sm shadow-2xl space-y-8 animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white font-black uppercase italic tracking-tighter text-2xl">Ajustar Ciclo</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Sincronize sua biologia</p>
              </div>
              <button onClick={() => setIsEditando(false)} className="bg-white/5 p-2 rounded-full text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Início do Ciclo</label>
                <div className="relative cursor-pointer" onClick={() => dateInputRef.current?.showPicker()}>
                  <input ref={dateInputRef} type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-orange-500 transition-all appearance-none" />
                  <CalendarIcon className="absolute right-5 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Duração Média</label>
                <div className="relative">
                  <select value={duracaoSelecionada} onChange={(e) => setDuracaoSelecionada(Number(e.target.value))} className="w-full bg-slate-950 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-orange-500 appearance-none transition-all">
                    {[...Array(16)].map((_, i) => (<option key={i + 20} value={i + 20}>{i + 20} dias</option>))}
                  </select>
                  <Hash className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={20} />
                </div>
              </div>
            </div>

            <button onClick={() => { onReset?.(dataSelecionada, duracaoSelecionada); setIsEditando(false); }} className="w-full bg-white text-black font-black py-5 rounded-[24px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-white/5">
              <Check size={20} strokeWidth={3} /> CONFIRMAR AJUSTES
            </button>
          </div>
        </div>
      )}
    </>
  );
}