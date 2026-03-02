"use client";

import React, { useMemo } from 'react';

// Interface consistente com o restante do app
interface Treino {
  data: string;
  hora: number;
}

interface Props {
  treinos: Treino[];
  feriados: { date: string }[];
  mesReferencia?: Date;
  metaSemanal: number;
}

export default function BadgeGrid({ treinos, feriados, mesReferencia, metaSemanal }: Props) {
  const conquistas = useMemo(() => {
    const dataSegura = mesReferencia || new Date();
    const anoRef = dataSegura.getFullYear();
    const mesRef = (dataSegura.getMonth() + 1).toString().padStart(2, '0');
    const prefixoMes = `${anoRef}-${mesRef}`;

    // 1. Lógica de Consistência Mensal (💎)
    const treinosNoMes = treinos.filter(t => t.data.startsWith(prefixoMes)).length;

    const hoje = new Date();
    const isMesAtual = hoje.getFullYear() === anoRef && hoje.getMonth() === dataSegura.getMonth();

    let metaEsperadaMes;
    if (isMesAtual) {
      const diasPassados = hoje.getDate();
      const semanasPassadas = Math.max(1, diasPassados / 7);
      metaEsperadaMes = Math.floor(metaSemanal * semanasPassadas);
    } else {
      metaEsperadaMes = metaSemanal * 4;
    }

    const porcentagemMensal = metaEsperadaMes > 0 ? (treinosNoMes / metaEsperadaMes) * 100 : 0;

    return [
      {
        id: 'madrugador',
        titulo: 'Madrugador',
        emoji: '🌅',
        descricao: 'Conclua 5 treinos antes das 08:00 da manhã.',
        concluido: treinos.filter(t => t.hora < 8).length >= 5
      },
      {
        id: 'inabalavel',
        titulo: 'Inabalável',
        emoji: '🛡️',
        descricao: 'Treine em um dia de feriado nacional.',
        concluido: treinos.some(t => feriados.some(f => f.date === t.data))
      },
      {
        id: 'fenix',
        titulo: 'Fênix',
        emoji: '🐦‍🔥',
        descricao: 'Retorne após um hiato de mais de 10 dias.',
        concluido: (() => {
          if (treinos.length < 2) return false;
          // Ordena por data para calcular o gap entre treinos
          const ordenados = [...treinos].sort((a, b) => a.data.localeCompare(b.data));
          for (let i = 1; i < ordenados.length; i++) {
            const atual = new Date(ordenados[i].data).getTime();
            const anterior = new Date(ordenados[i - 1].data).getTime();
            const diferencaDias = (atual - anterior) / (1000 * 60 * 60 * 24);
            if (diferencaDias > 10) return true;
          }
          return false;
        })()
      },
      {
        id: 'consistente',
        titulo: 'Consistente',
        emoji: '💎',
        descricao: 'Mantenha consistência acima de 80% em relação à sua meta.',
        concluido: porcentagemMensal >= 80
      }
    ];
  }, [treinos, feriados, mesReferencia, metaSemanal]);

  return (
    <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 backdrop-blur-xl">
      <h3 className="text-[10px] font-black text-slate-500 uppercase mb-8 tracking-[0.4em] text-center">
        Sistema de Conquistas
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {conquistas.map(badge => (
          <div
            key={badge.id}
            className={`group relative p-6 rounded-[32px] border text-center transition-all duration-700 ${badge.concluido
              ? 'bg-orange-500/10 border-orange-500/30 opacity-100 shadow-[0_20px_40px_rgba(249,115,22,0.05)]'
              : 'bg-slate-800/10 border-white/5 opacity-40 grayscale'
              }`}
          >
            {/* Tooltip Mobile Friendly */}
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-48 pointer-events-none z-50">
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-2">
                <div className="bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest p-3 rounded-2xl border border-white/10 shadow-2xl">
                  {badge.descricao}
                </div>
              </div>
            </div>

            <div className={`text-5xl mb-4 transition-transform duration-500 ${badge.concluido ? 'group-hover:scale-125' : ''}`}>
              {badge.emoji}
            </div>
            <div className={`text-[10px] font-black uppercase tracking-widest ${badge.concluido ? 'text-white' : 'text-slate-600'}`}>
              {badge.titulo}
            </div>

            {!badge.concluido && (
              <div className="absolute top-3 right-3 opacity-20">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}