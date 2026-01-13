"use client";

import React, { useState, useEffect } from 'react';
import { Flame, Calendar, Trophy, Plus, Trash2, CheckCircle2, Share2, Bell } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image'; // Certifique-se de rodar: npm install html-to-image
import MonthlyCalendar from '@/components/MonthlyCalendar';

interface Treino {
  id: string;
  data: string;
  hora: number;
}

export default function GymTracker() {
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
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

  // 2. Funções de Notificação e Social
  const solicitarNotificacao = async () => {
    if (!("Notification" in window)) {
      alert("Este navegador não suporta notificações de desktop");
      return;
    }
    const permissao = await Notification.requestPermission();
    if (permissao === 'granted') {
      new Notification("Gym Streak", { body: "Lembretes diários ativados com sucesso! 🔥" });
    }
  };

  const exportarRelatorioMensal = async () => {
    const node = document.getElementById('resumo-mensal-card');
    if (node) {
      try {
        const dataUrl = await toPng(node, {
          quality: 0.95,
          backgroundColor: '#020617',
          width: 1080,
          height: 1920
        });
        const link = document.createElement('a');
        link.download = `gym-streak-status-${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Erro ao gerar card:", err);
      }
    }
  };

  // 3. Cálculos e Lógica
  const adicionarTreino = () => {
    if (treinos.some(t => t.data === dataSelecionada)) return;
    const registro = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      data: dataSelecionada,
      hora: new Date().getHours()
    };
    setTreinos([registro, ...treinos]);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  const stats = (() => {
    if (!isCarregado || treinos.length === 0) return null;
    const hoje = new Date();
    const diasDec = Math.max(1, Math.ceil((hoje.getTime() - new Date(hoje.getFullYear(), 0, 1).getTime()) / 86400000));
    const ritmo = treinos.length / diasDec;
    const consistencia = Math.min(100, Math.round((treinos.length / ((diasDec / 7) * metaSemanal)) * 100));
    return { consistencia, ritmo };
  })();

  if (!isCarregado) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8 pb-20">

        {/* Header */}
        <header className="flex justify-between items-center bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
          <h1 className="text-3xl font-black italic uppercase">Gym <span className="text-orange-500">Streak</span></h1>
          <button onClick={solicitarNotificacao} className="p-3 bg-slate-800 rounded-full hover:text-orange-500 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </header>

        {/* Metas e Calendário permanecem aqui */}
        <MonthlyCalendar treinos={treinos} />

        {/* Ações de Registro */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
          <div className="flex gap-4">
            <input type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} className="bg-slate-800 p-4 rounded-2xl flex-1 outline-none border border-slate-700" />
            <button onClick={adicionarTreino} className="bg-orange-500 px-8 rounded-2xl font-black uppercase">Check</button>
          </div>
        </div>

        {/* Botão de Compartilhamento Social */}
        <button
          onClick={exportarRelatorioMensal}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-[1.02] text-white font-black py-5 rounded-3xl shadow-xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
        >
          <Share2 className="w-5 h-5" /> Compartilhar nos Stories
        </button>

        {/* Histórico e outros componentes... */}
      </div>

      {/* CARD OCULTO PARA EXPORTAÇÃO (STORY SIZE 1080x1920) */}
      <div id="resumo-mensal-card" className="fixed -left-[2000px] w-[1080px] h-[1920px] bg-slate-950 p-20 flex flex-col justify-between" style={{ fontFamily: 'sans-serif' }}>
        <div className="space-y-10">
          <h1 className="text-9xl font-black text-white italic uppercase">Gym <span className="text-orange-500">Streak</span></h1>
          <p className="text-5xl text-slate-400 font-medium">RESUMO DE {new Date().toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase()}</p>
        </div>

        <div className="space-y-12">
          <div className="bg-slate-900/80 p-16 rounded-[80px] border-4 border-slate-800">
            <p className="text-slate-500 text-4xl font-bold uppercase mb-6 tracking-widest">Treinos no Ano</p>
            <p className="text-[250px] leading-none font-black text-white">{treinos.length}</p>
          </div>

          <div className="bg-slate-900/80 p-16 rounded-[80px] border-4 border-slate-800">
            <p className="text-slate-500 text-4xl font-bold uppercase mb-6 tracking-widest">Consistência</p>
            <p className="text-[250px] leading-none font-black text-blue-500">{stats?.consistencia || 0}%</p>
          </div>
        </div>

        <div className="flex justify-between items-center border-t-8 border-slate-800 pt-16">
          <div className="space-y-4">
            <p className="text-5xl text-slate-200 font-bold italic">A CHAMA NUNCA APAGA</p>
            <p className="text-4xl text-slate-600 font-bold uppercase">@GYMSTREAKAPP</p>
          </div>
          <Flame className="w-40 h-40 text-orange-500 fill-orange-500" />
        </div>
      </div>
    </main>
  );
}