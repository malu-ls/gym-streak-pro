"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';

// Importação dos componentes componentizados
import MonthlyCalendar from '@/components/MonthlyCalendar';
import Header from '@/components/dashboard/Header';
import GoalEditor from '@/components/dashboard/GoalEditor';
import StatsGrid from '@/components/dashboard/StatsGrid';
import InstagramCard from '@/components/social/InstagramCard';
import BadgeGrid from '@/components/achievements/BadgeGrid';

interface Treino {
  id: string;
  data: string;
  hora: number;
}

export default function GymTracker() {
  // --- Estados ---
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [feriados, setFeriados] = useState<{ date: string }[]>([]);
  const [metaSemanal, setMetaSemanal] = useState(4);
  const [metaAnual, setMetaAnual] = useState(208); // 4 * 52
  const [isEditingMetas, setIsEditingMetas] = useState(false);
  const [isCarregado, setIsCarregado] = useState(false);

  // --- 1. Persistência e Inicialização de Dados ---
  useEffect(() => {
    // Carrega dados do LocalStorage
    const savedTreinos = localStorage.getItem('gym-pro-data');
    const savedMetaS = localStorage.getItem('gym-meta-semanal');

    if (savedTreinos) setTreinos(JSON.parse(savedTreinos));
    if (savedMetaS) {
      const ms = Number(savedMetaS);
      setMetaSemanal(ms);
      setMetaAnual(ms * 52);
    }

    // Busca Feriados
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

  // --- 2. Sincronização com LocalStorage ---
  useEffect(() => {
    if (isCarregado) {
      localStorage.setItem('gym-pro-data', JSON.stringify(treinos));
      localStorage.setItem('gym-meta-semanal', metaSemanal.toString());
    }
  }, [treinos, metaSemanal, isCarregado]);

  // --- 3. Notificações e Lembretes ---
  const solicitarNotificacao = async () => {
    if (typeof window !== 'undefined' && "Notification" in window) {
      const permissao = await Notification.requestPermission();
      if (permissao === 'granted') {
        new Notification("Gym Streak 🔥", { body: "Lembretes diários ativados!" });
      }
    }
  };

  useEffect(() => {
    if (!isCarregado || treinos.length === 0) return;
    const hoje = new Date().toISOString().split('T')[0];
    const jaTreinouHoje = treinos.some(t => t.data === hoje);

    if (!jaTreinouHoje && typeof window !== 'undefined' && Notification.permission === 'granted') {
      const timer = setTimeout(() => {
        new Notification("Fogo no treino! 🔥", {
          body: "Você ainda não registrou seu treino de hoje. Não deixe a chama apagar!",
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [treinos, isCarregado]);

  // --- 4. Ações e Handlers ---
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

      if (navigator.share) {
        await navigator.share({ files: [arquivo], title: 'Gym Streak Status' });
      }
    } catch (err) {
      console.error("Erro ao compartilhar:", err);
    }
  };

  // --- 5. Cálculos (Memoizados) ---
  const statsCalculados = useMemo(() => {
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

    const treinosNoMes = treinos.filter(t => {
      const d = new Date(t.data + "T00:00:00");
      return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
    }).length;

    return { consistencia, dataEst, diasAtrasado, treinosNoMes, metaM: metaSemanal * 4, bateuM: treinosNoMes >= (metaSemanal * 4) };
  }, [treinos, metaSemanal, metaAnual]);

  const rankAtual = useMemo(() => {
    const total = treinos.length;
    if (total <= 10) return { nome: "Frango", emoji: "🐣" };
    if (total <= 50) return { nome: "Em Construção", emoji: "🏋️‍♂️" };
    if (total <= 100) return { nome: "Assíduo", emoji: "🔥" };
    if (total <= 200) return { nome: "Gladiador", emoji: "🛡️" };
    return { nome: "Lenda Urbana", emoji: "🏆" };
  }, [treinos.length]);

  if (!isCarregado) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-bold animate-pulse">
      Sincronizando...
    </div>
  );

  const treinouHoje = useMemo(() => {
    const hoje = new Date().toISOString().split('T')[0];
    return treinos.some(t => t.data === hoje);
  }, [treinos]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">

        <Header
          treinosCount={treinos.length}
          metaSemanal={metaSemanal}
          onSolicitarNotificacao={solicitarNotificacao}
        />

        <GoalEditor
          metaSemanal={metaSemanal}
          metaAnual={metaAnual}
          onUpdateMeta={updateMetaSemanal}
          isEditing={isEditingMetas}
          setIsEditing={setIsEditingMetas}
        />

        <MonthlyCalendar treinos={treinos} onToggleTreino={toggleTreino} />

        <StatsGrid
          consistencia={statsCalculados.consistencia}
          dataEst={statsCalculados.dataEst}
          diasAtrasado={statsCalculados.diasAtrasado}
        />

        <BadgeGrid treinos={treinos} feriados={feriados} />

        <button
          onClick={compartilharRelatorio}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 font-black py-5 rounded-2xl shadow-lg flex items-center justify-center gap-3 uppercase text-xs transition-transform active:scale-95"
        >
          <Share2 className="w-4 h-4" /> Compartilhar Evolução
        </button>
      </div>

      <InstagramCard
        treinosCount={treinos.length}
        metaAnual={metaAnual}
        consistencia={stats.consistencia} // ou statsCalculados.consistencia
        treinosNoMes={stats.noMes}
        metaMensalEstimada={stats.metaM}
        bateuMetaMensal={stats.bateuM}
        rank={rankAtual}
        treinouHoje={treinouHoje} // <--- ADICIONE ESTA LINHA EXATAMENTE AQUI
      />
    </main>
  );
}