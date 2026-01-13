"use client";

import React, { useState, useEffect } from 'react';
import { Flame, Calendar, Trophy, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import MonthlyCalendar from '@/components/MonthlyCalendar';

interface Treino {
  id: string;
  data: string;
  hora: number;
}

export default function GymTracker() {
  // --- Estados ---
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [metaSemanal, setMetaSemanal] = useState(4);
  const [metaAnual, setMetaAnual] = useState(200);
  const [isEditingMetas, setIsEditingMetas] = useState(false);
  const [isCarregado, setIsCarregado] = useState(false);
  const [feriados, setFeriados] = useState<{ date: string }[]>([]);

  // --- Efeito: Carregamento Inicial ---
  useEffect(() => {
    const savedTreinos = localStorage.getItem('gym-pro-data');
    const savedMetaS = localStorage.getItem('gym-meta-semanal');
    const savedMetaA = localStorage.getItem('gym-meta-anual');

    if (savedTreinos) setTreinos(JSON.parse(savedTreinos));
    if (savedMetaS) setMetaSemanal(Number(savedMetaS));
    if (savedMetaA) setMetaAnual(Number(savedMetaA));

    fetch(`https://brasilapi.com.br/api/feriados/v1/${new Date().getFullYear()}`)
      .then(res => res.json())
      .then(data => setFeriados(data))
      .catch(() => console.warn("Modo offline: Feriados não carregados."));

    setIsCarregado(true);
  }, []);

  // --- Efeito: Sincronização LocalStorage ---
  useEffect(() => {
    if (isCarregado) {
      localStorage.setItem('gym-pro-data', JSON.stringify(treinos));
      localStorage.setItem('gym-meta-semanal', metaSemanal.toString());
      localStorage.setItem('gym-meta-anual', metaAnual.toString());
    }
  }, [treinos, metaSemanal, metaAnual, isCarregado]);

  // --- Lógica de Negócio ---
  const atualizarMetaSemanal = (valor: number) => {
    setMetaSemanal(valor);
    setMetaAnual(valor * 52);
  };

  const getTreinosSemanaAtual = (lista: Treino[]) => {
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const diff = hoje.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    const segundaFeira = new Date(hoje.setDate(diff));
    segundaFeira.setHours(0, 0, 0, 0);
    return lista.filter(t => new Date(t.data + "T00:00:00") >= segundaFeira).length;
  };

  const adicionarTreino = () => {
    if (treinos.some(t => t.data === dataSelecionada)) {
      alert("Já existe um treino registrado nesta data!");
      return;
    }

    const registro: Treino = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(),
      data: dataSelecionada,
      hora: new Date().getHours()
    };

    const novaLista = [registro, ...treinos];
    setTreinos(novaLista);

    if (getTreinosSemanaAtual(novaLista) === metaSemanal) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  };

  const removerTreino = (id: string) => {
    setTreinos(prev => prev.filter(t => t.id !== id));
  };

  // --- Cálculos de Predição ---
  const stats = (() => {
    if (treinos.length === 0) return null;
    const hoje = new Date();
    const inicioAno = new Date(hoje.getFullYear(), 0, 1);
    const diasDecorridos = Math.max(1, Math.floor((hoje.getTime() - inicioAno.getTime()) / 86400000));
    const ritmoPorDia = treinos.length / diasDecorridos;
    const treinosFaltantes = metaAnual - treinos.length;

    let dataEstimadaStr = "Meta Batida! 🏆";
    if (treinosFaltantes > 0 && ritmoPorDia > 0) {
      const dataEst = new Date();
      dataEst.setDate(hoje.getDate() + Math.ceil(treinosFaltantes / ritmoPorDia));
      dataEstimadaStr = dataEst.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }

    const consistencia = Math.min(100, Math.round((treinos.length / ((diasDecorridos / 7) * metaSemanal)) * 100));
    return { dataEstimadaStr, diasAtrasado: Math.floor((metaAnual / 365) * diasDecorridos) - treinos.length, consistencia };
  })();

  // --- Lógica de Badges ---
  const badges = (() => {
    const ordenados = [...treinos].sort((a, b) => a.data.localeCompare(b.data));
    let maiorHiato = 0;
    for (let i = 1; i < ordenados.length; i++) {
      const diff = (new Date(ordenados[i].data).getTime() - new Date(ordenados[i - 1].data).getTime()) / 86400000;
      maiorHiato = Math.max(maiorHiato, diff);
    }

    return [
      { id: 1, t: 'Madrugador', e: '🌅', c: treinos.filter(t => t.hora < 8).length >= 5 },
      { id: 2, t: 'Inabalável', e: '🛡️', c: treinos.some(t => feriados.some(f => f.date === t.data)) },
      { id: 3, t: 'Fênix', e: '🐦‍🔥', c: maiorHiato > 10 }
    ];
  })();

  const treinosSemanaCount = getTreinosSemanaAtual(treinos);

  if (!isCarregado) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-bold animate-pulse">
      Sincronizando Dashboard...
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/50 p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div>
            <h1 className="text-3xl font-black italic uppercase italic">Gym <span className="text-orange-500">Streak</span></h1>
            <p className="text-slate-400 font-medium italic">
              {treinosSemanaCount >= metaSemanal ? "🔥 OFENSIVA ATIVA! Meta concluída." : `Faltam ${metaSemanal - treinosSemanaCount} treinos para a meta semanal.`}
            </p>
          </div>
          <div className="flex flex-col items-center bg-slate-800/50 px-6 py-3 rounded-2xl border border-orange-500/20 min-w-[120px]">
            <Flame className={`w-8 h-8 ${treinosSemanaCount >= metaSemanal ? 'text-orange-500 fill-orange-500' : 'text-slate-600'}`} />
            <span className="text-xl font-bold mt-1">{Math.floor(treinos.length / metaSemanal)}</span>
            <span className="text-[10px] uppercase font-bold text-slate-500">Semanas</span>
          </div>
        </header>

        {/* Configurações de Metas */}
        <section className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-lg">
          <button onClick={() => setIsEditingMetas(!isEditingMetas)} className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 hover:text-orange-500 transition-colors">
            <Trophy className="w-4 h-4" /> {isEditingMetas ? "Salvar e Fechar" : "Ajustar Minhas Metas"}
          </button>
          {isEditingMetas && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 animate-in fade-in duration-500">
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider">Meta Semanal (Dias)</label>
                <div className="relative">
                  <input type="number" value={metaSemanal} onChange={(e) => atualizarMetaSemanal(Number(e.target.value))} className="w-full bg-slate-800/50 p-4 rounded-2xl border border-slate-700 outline-none focus:border-orange-500 text-lg font-bold" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-[10px] font-black uppercase">dias/sem</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider">Meta Anual Total</label>
                <div className="relative">
                  <input type="number" value={metaAnual} onChange={(e) => setMetaAnual(Number(e.target.value))} className="w-full bg-slate-800/50 p-4 rounded-2xl border border-slate-700 outline-none focus:border-orange-500 text-lg font-bold" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-[10px] font-black uppercase">dias/ano</span>
                </div>
              </div>
            </div>
          )}
        </section>

        <MonthlyCalendar treinos={treinos} />

        {/* Predições Inteligentes */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <p className="text-slate-500 text-[10px] font-bold uppercase mb-2">Consistência</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-blue-400">{stats.consistencia}%</span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${stats.consistencia}%` }} />
                </div>
              </div>
            </div>
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 text-center">
              <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Previsão Conclusão</p>
              <p className="text-lg font-bold text-slate-100 uppercase tracking-tighter">{stats.dataEstimadaStr}</p>
            </div>
            <div className={`p-5 rounded-3xl border text-center ${stats.diasAtrasado > 0 ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-green-500/5 border-green-500/20 text-green-400'}`}>
              <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Status Ritmo</p>
              <p className="text-xs font-bold uppercase">{stats.diasAtrasado > 0 ? `⚠️ ${stats.diasAtrasado} dias atrás` : '✅ Ritmo Ideal'}</p>
            </div>
          </div>
        )}

        {/* Ações e Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
            <h3 className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Registrar Treino</h3>
            <div className="flex gap-2">
              <input type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} className="bg-slate-800 p-3 rounded-xl flex-1 border border-slate-700 text-xs font-bold outline-none focus:border-orange-500" />
              <button onClick={adicionarTreino} className="bg-orange-500 hover:bg-orange-600 px-6 rounded-xl font-black text-xs transition-all active:scale-95">CHECK!</button>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 grid grid-cols-3 gap-2">
            {badges.map(b => (
              <div key={b.id} title={b.d} className={`p-2 rounded-xl border text-center transition-all ${b.c ? 'bg-yellow-500/10 border-yellow-500/40 opacity-100' : 'opacity-20 grayscale'}`}>
                <div className="text-xl">{b.e}</div>
                <div className="text-[8px] font-black uppercase mt-1 leading-tight text-slate-400">{b.t}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Histórico Recente */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
          <div className="p-4 bg-slate-800/50 border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
            <span>Histórico de Suor</span>
            <span>Total: {treinos.length}</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {treinos.map(t => (
              <div key={t.id} className="p-4 flex justify-between items-center border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                <span className="text-sm font-medium flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {new Date(t.data + "T00:00:00").toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                </span>
                <button onClick={() => removerTreino(t.id)} className="text-slate-600 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}