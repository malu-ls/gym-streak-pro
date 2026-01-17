"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Scale, Plus, Loader2, History, TrendingUp, Share2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ShareWeightModal from '@/components/social/ShareWeightModal';

export default function WeightTracker() {
  const [pesoInput, setPesoInput] = useState('');
  const [historico, setHistorico] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSalvando, setIsSalvando] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPesos();
  }, []);

  async function fetchPesos() {
    try {
      const res = await fetch('/api/pesos');
      const data = await res.json();
      if (Array.isArray(data)) setHistorico(data);
    } catch (e) {
      console.error("Erro ao carregar histórico");
    } finally {
      setIsLoading(false);
    }
  }

  // --- LÓGICA DE PESO ---
  // Peso inicial: o registro mais antigo (último do array ordenado por data)
  // Peso atual: o registro mais recente (primeiro do array)
  const pesoAtual = useMemo(() => (historico.length > 0 ? Number(historico[0].peso) : 0), [historico]);
  const pesoInicial = useMemo(() => (historico.length > 0 ? Number(historico[historico.length - 1].peso) : 0), [historico]);
  const perdaTotal = useMemo(() => Math.max(0, pesoInicial - pesoAtual), [pesoInicial, pesoAtual]);

  const dadosGrafico = useMemo(() => {
    return [...historico]
      .reverse()
      .map(item => ({
        peso: Number(item.peso),
        data: new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      }));
  }, [historico]);

  const handleSalvar = async () => {
    if (!pesoInput || isSalvando) return;
    setIsSalvando(true);
    try {
      const res = await fetch('/api/pesos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peso: pesoInput })
      });
      if (res.ok) {
        setPesoInput('');
        await fetchPesos();
      }
    } catch (e) {
      console.error("Erro ao salvar");
    } finally {
      setIsSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* GRÁFICO DE EVOLUÇÃO */}
      {historico.length > 1 && (
        <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 backdrop-blur-xl h-[300px] w-full animate-in fade-in duration-700">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Curva de Peso</span>
            </div>
            {perdaTotal > 0 && (
              <span className="bg-orange-500/10 text-orange-500 text-[10px] font-black px-3 py-1 rounded-full border border-orange-500/20">
                -{perdaTotal.toFixed(1)} KG
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={dadosGrafico}>
              <defs>
                <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
              <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: '900' }} dy={10} />
              <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '12px' }}
                itemStyle={{ color: '#f97316', fontWeight: '900' }}
                labelStyle={{ color: '#64748b', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="peso" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorPeso)" animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* CARD DE INPUT */}
      <div className="bg-slate-900/50 p-8 rounded-[40px] border border-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-orange-500/20 rounded-2xl">
            <Scale className="text-orange-500 w-6 h-6" />
          </div>
          <h2 className="text-xl font-black uppercase text-white tracking-tight italic">Registrar Peso</h2>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative group">
            <input
              type="text"
              inputMode="decimal"
              value={pesoInput}
              onChange={(e) => setPesoInput(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="00.0"
              className="w-full bg-slate-800/50 border border-white/10 rounded-3xl py-6 px-8 text-2xl font-black text-white outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-700"
            />
            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-600 font-black uppercase text-xs tracking-widest">KG</span>
          </div>

          <button
            onClick={handleSalvar}
            disabled={isSalvando || !pesoInput}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-30 disabled:grayscale text-white px-8 rounded-3xl transition-all active:scale-95 shadow-lg shadow-orange-500/20"
          >
            {isSalvando ? <Loader2 className="animate-spin" /> : <Plus className="w-8 h-8" strokeWidth={3} />}
          </button>
        </div>
      </div>

      {/* BOTÃO DE COMPARTILHAR ARTE */}
      {historico.length >= 2 && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-slate-800 hover:bg-slate-700 p-6 rounded-[32px] border border-white/5 flex items-center justify-center gap-3 transition-all active:scale-95 group"
        >
          <Share2 className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-black uppercase text-white tracking-widest">Exportar Evolução Corporal</span>
        </button>
      )}

      {/* LISTA DE HISTÓRICO */}
      <div className="bg-slate-900/50 p-8 rounded-[40px] border border-white/5">
        <div className="flex items-center gap-3 mb-8 text-slate-500">
          <History size={14} className="text-orange-500/50" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Histórico de Evolução</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-orange-500 w-10 h-10" /></div>
        ) : (
          <div className="space-y-4">
            {historico.map((item) => (
              <div key={item.id} className="group flex justify-between items-center p-6 bg-white/[0.02] hover:bg-white/[0.05] rounded-[28px] border border-white/5 transition-all">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white italic tracking-tighter">
                    {Number(item.peso).toFixed(1)} <small className="text-xs text-slate-600 not-italic uppercase tracking-widest ml-1">kg</small>
                  </span>
                </div>
                <div className="text-right flex items-center gap-6">
                  <div>
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-wider">
                      {new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-slate-600 font-bold text-[9px] uppercase tracking-tighter">
                      {new Date(item.data).toLocaleDateString('pt-BR', { year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {historico.length === 0 && (
              <p className="text-center py-12 text-slate-600 font-black uppercase text-[10px] tracking-widest italic">Nenhum registro encontrado</p>
            )}
          </div>
        )}
      </div>

      {/* MODAL SOCIAL */}
      {isModalOpen && (
        <ShareWeightModal
          pesoInicial={pesoInicial}
          pesoAtual={pesoAtual}
          perdaTotal={perdaTotal}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}