import { Flame, CheckCircle2, Shield } from 'lucide-react';

interface Props {
  treinosCount: number;
  metaAnual: number;
  consistencia: number;
  treinosNoMes: number;
  metaMensalEstimada: number;
  bateuMetaMensal: boolean;
  rank: { nome: string; emoji: string };
  treinouHoje: boolean;
}

export default function InstagramCard({
  treinosCount, metaAnual, consistencia, treinosNoMes, metaMensalEstimada, bateuMetaMensal, rank, treinouHoje
}: Props) {
  return (
    <div
      id="resumo-mensal-card"
      className="fixed w-[1080px] h-[1920px] bg-slate-950 p-24 flex flex-col justify-between"
      style={{ left: '-2000px', top: 0, zIndex: -1, backgroundColor: '#020617', fontFamily: 'sans-serif' }}
    >
      <div className="space-y-6">
        <h1 className="text-[120px] font-black text-white italic uppercase leading-none tracking-tighter">
          Gym <span className="text-orange-500">Ignite</span>
        </h1>
        <p className="text-4xl text-slate-500 font-bold uppercase tracking-[12px]">
          Status de {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
        </p>
      </div>

      {/* Banner de Status Integrado - Sem sobreposição */}
      <div className="w-full">
        {treinouHoje ? (
          <div className="bg-orange-500 py-8 px-12 rounded-[40px] shadow-[0_20px_60px_rgba(249,115,22,0.3)] border-4 border-white/10 flex items-center justify-center gap-6">
            <CheckCircle2 className="w-16 h-16 text-white" />
            <p className="text-6xl font-black uppercase italic text-white tracking-widest">Hoje Tá Pago 🔥</p>
          </div>
        ) : (
          <div className="bg-slate-900 py-8 px-12 rounded-[40px] border-4 border-slate-800 flex items-center justify-center gap-6">
            <Shield className="w-16 h-16 text-slate-700" />
            <p className="text-6xl font-black uppercase italic text-slate-600 tracking-widest">Foco na Meta 🛡️</p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-orange-500/10 via-slate-900 to-slate-950 p-16 rounded-[100px] border-4 border-orange-500/20 text-center space-y-4">
        <p className="text-slate-500 text-4xl font-black uppercase tracking-[10px]">Nível Atual</p>
        <p className="text-[110px] leading-tight font-black text-white uppercase italic">
          {rank.emoji} {rank.nome}
        </p>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-slate-900/50 p-12 rounded-[60px] border-4 border-slate-800/50">
            <p className="text-slate-500 text-3xl font-bold uppercase mb-4 tracking-widest text-left">Anual</p>
            <p className="text-9xl font-black text-white text-left">{treinosCount}<span className="text-slate-700 text-4xl ml-2">/{metaAnual}</span></p>
          </div>
          <div className="bg-slate-900/50 p-12 rounded-[60px] border-4 border-slate-800/50">
            <p className="text-slate-500 text-3xl font-bold uppercase mb-4 tracking-widest text-left">Consistência</p>
            <p className="text-9xl font-black text-blue-500 text-left">{consistencia}%</p>
          </div>
        </div>

        <div className="bg-slate-900/50 p-12 rounded-[60px] border-4 border-slate-800/50 flex justify-between items-center">
          <div>
            <p className="text-slate-500 text-3xl font-bold uppercase mb-2 tracking-widest text-left">Meta do Mês</p>
            <p className="text-9xl font-black text-white text-left">{treinosNoMes} / {metaMensalEstimada}</p>
          </div>
          {bateuMetaMensal && <Flame className="w-24 h-24 text-orange-500 fill-orange-500" />}
        </div>
      </div>

      <div className="flex justify-between items-center border-t-8 border-slate-900 pt-16">
        <p className="text-6xl text-slate-400 font-black italic uppercase tracking-tighter">A chama nunca apaga</p>
        <div className="bg-orange-600 p-8 rounded-[40px] shadow-2xl">
          <Flame className="w-20 h-20 text-white fill-white" />
        </div>
      </div>
    </div>
  );
}