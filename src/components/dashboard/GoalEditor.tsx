import React from 'react';
import { Trophy } from 'lucide-react';

interface Props {
  metaSemanal: number;
  metaAnual: number;
  onUpdateMeta: (valor: number) => void;
  isEditing: boolean;
  setIsEditing: (valor: boolean) => void;
}

export default function GoalEditor({ metaSemanal, metaAnual, onUpdateMeta, isEditing, setIsEditing }: Props) {
  return (
    <section className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
      <button
        onClick={() => setIsEditing(!isEditing)}
        className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest"
      >
        <Trophy className="w-3 h-3" /> {isEditing ? "Salvar Metas" : "Ajustar Objetivos"}
      </button>

      {isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 animate-in fade-in duration-300">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-bold">Meta Semanal (Dias)</label>
            <input
              type="number"
              min="1"
              max="7"
              value={metaSemanal}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1 && val <= 7) onUpdateMeta(val);
              }}
              className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 outline-none focus:border-orange-500 font-bold text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-bold">Meta Anual Automática</label>
            <div className="w-full bg-slate-800/50 p-3 rounded-xl border border-slate-700 font-bold text-slate-500 cursor-not-allowed">
              {metaAnual} dias/ano
            </div>
          </div>
        </div>
      )}
    </section>
  );
}