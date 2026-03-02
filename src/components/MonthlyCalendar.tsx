"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, Trophy } from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  getDay,
  getDaysInMonth,
  isSameDay,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Treino {
  data: string;
  mood?: string;
}

interface Props {
  treinos: Treino[];
  onToggleTreino: (dataIso: string) => void;
  onMonthChange?: (date: Date) => void;
}

interface Feriado {
  date: string;
  name: string;
}

export default function MonthlyCalendar({ treinos, onToggleTreino, onMonthChange }: Props) {
  const [mesReferencia, setMesReferencia] = useState(new Date());
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [loadingFeriados, setLoadingFeriados] = useState(false);

  // Sincroniza o mês atual com o componente pai (Dashboard)
  useEffect(() => {
    onMonthChange?.(mesReferencia);
  }, [mesReferencia, onMonthChange]);

  // Busca feriados nacionais para marcar dias de "Inabalável"
  useEffect(() => {
    const controller = new AbortController();
    const buscarFeriados = async () => {
      const ano = mesReferencia.getFullYear();
      setLoadingFeriados(true);
      try {
        const response = await fetch(
          `https://brasilapi.com.br/api/feriados/v1/${ano}`,
          { signal: controller.signal }
        );
        if (response.ok) {
          const data = await response.json();
          setFeriados(data);
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.warn("Feriados indisponíveis temporariamente");
        }
      } finally {
        setLoadingFeriados(false);
      }
    };

    buscarFeriados();
    return () => controller.abort();
  }, [mesReferencia.getFullYear()]);

  const proximoMes = useCallback(() => setMesReferencia(prev => addMonths(prev, 1)), []);
  const anteriorMes = useCallback(() => setMesReferencia(prev => subMonths(prev, 1)), []);

  // Construção do Grid com Memoização para evitar re-renders pesados
  const gridDias = useMemo(() => {
    const primeiroDiaSemana = getDay(startOfMonth(mesReferencia));
    const totalDias = getDaysInMonth(mesReferencia);
    const hoje = new Date();

    const treinosMap = new Map(treinos.map(t => [t.data, t.mood]));
    const feriadosMap = new Map(feriados.map(f => [f.date, f.name]));

    const dias = [];

    // Dias vazios (offset do mês)
    for (let i = 0; i < primeiroDiaSemana; i++) {
      dias.push({ tipo: 'vazio', chave: `empty-${i}` });
    }

    // Dias reais do mês
    for (let d = 1; d <= totalDias; d++) {
      const dataAtual = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth(), d);
      const dataIso = format(dataAtual, 'yyyy-MM-dd');
      const mood = treinosMap.get(dataIso);

      dias.push({
        tipo: 'dia',
        numero: d,
        chave: dataIso,
        isHoje: isSameDay(hoje, dataAtual),
        treinou: treinosMap.has(dataIso),
        mood: mood,
        feriadoNome: feriadosMap.get(dataIso)
      });
    }
    return dias;
  }, [mesReferencia, treinos, feriados]);

  const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-[40px] border border-white/5 shadow-2xl animate-in fade-in duration-700">

      {/* Header Interativo */}
      <div className="flex justify-between items-center mb-8 px-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
            <CalendarIcon className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white capitalize tracking-tighter leading-none">
              {format(mesReferencia, 'MMMM', { locale: ptBR })}
            </h2>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              Calendário de Combate • {format(mesReferencia, 'yyyy')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/50 p-2 rounded-2xl border border-white/5">
          {loadingFeriados && <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500/40" />}
          <button onClick={anteriorMes} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-all active:scale-90">
            <ChevronLeft size={20} />
          </button>
          <button onClick={proximoMes} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-all active:scale-90">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Grid do Calendário */}
      <div className="grid grid-cols-7 gap-2 md:gap-3">
        {diasDaSemana.map(dia => (
          <div key={dia} className="text-center text-[9px] font-black uppercase text-slate-600 tracking-[0.2em] mb-3">
            {dia}
          </div>
        ))}

        {gridDias.map((item) => {
          if (item.tipo === 'vazio') return <div key={item.chave} className="aspect-square" />;

          // Lógica de exibição do emoji ou número
          const exibirMood = item.treinou && item.mood && item.mood !== '🏆';

          return (
            <button
              key={item.chave}
              type="button"
              onClick={() => onToggleTreino(item.chave)}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-2xl border transition-all duration-300
                active:scale-90 tap-highlight-transparent group
                ${item.treinou
                  ? 'bg-orange-500 border-orange-400 shadow-[0_10px_25px_rgba(249,115,22,0.25)]'
                  : item.feriadoNome
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-slate-800/40 border-white/5 hover:border-orange-500/30'}
                ${item.isHoje && !item.treinou ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-[#020617]' : ''}
              `}
            >
              {exibirMood ? (
                <span className="text-2xl md:text-3xl animate-in zoom-in duration-500 drop-shadow-md">
                  {item.mood}
                </span>
              ) : (
                <span className={`text-xs md:text-sm font-black transition-colors
                  ${item.treinou ? 'text-white' : item.feriadoNome ? 'text-red-400' : 'text-slate-500'}
                `}>
                  {item.numero}
                </span>
              )}

              {/* Badges de Conquista Rápida */}
              {item.treinou && (
                <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-xl animate-in zoom-in">
                  <Trophy className="w-2.5 h-2.5 text-orange-600" />
                </div>
              )}

              {item.feriadoNome && !item.treinou && (
                <div className="absolute bottom-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legenda Minimalista */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-6 border-t border-white/5 pt-8">
        {[
          { color: 'bg-orange-500', label: 'Treino' },
          { color: 'bg-red-500/40', label: 'Feriado' },
          { color: 'bg-blue-500', label: 'Hoje' }
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${l.color}`} />
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}