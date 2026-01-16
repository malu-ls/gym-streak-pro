import React from 'react';
import { Info } from 'lucide-react';

interface Props {
  treinos: { data: string; hora: number }[];
  feriados: { date: string }[];
}

export default function BadgeGrid({ treinos, feriados }: Props) {
  const conquistas = [
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
          const diff = (new Date(ordenados[i].data).getTime() - new Date(ordenados[i - 1].data).getTime()) / 86400000;
          if (diff > 10) return true;
        }
        return false;
      })()
    },
    {
      id: 4,
      titulo: 'Consistente',
      emoji: '💎',
      descricao: 'Mantenha consistência acima de 80% no mês.',
      concluido: false
    }
  ];

  return (
    <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
      <h3 className="text-[10px] font-black text-slate-500 uppercase mb-8 tracking-widest text-center">
        Conquistas
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {conquistas.map(badge => (
          <div
            key={badge.id}
            className={`group relative p-8 rounded-2xl border text-center transition-all duration-500 ${badge.concluido
              ? 'bg-orange-500/10 border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.1)]'
              : 'bg-slate-800/20 border-slate-800/50 opacity-40 grayscale'
              }`}
          >
            {/* Balão de Info - Posicionamento Superior Centralizado */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-full max-w-[180px] pointer-events-none">
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <div className="bg-slate-800 text-slate-200 text-[10px] font-bold p-3 rounded-xl border border-slate-700 shadow-2xl">
                  {badge.descricao}
                  {/* Setinha Centralizada */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                </div>
              </div>
            </div>

            {/* Ícone Indicador de Info */}
            <div className="absolute top-3 right-3 text-slate-600 group-hover:text-orange-500 transition-colors">
              <Info className="w-4 h-4" />
            </div>

            <div className="text-5xl mb-3 select-none transition-transform group-hover:scale-110 duration-300">
              {badge.emoji}
            </div>
            <div className={`text-[11px] font-black uppercase leading-tight tracking-wider ${badge.concluido ? 'text-orange-400' : 'text-slate-500'}`}>
              {badge.titulo}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}