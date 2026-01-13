"use client";

import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Trash2, CheckCircle2, Share2, Bell } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import MonthlyCalendar from '@/components/MonthlyCalendar';

interface Treino {
  id: string;
  data: string;
  hora: number;
}

export default function GymTracker() {
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [metaSemanal, setMetaSemanal] = useState(4);
  const [metaAnual, setMetaAnual] = useState(200);
  const [isEditingMetas, setIsEditingMetas] = useState(false);
  const [isCarregado, setIsCarregado] = useState(false);
  const [feriados, setFeriados] = useState<{ date: string }[]>([]);

  // 1. Carregamento e Persistência
  useEffect(() => {
    const savedTreinos = localStorage.getItem('gym-pro-data');
    const savedMetaS = localStorage.getItem('gym-meta-semanal');
    const savedMetaA = localStorage.getItem('gym-meta-anual');

    if (savedTreinos) setTreinos(JSON.parse(savedTreinos));
    if (savedMetaS) setMetaSemanal(Number(savedMetaS));
    if (savedMetaA) setMetaAnual(Number(savedMetaA));

    fetch(`https://brasilapi.com.br/api/feriados/v1/${new Date().getFullYear()}`)
      .then(res => res.json()).then(data => setFeriados(data)).catch(() => { });

    setIsCarregado(true);
  }, []);

  useEffect(() => {
    if (isCarregado) {
      localStorage.setItem('gym-pro-data', JSON.stringify(treinos));
      localStorage.setItem('gym-meta-semanal', metaSemanal.toString());
      localStorage.setItem('gym-meta-anual', metaAnual.toString());
    }
  }, [treinos, metaSemanal, metaAnual, isCarregado]);

  // 2. Utilitários
  const gerarIdSeguro = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const solicitarNotificacao = async () => {
    if (!("Notification" in window)) return;
    const permissao = await Notification.requestPermission();
    if (permissao === 'granted') {
      new Notification("Gym Streak 🔥", { body: "Lembretes diários ativados!" });
    }
  };

  const getRank = (total: number) => {
    if (total <= 10) return { nome: "Frango", emoji: "🐣" };
    if (total <= 50) return { nome: "Em Construção", emoji: "🏋️‍♂️" };
    if (total <= 100) return { nome: "Assíduo", emoji: "🔥" };
    if (total <= 200) return { nome: "Gladiador", emoji: "🛡️" };
    return { nome: "Lenda Urbana", emoji: "🏆" };
  };

  const rankAtual = getRank(treinos.length);

  const exportarRelatorioMensal = async () => {
    const node = document.getElementById('resumo-mensal-card');
    if (!node) return;

    try {
      node.style.display = 'flex';
      node.style.left = '0';

      await new Promise(resolve => setTimeout(resolve, 150));

      const dataUrl = await toPng(node, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: '#020617'
      });

      node.style.left = '-2000px';

      const link = document.createElement('a');
      link.download = `gym-streak-rank.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erro ao gerar imagem:", err);
    }
  };

  // Lógica para o progresso mensal (Ex: 15 treinos de 20 previstos no mês)
  const getProgressoMensal = () => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const treinosNoMes = treinos.filter(t => {
      const d = new Date(t.data + "T00:00:00");
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    }).length;

    // Calculamos uma meta mensal proporcional à meta semanal (MetaSemanal * 4 semanas)
    const metaMensalEstimada = metaSemanal * 4;
    const bateuMetaMensal = treinosNoMes >= metaMensalEstimada;

    return { treinosNoMes, metaMensalEstimada, bateuMetaMensal };
  };

  const progMensal = getProgressoMensal();
  // 3. Lógica de Treinos
  const getTreinosSemanaAtual = (lista: Treino[]) => {
    const hoje = new Date();
    const seg = new Date(hoje.setDate(hoje.getDate() - hoje.getDay() + (hoje.getDay() === 0 ? -6 : 1)));
    seg.setHours(0, 0, 0, 0);
    return lista.filter(t => new Date(t.data + "T00:00:00") >= seg).length;
  };

  const toggleTreino = (dataIso: string) => {
    setTreinos(prev => {
      const existe = prev.some(t => t.data === dataIso);
      if (existe) return prev.filter(t => t.data !== dataIso);

      const novo = { id: gerarIdSeguro(), data: dataIso, hora: 12 };
      const novaLista = [novo, ...prev];

      // Confete ao atingir meta da semana
      if (getTreinosSemanaAtual(novaLista) === metaSemanal) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      } else {
        // Feedback visual simples para cliques individuais
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
      }
      return novaLista;
    });
  };

  const removerTreino = (id: string) => setTreinos(prev => prev.filter(t => t.id !== id));

  // 4. Cálculos e Badges
  const stats = (() => {
    if (treinos.length === 0) return null;
    const hoje = new Date();
    const diasDec = Math.max(1, Math.floor((hoje.getTime() - new Date(hoje.getFullYear(), 0, 1).getTime()) / 86400000));
    const ritmo = treinos.length / diasDec;
    const faltam = metaAnual - treinos.length;
    let dataEst = "Meta Batida!";
    if (faltam > 0 && ritmo > 0) {
      const d = new Date(); d.setDate(hoje.getDate() + Math.ceil(faltam / ritmo));
      dataEst = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }
    const consistencia = Math.min(100, Math.round((treinos.length / ((diasDec / 7) * metaSemanal)) * 100));
    return { dataEst, diasAtrasado: Math.floor((metaAnual / 365) * diasDec) - treinos.length, consistencia };
  })();

  const badges = (() => {
    const ordenados = [...treinos].sort((a, b) => a.data.localeCompare(b.data));
    let hiato = 0;
    for (let i = 1; i < ordenados.length; i++) {
      hiato = Math.max(hiato, (new Date(ordenados[i].data).getTime() - new Date(ordenados[i - 1].data).getTime()) / 86400000);
    }
    return [
      { id: 1, t: 'Madrugador', e: '🌅', c: treinos.filter(t => t.hora < 8).length >= 5 },
      { id: 2, t: 'Inabalável', e: '🛡️', c: treinos.some(t => feriados.some(f => f.date === t.data)) },
      { id: 3, t: 'Fênix', e: '🐦‍🔥', c: hiato > 10 }
    ];
  })();

  if (!isCarregado) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-bold animate-pulse">Sincronizando...</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex justify-between items-center bg-slate-900/50 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div>
            <h1 className="text-2xl md:text-3xl font-black italic uppercase italic">Gym <span className="text-orange-500">Streak</span></h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">
              {getTreinosSemanaAtual(treinos) >= metaSemanal ? "🚀 Meta batida!" : "Clique no dia para marcar seu treino."}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={solicitarNotificacao} className="p-3 bg-slate-800 rounded-2xl hover:text-orange-500 transition-colors border border-slate-700">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center bg-slate-800/50 px-4 py-2 rounded-2xl border border-orange-500/20">
              <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
              <span className="text-lg font-bold">{Math.floor(treinos.length / metaSemanal)}</span>
            </div>
          </div>
        </header>

        {/* Metas */}
        <section className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
          <button onClick={() => setIsEditingMetas(!isEditingMetas)} className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest">
            <Trophy className="w-3 h-3" /> {isEditingMetas ? "Salvar Metas" : "Ajustar Objetivos"}
          </button>
          {isEditingMetas && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 animate-in fade-in duration-300">
              <div className="space-y-1"><label className="text-[10px] text-slate-400 uppercase font-bold">Semanal (Dias)</label>
                <input type="number" value={metaSemanal} onChange={(e) => setMetaSemanal(Number(e.target.value))} className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 outline-none focus:border-orange-500 font-bold" />
              </div>
              <div className="space-y-1"><label className="text-[10px] text-slate-400 uppercase font-bold">Anual Total</label>
                <input type="number" value={metaAnual} onChange={(e) => setMetaAnual(Number(e.target.value))} className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 outline-none focus:border-orange-500 font-bold" />
              </div>
            </div>
          )}
        </section>

        <MonthlyCalendar treinos={treinos} onToggleTreino={toggleTreino} />

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Consistência</p>
              <div className="flex items-center gap-3"><span className="text-2xl font-black text-blue-400">{stats.consistencia}%</span>
                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${stats.consistencia}%` }} /></div>
              </div>
            </div>
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex flex-col justify-center text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Previsão</p>
              <p className="text-lg font-bold text-slate-100 uppercase tracking-tighter">{stats.dataEst}</p>
            </div>
            <div className={`p-5 rounded-3xl border flex flex-col justify-center text-center ${stats.diasAtrasado > 0 ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-green-500/5 border-green-500/20 text-green-400'}`}>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Ritmo</p>
              <p className="text-xs font-bold uppercase">{stats.diasAtrasado > 0 ? `⚠️ ${stats.diasAtrasado} dias atrás` : '✅ Ritmo Ideal'}</p>
            </div>
          </div>
        )}

        <button onClick={exportarRelatorioMensal} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-black py-5 rounded-2xl shadow-lg flex items-center justify-center gap-3 uppercase text-xs tracking-widest transition-transform active:scale-95">
          <Share2 className="w-4 h-4" /> Compartilhar Evolução
        </button>

        {/* Badges e Histórico */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col justify-center">
            <h3 className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest text-center">Minhas Conquistas</h3>
            <div className="grid grid-cols-3 gap-2">
              {badges.map(b => (
                <div key={b.id} className={`p-3 rounded-xl border text-center transition-all ${b.c ? 'bg-yellow-500/10 border-yellow-500/40' : 'opacity-20 grayscale'}`}>
                  <div className="text-2xl">{b.e}</div>
                  <div className="text-[8px] font-black uppercase mt-1 text-slate-400 leading-tight">{b.t}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden text-sm">
            <div className="p-4 bg-slate-800/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase flex justify-between">
              <span>Histórico Recente</span>
              <span>{treinos.length} Treinos</span>
            </div>
            <div className="max-h-60 overflow-y-auto scrollbar-hide">
              {treinos.length === 0 ? (
                <p className="p-8 text-center text-slate-600 italic">Nenhum suor registrado ainda.</p>
              ) : (
                treinos.map(t => (
                  <div key={t.id} className="p-4 flex justify-between items-center border-b border-slate-800/30 hover:bg-slate-800/20">
                    <span className="flex items-center gap-3 font-medium text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      {new Date(t.data + "T00:00:00").toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </span>
                    <button onClick={() => removerTreino(t.id)} className="text-slate-600 hover:text-red-500 p-1 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CARD INSTAGRAM (VERSÃO RANK + CLEAN) */}
      <div
        id="resumo-mensal-card"
        className="fixed w-[1080px] h-[1920px] bg-slate-950 p-24 flex flex-col justify-between"
        style={{ left: '-2000px', top: 0, zIndex: -1, backgroundColor: '#020617' }}
      >
        {/* Header */}
        <div className="space-y-6">
          <h1 className="text-[120px] font-black text-white italic uppercase leading-none tracking-tighter">
            Gym <span className="text-orange-500">Streak</span>
          </h1>
          <p className="text-4xl text-slate-500 font-bold uppercase tracking-[12px]">
            Status de {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
          </p>
        </div>

        {/* Rank Central */}
        <div className="bg-gradient-to-br from-orange-500/20 to-slate-900 p-16 rounded-[100px] border-4 border-orange-500/30 text-center space-y-4">
          <p className="text-slate-400 text-4xl font-black uppercase tracking-widest">Nível Atual</p>
          <p className="text-[120px] leading-tight font-black text-white uppercase italic">
            {rankAtual.emoji} {rankAtual.nome}
          </p>
        </div>

        {/* Estatísticas */}
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-slate-900/80 p-12 rounded-[60px] border-4 border-slate-800">
              <p className="text-slate-500 text-3xl font-bold uppercase mb-4">Anual</p>
              <p className="text-8xl font-black text-white">{treinos.length}<span className="text-slate-600 text-4xl ml-2">/{metaAnual}</span></p>
            </div>
            <div className="bg-slate-900/80 p-12 rounded-[60px] border-4 border-slate-800">
              <p className="text-slate-500 text-3xl font-bold uppercase mb-4">Consistência</p>
              <p className="text-8xl font-black text-blue-500">{stats?.consistencia || 0}%</p>
            </div>
          </div>

          <div className="bg-slate-900/80 p-12 rounded-[60px] border-4 border-slate-800 flex justify-between items-center">
            <div>
              <p className="text-slate-500 text-3xl font-bold uppercase mb-2">Meta do Mês</p>
              <p className="text-8xl font-black text-white">
                {progMensal.treinosNoMes} / {progMensal.metaMensalEstimada}
              </p>
            </div>
            {progMensal.bateuMetaMensal && (
              <Flame className="w-24 h-24 text-orange-500 fill-orange-500 animate-pulse" />
            )}
          </div>
        </div>

        {/* Footer Clean */}
        <div className="flex justify-between items-center border-t-8 border-slate-800 pt-16">
          <p className="text-6xl text-white font-black italic uppercase tracking-tighter">
            A chama nunca apaga
          </p>
          <div className="bg-orange-500 p-8 rounded-[40px]">
            <Flame className="w-20 h-20 text-white fill-white" />
          </div>
        </div>
      </div>
    </main>
  );
}