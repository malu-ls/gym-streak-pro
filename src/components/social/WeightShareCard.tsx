import React from 'react';
import { TrendingDown, Goal } from 'lucide-react';
import { format } from 'date-fns';

interface WeightShareCardProps {
  initialWeight?: number;
  currentWeight?: number;
  initialDate?: string;
  totalLoss?: number;
  progressPercentage?: string;
  motivationalMessage?: string;
}

export default function WeightShareCard({
  initialWeight, currentWeight, initialDate, totalLoss, progressPercentage, motivationalMessage
}: WeightShareCardProps) {
  return (
    <div
      id="weight-share-card"
      className="fixed w-[1080px] h-[1920px] bg-slate-950 p-24 flex flex-col justify-between text-white"
      style={{ left: '-2000px', top: 0, zIndex: -1, backgroundColor: '#020617' }}
    >
      <div className="text-center space-y-6">
        <h1 className="text-[120px] font-black italic uppercase leading-none">
          Minha <span className="text-orange-500">Evolução</span>
        </h1>
        <p className="text-4xl text-slate-500 font-bold uppercase tracking-[12px]">Gym Ignite</p>
      </div>

      <div className="space-y-12">
        <div className="bg-slate-900/50 p-12 rounded-[60px] border-4 border-slate-800/50">
          <p className="text-slate-500 text-3xl font-bold uppercase mb-4">Peso Inicial</p>
          <p className="text-9xl font-black text-orange-400">{initialWeight || 0} kg</p>
        </div>
        <div className="bg-slate-900/50 p-12 rounded-[60px] border-4 border-slate-800/50">
          <p className="text-slate-500 text-3xl font-bold uppercase mb-4">Peso Atual</p>
          <p className="text-9xl font-black text-white">{currentWeight || 0} kg</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-red-600/10 p-12 rounded-[60px] border-4 border-red-600/20 text-center">
          <TrendingDown className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-8xl font-black">{totalLoss?.toFixed(1) || "0.0"} kg</p>
        </div>
        <div className="bg-blue-600/10 p-12 rounded-[60px] border-4 border-blue-600/20 text-center">
          <Goal className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <p className="text-5xl font-black leading-tight">{progressPercentage || "Iniciando"}</p>
        </div>
      </div>

      <div className="bg-orange-500/10 p-12 rounded-[60px] border-4 border-orange-500/20 text-center">
        <p className="text-4xl font-black italic text-orange-200">"{motivationalMessage}"</p>
      </div>
    </div>
  );
}