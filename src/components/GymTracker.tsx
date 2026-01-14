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
  // --- Estados ---
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [metaSemanal, setMetaSemanal] = useState(4);
  const [metaAnual, setMetaAnual] = useState(200);
  const [isEditingMetas, setIsEditingMetas] = useState(false);
  const [isCarregado, setIsCarregado] = useState(false);
  const [feriados, setFeriados] = useState<{ date: string }[]>([]);

  // --- 1. Persistência e Inicialização ---
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

  useEffect(() => {
    if (isCarregado) {
      localStorage.setItem('gym-pro-data', JSON.stringify(treinos));
      localStorage.setItem('gym-meta-semanal', metaSemanal.toString());
      localStorage.setItem('gym-meta-anual', metaAnual.toString());
    }
  }, [treinos, metaSemanal, metaAnual, isCarregado]);

  // --- 2. Lembrete de Treino Diário ---
  useEffect(() => {
    if (!isCarregado || treinos.length === 0) return;

    const hoje = new Date().toISOString().split('T')[0];
    const jaTreinouHoje = treinos.some(t => t.data === hoje);

    if (!jaTreinouHoje && typeof window !== 'undefined' && Notification.permission === 'granted') {
      const timer = setTimeout(() => {
        new Notification("Fogo no treino! 🔥", {
          body: "Você ainda não registrou seu treino de hoje. Não deixe a chama apagar!",
          icon: "/icon-192x192.png"
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [treinos, isCarregado]);

  // --- 3. Utilitários de Segurança e Notificação ---
  const gerarIdSeguro = () => {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
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

  // --- 4. Compartilhamento Nativo (Web Share API) ---
  const compartilharRelatorio = async () => {
    const node = document.getElementById('resumo-mensal-card');
    if (!node) return;

    try {
      node.style.display = 'flex';
      node.style.left = '0';
      const dataUrl = await toPng(node, { quality: 0.95, backgroundColor: '#020617', width: 1080, height: 1920 });
      node.style.left = '-2000px';

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const arquivo = new File([blob], 'gym-streak.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [arquivo] })) {
        await navigator.share({
          files: [arquivo],
          title: 'Gym Streak - Meu Progresso',
          text: 'A chama nunca apaga! 🔥',
        });
      } else {
        const link = document.createElement('a');
        link.download = 'gym-streak-status.png';
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Erro ao compartilhar:", err);
    }
  };

  // --- 5. Lógica de Treinos e Ranks ---
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

      if (getTreinosSemanaAtual(novaLista) === metaSemanal) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      } else {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
      }
      return novaLista;
    });
  };

  const getRank = (total: number) => {
    if (total <= 10) return { nome: "Frango", emoji: "🐣" };
    if (total <= 50) return { nome: "Em Construção", emoji: "🏋️‍♂️" };
    if (total <= 100) return { nome: "Assíduo", emoji: "🔥" };
    if (total <= 200) return { nome: "Gladiador", emoji: "🛡️" };
    return { nome: "Lenda Urbana", emoji: "🏆" };
  };

  const rankAtual = getRank(treinos.length);

  // --- 6. Cálculos de Estatísticas ---
  const stats = (() => {
    if (!isCarregado || treinos.length === 0) return null;
    const hoje = new Date();
    const inicioAno = new Date(hoje.getFullYear(), 0, 1);
    const diasDec = Math.max(1, Math.floor((hoje.getTime() - inicioAno.getTime()) / 86400000));

    const treinosNoMes = treinos.filter(t => {
      const d = new Date(t.data + "T00:00:00");
      return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
    }).length;

    const metaMensalEstimada = metaSemanal * 4;
    const consistencia = Math.min(100, Math.round((treinos.length / ((diasDec / 7) * metaSemanal)) * 100));

    return { consistencia, treinosNoMes, metaMensalEstimada, bateuMetaMensal: treinosNoMes >= metaMensalEstimada };
  })();

  if (!isCarregado) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex justify-between items-center bg-slate-900/50 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div>
            <h1 className="text-2xl md:text-3xl font-black italic uppercase italic">Gym <span className="text-orange-500">Streak</span></h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">
              {getTreinosSemanaAtual(treinos) >= metaSemanal ? "🚀 Meta batida!" : "Toque no calendário para registrar."}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={solicitarNotificacao}
              className={`p-3 rounded-2xl transition-colors border ${typeof window !== 'undefined' && Notification.permission === 'granted'
                ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                : 'bg-slate-800 border-slate-700 hover:text-orange-500'
                }`}
            >
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
                <input type="number" value={metaSemanal} onChange={(e) => setMetaAnual(Number(e.target.value) * 52)} className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 outline-none focus:border-orange-500 font-bold" />
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
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 text-center">Consistência</p>
              <div className="flex items-center gap-3"><span className="text-2xl font-black text-blue-400">{stats.consistencia}%</span>
                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${stats.consistencia}%` }} /></div>
              </div>
            </div>
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex flex-col justify-center text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Mês Atual</p>
              <p className="text-lg font-bold text-slate-100 uppercase tracking-tighter">{stats.treinosNoMes} / {stats.metaMensalEstimada} {stats.bateuMetaMensal && '🔥'}</p>
            </div>
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex flex-col justify-center text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Nível</p>
              <p className="text-xs font-bold uppercase text-orange-400">{rankAtual.emoji} {rankAtual.nome}</p>
            </div>
          </div>
        )}

        <button
          onClick={compartilharRelatorio}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-black py-5 rounded-2xl shadow-lg flex items-center justify-center gap-3 uppercase text-xs tracking-widest transition-transform active:scale-95"
        >
          <Share2 className="w-4 h-4" /> Compartilhar Evolução
        </button>
      </div>

      {/* CARD OFF-SCREEN PARA RENDERIZAÇÃO */}
      <div
        id="resumo-mensal-card"
        className="fixed w-[1080px] h-[1920px] bg-slate-950 p-24 flex flex-col justify-between"
        style={{ left: '-2000px', top: 0, zIndex: -1, backgroundColor: '#020617', fontFamily: 'sans-serif' }}
      >
        <div className="space-y-6">
          <h1 className="text-[120px] font-black text-white italic uppercase leading-none tracking-tighter">
            Gym <span className="text-orange-500">Streak</span>
          </h1>
          <p className="text-4xl text-slate-500 font-bold uppercase tracking-[12px]">
            Status de {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-slate-900 p-16 rounded-[100px] border-4 border-orange-500/30 text-center space-y-4">
          <p className="text-slate-400 text-4xl font-black uppercase tracking-widest">Nível Atual</p>
          <p className="text-[120px] leading-tight font-black text-white uppercase italic">
            {rankAtual.emoji} {rankAtual.nome}
          </p>
        </div>

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
                {stats?.treinosNoMes} / {stats?.metaMensalEstimada}
              </p>
            </div>
            {stats?.bateuMetaMensal && (
              <Flame className="w-24 h-24 text-orange-500 fill-orange-500" />
            )}
          </div>
        </div>

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