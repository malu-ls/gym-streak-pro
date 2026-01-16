import { Flame, Bell } from 'lucide-react';

interface Props {
  treinosCount: number;
  metaSemanal: number;
  onSolicitarNotificacao: () => void;
}

export default function Header({ treinosCount, metaSemanal, onSolicitarNotificacao }: Props) {
  return (
    <header className="flex justify-between items-center bg-slate-900/50 p-8 rounded-3xl border border-slate-800 shadow-2xl">
      <div>
        <h1 className="text-3xl font-black italic uppercase italic text-white">
          Gym <span className="text-orange-500">Ignite</span>
        </h1>
        <p className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-tighter">
          A chama nunca apaga
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSolicitarNotificacao}
          className="p-3 bg-slate-800 rounded-2xl hover:text-orange-500 transition-colors border border-slate-700"
        >
          <Bell className="w-5 h-5 text-slate-400" />
        </button>
        <div className="flex flex-col items-center bg-slate-800/50 px-4 py-2 rounded-2xl border border-orange-500/20">
          <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
          <span className="text-lg font-bold text-white">{Math.floor(treinosCount / metaSemanal)}</span>
        </div>
      </div>
    </header>
  );
}