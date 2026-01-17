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
  isSameDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  treinos: { data: string }[];
  onToggleTreino: (dataIso: string) => void;
  onMonthChange?: (date: Date) => void; // ADICIONADO: Prop para comunicar mudança
}

interface Feriado {
  date: string;
  name: string;
}

export default function MonthlyCalendar({ treinos, onToggleTreino, onMonthChange }: Props) {
  const [mesReferencia, setMesReferencia] = useState(new Date());
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [loadingFeriados, setLoadingFeriados] = useState(false);

  // Busca feriados otimizada
  useEffect(() => {
    let active = true;
    const buscarFeriados = async () => {
      const ano = mesReferencia.getFullYear();
      setLoadingFeriados(true);
      try {
        const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
        if (response.ok && active) {
          const data = await response.json();
          setFeriados(data);
        }
      } catch (error) {
        console.warn("Feriados indisponíveis");
      } finally {
        if (active) setLoadingFeriados(false);
      }
    };
    buscarFeriados();
    return () => { active = false; };
  }, [mesReferencia.getFullYear()]);

  // NAVEGAÇÃO ATUALIZADA: Agora chama o onMonthChange
  const proximoMes = useCallback(() => {
    setMesReferencia(prev => {
      const novaData = addMonths(prev, 1);
      if (onMonthChange) onMonthChange(novaData);
      return novaData;
    });
  }, [onMonthChange]);

  const anteriorMes = useCallback(() => {
    setMesReferencia(prev => {
      const novaData = subMonths(prev, 1);
      if (onMonthChange) onMonthChange(novaData);
      return novaData;
    });
  }, [onMonthChange]);

  // Grid de Dias - Otimizado com Set
  const gridDias = useMemo(() => {
    const primeiroDiaSemana = getDay(startOfMonth(mesReferencia));
    const totalDias = getDaysInMonth(mesReferencia);
    const hoje = new Date();

    const treinosSet = new Set(treinos.map(t => t.data));
    const feriadosMap = new Map(feriados.map(f => [f.date, f.name]));

    const dias = [];

    for (let i = 0; i < primeiroDiaSemana; i++) {
      dias.push({ tipo: 'vazio', chave: `empty-${i}` });
    }

    for (let d = 1; d <= totalDias; d++) {
      const dataAtual = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth(), d);
      const dataIso = format(dataAtual, 'yyyy-MM-dd');

      dias.push({
        tipo: 'dia',
        numero: d,
        chave: dataIso,
        isHoje: isSameDay(hoje, dataAtual),
        treinou: treinosSet.has(dataIso),
        feriadoNome: feriadosMap.get(dataIso)
      });
    }

    return dias;
  }, [mesReferencia, treinos, feriados]);

  const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-[32px] border border-white/5 shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/10 rounded-2xl border border-orange-500/20">
            <CalendarIcon className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white capitalize tracking-tight leading-none">
              {format(mesReferencia, 'MMMM', { locale: ptBR })}
            </h2>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              {format(mesReferencia, 'yyyy')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/40 p-1.5 rounded-2xl border border-white/5">
          {loadingFeriados && <Loader2 className="w-4 h-4 animate-spin text-orange-500/50 mr-1" />}
          <button onClick={anteriorMes} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 transition-all active:scale-90">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={proximoMes} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 transition-all active:scale-90">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-3">
        {diasDaSemana.map(dia => (
          <div key={dia} className="text-center text-[9px] font-black uppercase text-slate-600 tracking-widest mb-2">
            {dia}
          </div>
        ))}

        {gridDias.map((item) => {
          if (item.tipo === 'vazio') {
            return <div key={item.chave} className="aspect-square" />;
          }

          return (
            <button
              key={item.chave}
              type="button"
              onClick={() => onToggleTreino(item.chave)}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-2xl border transition-all duration-150
                hover:scale-105 active:scale-90 tap-highlight-transparent group
                ${item.treinou
                  ? 'bg-orange-500 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                  : item.feriadoNome
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-slate-800/40 border-white/5 hover:border-slate-700'}
                ${item.isHoje && !item.treinou ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-slate-900' : ''}
              `}
            >
              <span className={`text-xs md:text-sm font-black transition-colors
                ${item.treinou ? 'text-white' : item.feriadoNome ? 'text-red-400' : 'text-slate-400'}
              `}>
                {item.numero}
              </span>

              {item.treinou && (
                <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-lg animate-in zoom-in">
                  <Trophy className="w-2.5 h-2.5 text-orange-600" />
                </div>
              )}

              {item.feriadoNome && !item.treinou && (
                <div className="absolute bottom-1.5 w-1 h-1 bg-red-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-6 border-t border-white/5 pt-6">
        {[
          { color: 'bg-orange-500', label: 'Treino' },
          { color: 'bg-red-500/50', label: 'Feriado' },
          { color: 'bg-blue-500', label: 'Hoje' }
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${l.color}`} />
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}