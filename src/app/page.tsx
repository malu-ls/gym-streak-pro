"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Share2, Calendar, Scale } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';

// Importação dos componentes
import MonthlyCalendar from '@/components/MonthlyCalendar';
import Header from '@/components/dashboard/Header';
import GoalEditor from '@/components/dashboard/GoalEditor';
import StatsGrid from '@/components/dashboard/StatsGrid';
import InstagramCard from '@/components/social/InstagramCard';
import BadgeGrid from '@/components/achievements/BadgeGrid';
import WeightTracker from '@/components/body/WeightTracker';

interface Treino {
  id: string;
  data: string;
  hora: number;
}

export default function GymTracker() {
  // 1. Estados (Sempre no topo)
  const [activeTab, setActiveTab] = useState<'frequencia' | 'peso'>('frequencia');
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [feriados, setFeriados] = useState<{ date: string }[]>([]);
  const [metaSemanal, setMetaSemanal] = useState(4);
  const [metaAnual, setMetaAnual] = useState(208);
  const [isEditingMetas, setIsEditingMetas] = useState(false);
  const [isCarregado, setIsCarregado] = useState(false);

  // 2. Persistência e Inicialização
  useEffect(() => {
    const saved = localStorage.getItem('gym-pro-data');
    const savedMetaS = localStorage.getItem('gym-meta-semanal');

    if (saved) setTreinos(JSON.parse(saved));
    if (savedMetaS) {
      const ms = Number(savedMetaS);
      setMetaSemanal(ms);
      setMetaAnual(ms * 52);
    }

    const buscarFeriados = async () => {
      try {
        const ano = new Date().getFullYear();
        const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
        const data = await response.json();
        setFeriados(Array.isArray(data) ? data : []);
      } catch (e) {
        console.warn("Erro ao carregar feriados");
      }
    };

    buscarFeriados();
    setIsCarregado(true);
  }, []);

  useEffect(() => {
    if (isCarregado) {
      localStorage.setItem('gym-pro-data', JSON.stringify(treinos));
      localStorage.setItem('gym-meta-semanal', metaSemanal.toString());
    }
  }, [treinos, metaSemanal, isCarregado]);

  // 3. Cálculos Memoizados (Antes do return condicional)
  const treinouHoje = useMemo(() => {
    const hoje = new Date().toISOString().split('T')[0];
    return treinos.some(t => t.data === hoje);
  }, [treinos]);

  const stats = useMemo(() => {
    const hoje = new Date();
    const inicioAno = new Date(hoje.getFullYear(), 0, 1);
    const diasDec = Math.max(1, Math.floor((hoje.getTime() - inicioAno.getTime()) / 86400000));

    const consistencia = Math.min(100, Math.round((treinos.length / ((diasDec / 7) * metaSemanal)) * 100));
    const ritmoPorDia = treinos.length / diasDec;
    const treinosFaltantes = metaAnual - treinos.length;

    let dataEst = "Meta Batida! 🏆";
    if (treinosFaltantes > 0 && ritmoPorDia > 0) {
      const dataEstimada = new Date();
      dataEstimada.setDate(hoje.getDate() + Math.ceil(treinosFaltantes / ritmoPorDia));
      dataEst = dataEstimada.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }

    const ritmoIdealAcumulado = (metaAnual / 365) * diasDec;
    const diasAtrasado = Math.floor(ritmoIdealAcumulado - treinos.length);

    const noMes = treinos.filter(t => {
      const d = new Date(t.data + "T00:00:00");
      return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
    }).length;

    return { consistencia, dataEst, diasAtrasado, noMes, metaM: metaSemanal * 4, bateuM: noMes >= (metaSemanal * 4) };
  }, [treinos, metaSemanal, metaAnual]);

  const rankAtual = useMemo(() => {
    const total = treinos.length;
    if (total <= 10) return { nome: "Frango", emoji: "🐣" };
    if (total <= 50) return { nome: "Em Construção", emoji: "🏋️‍♂️" };
    if (total <= 100) return { nome: "Assíduo", emoji: "🔥" };
    return { nome: "Gladiador", emoji: "🛡️" };
  }, [treinos.length]);

  // 4. Ações
  const updateMetaSemanal = (valor: number) => {
    setMetaSemanal(valor);
    setMetaAnual(valor * 52);
  };

  const toggleTreino = (dataIso: string) => {
    setTreinos(prev => {
      const existe = prev.some(t => t.data === dataIso);
      if (existe) return prev.filter(t => t.data !== dataIso);

      const novo = {
        id: typeof window !== 'undefined' && window.crypto?.randomUUID
          ? window.crypto.randomUUID()
          : `id-${Date.now()}`,
        data: dataIso,
        hora: new Date().getHours()
      };

      confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
      return [novo, ...prev];
    });
  };

  const solicitarNotificacao = async () => {
    if (typeof window !== 'undefined' && "Notification" in window) {
      const permissao = await Notification.requestPermission();
      if (permissao === 'granted') {
        new Notification("Gym Ignite 🔥", {
          body: "A chama não pode apagar! Registre seu treino de hoje."
        });
      }
    }
  };

  const compartilharFrequencia = async () => {
    const node = document.getElementById('resumo-mensal-card');
    if (!node) return;
    node.style.display = 'flex';
    node.style.left = '0';
    try {
      const dataUrl = await toPng(node, { quality: 0.95, backgroundColor: '#020617', width: 1080, height: 1920 });
      node.style.left = '-2000px';
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const arquivo = new File([blob], 'gym-ignite.png', { type: 'image/png' });
      if (navigator.share) await navigator.share({ files: [arquivo], title: 'Progresso Gym Ignite' });
    } catch (e) {
      node.style.left = '-2000px';
      console.error(e);
    }
  };

  // 5. Retorno condicional
  if (!isCarregado) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-black animate-pulse uppercase text-[10px] tracking-widest">
      Sincronizando...
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        {activeTab === 'frequencia' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Header treinosCount={treinos.length} metaSemanal={metaSemanal} onSolicitarNotificacao={solicitarNotificacao} />
            <GoalEditor metaSemanal={metaSemanal} metaAnual={metaAnual} onUpdateMeta={updateMetaSemanal} isEditing={isEditingMetas} setIsEditing={setIsEditingMetas} />
            <MonthlyCalendar treinos={treinos} onToggleTreino={toggleTreino} />
            <StatsGrid consistencia={stats.consistencia} dataEst={stats.dataEst} diasAtrasado={stats.diasAtrasado} />
            <BadgeGrid treinos={treinos} feriados={feriados} />
            <button onClick={compartilharFrequencia} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 font-black py-5 rounded-2xl shadow-lg flex items-center justify-center gap-3 uppercase text-xs transition-transform active:scale-95">
              <Share2 className="w-4 h-4" /> Compartilhar Frequência
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="p-8 bg-slate-900/50 rounded-3xl border border-slate-800 text-center">
              <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter">Corpo <span className="text-orange-500">& Peso</span></h1>
              <p className="text-slate-500 text-[10px] font-black uppercase mt-2 tracking-[0.3em]">Acompanhamento Físico</p>
            </header>
            <WeightTracker />
          </div>
        )}
      </div>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-2 rounded-full shadow-2xl flex gap-2 z-50">
        <button onClick={() => setActiveTab('frequencia')} className={`flex items-center gap-2 px-8 py-4 rounded-full font-black text-[10px] uppercase transition-all ${activeTab === 'frequencia' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40' : 'text-slate-500 hover:text-slate-300'}`}>
          <Calendar className="w-4 h-4" /> Treinos
        </button>
        <button onClick={() => setActiveTab('peso')} className={`flex items-center gap-2 px-8 py-4 rounded-full font-black text-[10px] uppercase transition-all ${activeTab === 'peso' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40' : 'text-slate-500 hover:text-slate-300'}`}>
          <Scale className="w-4 h-4" /> Peso
        </button>
      </nav>

      <InstagramCard
        treinosCount={treinos.length}
        metaAnual={metaAnual}
        consistencia={stats.consistencia}
        treinosNoMes={stats.noMes}
        metaMensalEstimada={stats.metaM}
        bateuMetaMensal={stats.bateuM}
        rank={rankAtual}
        treinouHoje={treinouHoje}
      />
    </main>
  );
}