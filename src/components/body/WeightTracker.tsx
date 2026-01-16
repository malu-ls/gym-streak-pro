"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Scale, Plus, History, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import BMICalculator from './BMICalculator';

interface RegistroPeso {
  id: string;
  peso: number;
  data: string; // ISO String
}

export default function WeightTracker() {
  const [registros, setRegistros] = useState<RegistroPeso[]>([]);
  const [novoPeso, setNovoPeso] = useState('');
  const [isCarregado, setIsCarregado] = useState(false);

  // 1. Carregamento Inicial
  useEffect(() => {
    const saved = localStorage.getItem('gym-ignite-peso');
    if (saved) setRegistros(JSON.parse(saved));
    setIsCarregado(true);
  }, []);

  // 2. Persistência
  useEffect(() => {
    if (isCarregado) {
      localStorage.setItem('gym-ignite-peso', JSON.stringify(registros));
    }
  }, [registros, isCarregado]);

  const adicionarPeso = () => {
    const pesoNum = parseFloat(novoPeso.replace(',', '.'));
    if (isNaN(pesoNum) || pesoNum <= 0) return;

    const novo = {
      id: Date.now().toString(),
      peso: pesoNum,
      data: new Date().toISOString()
    };

    const listaAtualizada = [...registros, novo].sort((a, b) =>
      new Date(a.data).getTime() - new Date(b.data).getTime()
    );

    setRegistros(listaAtualizada);
    setNovoPeso('');
  };

  const removerPeso = (id: string) => {
    setRegistros(prev => prev.filter(r => r.id !== id));
  };

  // Prepara dados para o gráfico
  const chartData = useMemo(() => {
    return registros.map(r => ({
      data: format(new Date(r.data), 'dd/MM'),
      peso: r.peso
    }));
  }, [registros]);

  if (!isCarregado) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">

      {/* 1. Calculadora de IMC com Aviso de Nutricionista */}
      <BMICalculator />

      {/* 2. Registro de Novo Peso */}
      <section className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block ml-2">
              Peso Atual (kg)
            </label>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={novoPeso}
              onChange={(e) => setNovoPeso(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && adicionarPeso()}
              placeholder="00.0"
              className="w-full bg-slate-800 p-4 rounded-2xl border border-slate-700 outline-none focus:border-orange-500 text-2xl font-black text-white"
            />
          </div>
          <button
            onClick={adicionarPeso}
            className="p-5 bg-orange-500 rounded-2xl hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>
      </section>

      {/* 3. Gráfico de Evolução */}
      {registros.length > 1 ? (
        <section className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 h-80">
          <h3 className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">
            Gráfico de Evolução
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="data"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                hide
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }}
                itemStyle={{ color: '#f97316', fontWeight: 'bold', fontSize: '14px' }}
                labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '10px', fontWeight: 'bold' }}
              />
              <Line
                type="monotone"
                dataKey="peso"
                stroke="#f97316"
                strokeWidth={4}
                dot={{ fill: '#f97316', stroke: '#020617', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 8, strokeWidth: 0 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </section>
      ) : (
        <div className="p-12 text-center bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
          <Scale className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            Registre pelo menos 2 pesos para gerar o gráfico
          </p>
        </div>
      )}

      {/* 4. Histórico de Registros */}
      <section className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase">Histórico</span>
          </div>
          <span className="text-[10px] font-black text-slate-600 bg-slate-800 px-2 py-1 rounded-md">
            {registros.length} registros
          </span>
        </div>
        <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto scrollbar-hide">
          {registros.length > 0 ? (
            registros.slice().reverse().map(r => (
              <div key={r.id} className="p-4 flex justify-between items-center hover:bg-slate-800/30 transition-colors">
                <div>
                  <p className="text-xl font-black text-white">{r.peso} <span className="text-xs text-slate-500 font-medium">kg</span></p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                    {format(new Date(r.data), "dd MMM yyyy 'às' HH:mm")}
                  </p>
                </div>
                <button
                  onClick={() => removerPeso(r.id)}
                  className="p-2 text-slate-700 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="p-8 text-center text-slate-600 text-[10px] font-bold uppercase">Nenhum peso registrado ainda.</p>
          )}
        </div>
      </section>
    </div>
  );
}