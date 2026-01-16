interface Props {
  consistencia: number;
  dataEst: string;     // Agora obrigatório
  diasAtrasado: number; // Agora obrigatório
}

export default function StatsGrid({ consistencia, dataEst, diasAtrasado }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Bloco Consistência */}
      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800">
        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Consistência</p>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-blue-400">{consistencia}%</span>
          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${consistencia}%` }} />
          </div>
        </div>
      </div>

      {/* Bloco Previsão - Agora funcional */}
      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex flex-col justify-center text-center">
        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Previsão Conclusão</p>
        <p className="text-lg font-bold text-slate-100 uppercase tracking-tighter">
          {dataEst || 'Calculando...'}
        </p>
      </div>

      {/* Bloco Ritmo */}
      <div className={`p-5 rounded-3xl border flex flex-col justify-center text-center ${diasAtrasado > 0 ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-green-500/5 border-green-500/20 text-green-400'}`}>
        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Status Ritmo</p>
        <p className="text-xs font-bold uppercase">
          {diasAtrasado > 0 ? `⚠️ ${diasAtrasado} dias atrás` : '✅ No ritmo!'}
        </p>
      </div>
    </div>
  );
}