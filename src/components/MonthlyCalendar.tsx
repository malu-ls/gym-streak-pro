"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from 'lucide-react';
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
  onToggleTreino: (dataIso: string) => void; // Nova prop para interatividade
}

interface Feriado {
  date: string;
  name: string;
}

export default function MonthlyCalendar({ treinos, onToggleTreino }: Props) {
  const [mesReferencia, setMesReferencia] = useState(new Date());
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [loadingFeriados, setLoadingFeriados] = useState(false);

  // Busca feriados - Executa apenas quando o ano muda
  useEffect(() => {
    const buscarFeriados = async () => {
      setLoadingFeriados(true);
      const ano = mesReferencia.getFullYear();
      try {
        const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        setFeriados(data);
      } catch (error) {
        console.warn("Erro ao buscar feriados nacionais.");
      } finally {
        setLoadingFeriados(false);
      }
    };
    buscarFeriados();
  }, [mesReferencia.getFullYear()]);

  // Navegação
  const proximoMes = () => setMesReferencia(prev => addMonths(prev, 1));
  const anteriorMes = () => setMesReferencia(prev => subMonths(prev, 1));

  // Cálculo do Grid - Memoizado para performance
  const gridDias = useMemo(() => {
    const primeiroDiaSemana = getDay(startOfMonth(mesReferencia));
    const totalDias = getDaysInMonth(mesReferencia);
    const hoje = new Date();

    const dias = [];

    // Espaços vazios do mês anterior
    for (let i = 0; i < primeiroDiaSemana; i++) {
      dias.push({ tipo: 'vazio', chave: `empty-${i}` });
    }

    // Dias do mês atual
    for (let d = 1; d <= totalDias; d++) {
      const dataAtual = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth(), d);
      const dataIso = format(dataAtual, 'yyyy-MM-dd');

      dias.push({
        tipo: 'dia',
        numero: d,
        chave: dataIso,
        data: dataAtual,
        isHoje: isSameDay(hoje, dataAtual),
        treinou: treinos.some(t => t.data === dataIso),
        feriado: feriados.find(f => f.date === dataIso)
      });
    }

    return dias;
  }, [mesReferencia, treinos, feriados]);

  const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Cabeçalho do Calendário */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <CalendarIcon className="w-4 h-4 text-orange-500" />
          </div>
          <h2 className="text-sm font-black text-slate-100 capitalize">
            {format(mesReferencia, 'MMMM yyyy', { locale: ptBR })}
          </h2>
        </div>

        <div className="flex items-center gap-1">
          {loadingFeriados && <Loader2 className="w-3 h-3 animate-spin text-slate-600 mr-2" />}
          <button
            onClick={anteriorMes}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={proximoMes}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-7 gap-1.5 md:gap-2">
        {diasDaSemana.map(dia => (
          <div key={dia} className="text-center text-[10px] font-black uppercase text-slate-600 tracking-tighter pb-2">
            {dia}
          </div>
        ))}

        {gridDias.map((item) => {
          if (item.tipo === 'vazio') {
            return <div key={item.chave} className="h-12 md:h-14" />;
          }

          return (
            <button
              key={item.chave}
              type="button"
              onClick={() => onToggleTreino(item.chave)} // Aciona a função de alternar treino
              title={item.feriado?.name || "Clique para alternar treino"}
              className={`
                relative h-12 md:h-14 flex flex-col items-center justify-center rounded-xl border transition-all duration-200
                active:scale-95 hover:brightness-125
                ${item.treinou
                  ? 'bg-orange-600/30 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                  : item.feriado
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-slate-800/30 border-slate-800/80'}
                ${item.isHoje ? 'ring-2 ring-blue-500 ring-inset' : ''}
              `}
            >
              <span className={`text-[11px] md:text-xs font-bold
                ${item.treinou ? 'text-orange-400' : item.feriado ? 'text-red-400' : 'text-slate-500'}
                ${item.isHoje && !item.treinou ? 'text-blue-400' : ''}
              `}>
                {item.numero}
              </span>

              {item.treinou && (
                <span className="text-[10px] mt-0.5 filter drop-shadow-sm">🔥</span>
              )}

              {item.feriado && !item.treinou && (
                <div className="absolute top-1 right-1 w-1 h-1 bg-red-500 rounded-full" />
              )}

              {item.isHoje && (
                <div className="absolute bottom-1 w-4 h-0.5 bg-blue-500/50 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legenda Simples */}
      <div className="mt-4 pt-4 border-t border-slate-800/50 flex gap-4 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-[9px] uppercase font-bold text-slate-600">Treino</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/50" />
          <span className="text-[9px] uppercase font-bold text-slate-600">Feriado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[9px] uppercase font-bold text-slate-600">Hoje</span>
        </div>
      </div>
    </div>
  );
}