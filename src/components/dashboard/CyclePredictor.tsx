"use client";

import React, { useState, useRef, useMemo } from 'react';
import {
  Zap, Coffee, Flower2, Activity, RefreshCw,
  Calendar as CalendarIcon, X, Check, Info, Droplets
} from 'lucide-react';

interface Props {
  ultimoCiclo: string;
  duracaoCiclo: number;
  duracaoPeriodo: number;
  onReset?: (novaData: string, novaDuracao: number, novaDuracaoPeriodo: number) => void;
}

export default function CyclePredictor({ ultimoCiclo, duracaoCiclo, duracaoPeriodo, onReset }: Props) {
  const [isEditando, setIsEditando] = useState(false);
  // Inicializamos o estado com os valores atuais vindos do banco
  const [dataSelecionada, setDataSelecionada] = useState(ultimoCiclo);
  const [duracaoSelecionada, setDuracaoSelecionada] = useState(duracaoCiclo);
  const [periodoSelecionado, setPeriodoSelecionado] = useState(duracaoPeriodo);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const statusCiclo = useMemo(() => {
    const hoje = new Date();
    // Ajuste de Meia-Noite: zeramos as horas para o cálculo ser baseado apenas no dia
    hoje.setHours(0, 0, 0, 0);

    const inicio = new Date(ultimoCiclo + "T00:00:00");
    const diffms = hoje.getTime() - inicio.getTime();
    const diffDiasTotal = Math.floor(diffms / (1000 * 60 * 60 * 24));

    // Dia atual dentro do ciclo (ex: 1 a 28)
    const diaAtual = (diffDiasTotal % duracaoCiclo) + 1;
    const percentagem = Math.min(Math.max((diaAtual / duracaoCiclo) * 100, 0), 100);

    // Definição das Fases
    if (diaAtual <= duracaoPeriodo) {
      return {
        nome: "Fase Menstrual",
        Icon: Flower2,
        cor: "bg-red-500",
        border: "border-red-500/20",
        bgCard: "from-red-500/10",
        iconColor: "text-red-400",
        status: "Recuperação Ativa",
        protocolo: "Deload & Técnica",
        explicacao: `Dia ${diaAtual}. Priorize ferro, hidratação e treinos de baixa intensidade (RPE 5-6).`,
        diaAtual,
        percentagem
      };
    }

    if (diaAtual <= (duracaoCiclo / 2) - 1) {
      return {
        nome: "Fase Folicular",
        Icon: Zap,
        cor: "bg-orange-500",
        border: "border-orange-500/20",
        bgCard: "from-orange-500/10",
        iconColor: "text-orange-500",
        status: "Força Máxima",
        protocolo: "Progressão de Carga",
        explicacao: "Estrogênio subindo. É hora de bater recordes (PRs) e aumentar a carga (RPE 8-9).",
        diaAtual,
        percentagem
      };
    }

    if (diaAtual <= (duracaoCiclo / 2) + 2) {
      return {
        nome: "Ovulação",
        Icon: Activity,
        cor: "bg-emerald-500",
        border: "border-emerald-500/20",
        bgCard: "from-emerald-500/10",
        iconColor: "text-emerald-400",
        status: "Pico de Energia",
        protocolo: "Alta Intensidade",
        explicacao: "Pico de força. Cuidado apenas com ligamentos devido à frouxidão hormonal.",
        diaAtual,
        percentagem
      };
    }

    return {
      nome: "Fase Lútea",
      Icon: Coffee,
      cor: "bg-blue-500",
      border: "border-blue-500/20",
      bgCard: "from-blue-500/10",
      iconColor: "text-blue-400",
      status: "Resistência",
      protocolo: "Cardio & Volume",
      explicacao: "Progesterona alta. Foco em volume, técnica e controle de temperatura corporal.",
      diaAtual,
      percentagem
    };
  }, [ultimoCiclo, duracaoCiclo, duracaoPeriodo]);

  const IconComponent = statusCiclo.Icon;

  return (
    <>
      <div className={`relative overflow-hidden p-6 rounded-[32px] border ${statusCiclo.border} bg-gradient-to-br ${statusCiclo.bgCard} to-transparent backdrop-blur-xl transition-all duration-700 shadow-2xl`}>
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

        <div className="mt-6 space-y-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Info size={12} className="text-slate-500" />
                <span className="text-[9px] font-black uppercase tracking-widest">Protocolo Biológico</span>
              </div>
              <span className="text-[10px] font-black text-white/40 uppercase leading-none">{Math.round(statusCiclo.percentagem)}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full ${statusCiclo.cor} transition-all duration-1000 ease-out`}
                style={{ width: `${statusCiclo.percentagem}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${statusCiclo.cor} animate-pulse`} />
              <span className="text-[11px] font-black text-white uppercase italic tracking-tight">
                {statusCiclo.protocolo}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic">
              "{statusCiclo.explicacao}"
            </p>
          </div>
        </div>

        <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12 pointer-events-none">
          <IconComponent size={120} />
        </div>
      </div>

      {/* Modal de Ajuste */}
      {isEditando && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-[40px] w-full max-w-sm shadow-2xl space-y-8 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white font-black uppercase italic tracking-tighter text-2xl">Calibrar Biologia</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Ajuste fino das fases</p>
              </div>
              <button onClick={() => setIsEditando(false)} className="text-slate-500 hover:text-white p-2">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Início do Ciclo</label>
                <div className="relative" onClick={() => dateInputRef.current?.showPicker()}>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={dataSelecionada}
                    onChange={(e) => setDataSelecionada(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-orange-500/50 transition-all"
                  />
                  <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none" size={18} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Ciclo (Dias)</label>
                  <select
                    value={duracaoSelecionada}
                    onChange={(e) => setDuracaoSelecionada(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none appearance-none focus:border-orange-500/50"
                  >
                    {[...Array(21)].map((_, i) => (
                      <option key={i + 20} value={i + 20}>{i + 20}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Droplets size={10} className="text-red-500" /> Fluxo
                  </label>
                  <select
                    value={periodoSelecionado}
                    onChange={(e) => setPeriodoSelecionado(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none appearance-none focus:border-orange-500/50"
                  >
                    {[3, 4, 5, 6, 7, 8].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onReset?.(dataSelecionada, duracaoSelecionada, periodoSelecionado);
                setIsEditando(false);
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-orange-500/20 uppercase text-xs tracking-widest"
            >
              <Check size={18} strokeWidth={3} /> Atualizar Bio-Dados
            </button>
          </div>
        </div>
      )}
    </>
  );
}