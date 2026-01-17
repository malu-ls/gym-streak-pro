"use client";

import React, { useMemo } from 'react';
import { Info } from 'lucide-react';

interface Props {
  treinos: { data: string; hora: number }[];
  feriados: { date: string }[];
  mesReferencia?: Date; // O '?' torna a prop opcional para evitar erros
  metaSemanal: number;
}

export default function BadgeGrid({ treinos, feriados, mesReferencia, metaSemanal }: Props) {
  const conquistas = useMemo(() => {
    // FALLBACK: Se mesReferencia não vier, usa a data atual para não quebrar o app
    const dataSegura = mesReferencia || new Date();

    const anoRef = dataSegura.getFullYear();
    const mesRef = (dataSegura.getMonth() + 1).toString().padStart(2, '0');
    const prefixoMes = `${anoRef}-${mesRef}`;

    // Lógica do Prêmio Consistente
    const treinosNoMes = treinos.filter(t => t.data.startsWith(prefixoMes)).length;
    const metaEsperadaMes = metaSemanal * 4;
    const porcentagemMensal = metaEsperadaMes > 0 ? (treinosNoMes / metaEsperadaMes) * 100 : 0;

    return [
      {
        id: 1,
        titulo: 'Madrugador',
        emoji: '🌅',
        descricao: 'Conclua 5 treinos antes das 08:00 da manhã.',
        concluido: treinos.filter(t => t.hora < 8).length >= 5
      },
      {
        id: 2,
        titulo: 'Inabalável',
        emoji: '🛡️',
        descricao: 'Treine em um dia de feriado nacional.',
        concluido: treinos.some(t => feriados.some(f => f.date === t.data))
      },
      {
        id: 3,
        titulo: 'Fênix',
        emoji: '🐦‍🔥',
        descricao: 'Retorne após um hiato de mais de 10 dias.',
        concluido: (() => {
          const ordenados = [...treinos].sort((a, b) => a.data.localeCompare(b.data));
          for (let i = 1; i < ordenados.length; i++) {
            const d1 = new Date(ordenados[i].data).getTime();
            const d2 = new Date(ordenados[i - 1].data).getTime();
            if ((d1 - d2) / 86400000 > 10) return true;
          }
          return false;
        })()
      },
      {
        id: 4,
        titulo: 'Consistente',
        emoji: '💎',
        descricao: 'Mantenha consistência acima de 80% no mês.',
        concluido: porcentagemMensal >= 80 // Agora acenderá se bater a meta do mês
      }
    ];
  }, [treinos, feriados, mesReferencia, metaSemanal]);

  return (
    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
      <h3 className="text-[10px] font-black text-slate-500 uppercase mb-8 tracking-widest text-center">
        Conquistas
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {conquistas.map(badge => (
          <div
            key={badge.id}
            className={`group relative p-8 rounded-2xl border text-center transition-all duration-500 ${badge.concluido
              ? 'bg-orange-500/10 border-orange-500/40 opacity-100 grayscale-0 shadow-[0_0_20px_rgba(249,115,22,0.1)]'
              : 'bg-slate-800/20 border-slate-800/50 opacity-30 grayscale'
              }`}
          >
            {/* Tooltip de Descrição */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-full max-w-[180px] pointer-events-none z-50">
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="bg-slate-800 text-slate-200 text-[10px] font-bold p-3 rounded-xl border border-slate-700">
                  {badge.descricao}
                </div>
              </div>
            </div>

            <div className="text-5xl mb-3 select-none">{badge.emoji}</div>
            <div className={`text-[11px] font-black uppercase tracking-wider ${badge.concluido ? 'text-orange-400' : 'text-slate-500'}`}>
              {badge.titulo}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}