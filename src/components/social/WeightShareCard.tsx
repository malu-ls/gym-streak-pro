"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Scale, Plus, History, Trash2, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { toPng } from 'html-to-image';
import BMICalculator from './BMICalculator';
import WeightShareCard from '@/components/social/WeightShareCard';

interface RegistroPeso {
  id: string;
  peso: number;
  data: string;
}

export default function WeightTracker() {
  const [registros, setRegistros] = useState<RegistroPeso[]>([]);
  const [novoPeso, setNovoPeso] = useState('');
  const [isCarregado, setIsCarregado] = useState(false);

  // 1. Carregamento e Persistência
  useEffect(() => {
    const saved = localStorage.getItem('gym-ignite-peso');
    if (saved) setRegistros(JSON.parse(saved));
    setIsCarregado(true);
  }, []);

  useEffect(() => {
    if (isCarregado) {
      localStorage.setItem('gym-ignite-peso', JSON.stringify(registros));
    }
  }, [registros, isCarregado]);

  // 2. Cálculos para o Card de Compartilhamento
  const shareCardData = useMemo(() => {
    if (registros.length === 0) return {};

    // Ordenar por data para garantir que o inicial seja o primeiro cronológico
    const ordenados = [...registros].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const inicial = ordenados[0];
    const atual = ordenados[ordenados.length - 1];
    const perdaTotal = inicial.peso - atual.peso;

    // Comparação criativa (ex: pacotes de arroz)
    const pacotesArroz = (Math.abs(perdaTotal) / 5).toFixed(1);
    const representacao = Math.abs(perdaTotal) >= 1
      ? `Isso equivale a aprox. ${pacotesArroz} pacotes de arroz!`
      : "O primeiro passo para uma grande mudança!";

    return {
      initialWeight: inicial.peso,
      currentWeight: atual.peso,
      initialDate: inicial.data,
      totalLoss: perdaTotal,
      progressPercentage: representacao,
      motivationalMessage: "A disciplina é a ponte entre metas e realizações. Vamos pra cima! 🔥"
    };
  }, [registros]);

  // 3. Ações
  const adicionarPeso = () => {
    const pesoNum = parseFloat(novoPeso.replace(',', '.'));
    if (isNaN(pesoNum) || pesoNum <= 0) return;

    const novo = {
      id: Date.now().toString(),
      peso: pesoNum,
      data: new Date().toISOString()
    };

    setRegistros(prev => [...prev, novo].sort((a, b) =>
      new Date(a.data).getTime() - new Date(b.data).getTime()
    ));
    setNovoPeso('');
  };

  const removerPeso = (id: string) => {
    setRegistros(prev => prev.filter(r => r.id !== id));
  };

  const compartilharProgressoPeso = async () => {
    const node = document.getElementById('weight-share-card');
    if (!node) return;

    node.style.display = 'flex';
    node.style.left = '0';

    try {
      const dataUrl = await toPng(node, {
        quality: 0.95,
        backgroundColor: '#020617',
        width: 1080,
        height: 1920
      });
      node.style.left = '-2000px';

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const arquivo = new File([blob], 'evolucao-ignite.png', { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          files: [arquivo],
          title: 'Minha Evolução - Gym Ignite'
        });
      }
    } catch (e) {
      node.style.left = '-2000px';
      console.error("Erro ao compartilhar:", e);
    }
  };

  const chartData = useMemo(() => {
    return registros.map(r => ({
      data: format(new Date(r.data), 'dd/MM'),
      peso: r.peso
    }));
  }, [registros]);

  if (!isCarregado) return null;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700">

      {/* Calculadora de IMC */}
      <BMICalculator />

      {/* Input de Registro */}
      <section className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block ml-2">Registrar Peso (kg)</label>
            <input
              type="number"
              step="0.1"
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

      {/* BOTÃO DE COMPARTILHAMENTO - Visível apenas com 2+ registros */}
      {registros.length >= 2 && (
        <button
          onClick={compartilharProgressoPeso}
          className="w-full bg-gradient-to-r from-red-600 to-orange-600 font-black py-5 rounded-2xl shadow-lg flex items-center justify-center gap-3 uppercase text-xs tracking-widest transition-transform active:scale-95 animate-in slide-in-from-top-2"
        >
          <Share2 className="w-4 h-4" /> Compartilhar Evolução
        </button>
      )}

      {/* Gráfico */}
      {registros.length >= 2 ? (
        <section className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 h-80">
          <h3 className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Evolução de Peso</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="data" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }}
                itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
              />
              <Line
                type="monotone"
                dataKey="peso"
                stroke="#f97316"
                strokeWidth={4}
                dot={{ fill: '#f97316', r: 5 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </section>
      ) : (
        <div className="p-12 text-center bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Registre 2 pesos para ver o gráfico</p>
        </div>
      )}

      {/* Histórico */}
      <section className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
          <div className="flex items-center gap-2 text-slate-500">
            <History className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase">Histórico Recente</span>
          </div>
        </div>
        <div className="divide-y divide-slate-800 max-h-60 overflow-y-auto">
          {registros.slice().reverse().map(r => (
            <div key={r.id} className="p-4 flex justify-between items-center group">
              <div>
                <p className="text-xl font-black text-white">{r.peso} kg</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold">
                  {format(new Date(r.data), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              </div>
              <button onClick={() => removerPeso(r.id)} className="p-2 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Card de Compartilhamento Oculto */}
      <WeightShareCard {...shareCardData} />
    </div>
  );
}