"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Share2, Calendar, Scale, Loader2, BookOpen } from 'lucide-react'; // <-- BookOpen adicionado
import { toPng } from 'html-to-image';

// Custom Hook para lógica de dados - Verifique se o arquivo está em src/hooks/useGymData.ts
import { useGymData } from './hooks/useGymData';

// Componentes Core
import MonthlyCalendar from '@/components/MonthlyCalendar';
import Header from '@/components/dashboard/Header';
import GoalEditor from '@/components/dashboard/GoalEditor';
import InstagramCard from '@/components/social/InstagramCard';
import WaterTracker from '@/components/dashboard/WaterTracker';
import WeightTracker from '@/components/body/WeightTracker';
import WeeklyProgress from '@/components/dashboard/WeeklyProgress';
import CyclePredictor from '@/components/dashboard/CyclePredictor';
import FemaleOnboarding from '@/components/dashboard/FemaleOnboarding';
import MoodSelector from '@/components/dashboard/MoodSelector';

// NOVO: Componente de Leitura
import ReadingTracker from '@/components/routine/ReadingTracker';

// Interface local para garantir que o TS entenda o que é um treino
interface Treino {
  id: string;
  data: string;
  hora: number;
  mood?: string;
}

export default function GymTracker() {
  const {
    treinos,
    metaSemanal,
    handleUpdateMeta,
    isCarregado,
    userData,
    confirmarAcaoTreino,
    handleUpdateCycle
  } = useGymData();

  // NOVO: Adicionado 'leitura' aos estados possíveis da aba
  const [activeTab, setActiveTab] = useState<'frequencia' | 'peso' | 'leitura'>('frequencia');
  const [dataExibida, setDataExibida] = useState(new Date());
  const [showMoodSelector, setShowMoodSelector] = useState<{ data: string } | null>(null);
  const [isExportando, setIsExportando] = useState(false);
  const [isEditingMetas, setIsEditingMetas] = useState(false);

  // Lógica de Deep Link para Notificações
  useEffect(() => {
    if (!isCarregado) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'open_mood_selector') {
      const hoje = new Date().toLocaleDateString('en-CA');
      if (!treinos.some((t: Treino) => t.data === hoje)) {
        setShowMoodSelector({ data: hoje });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [isCarregado, treinos]);

  // Função para abrir/fechar registro de treino (Definida antes das estatísticas por segurança)
  const handleToggleTreino = useCallback((dataIso: string) => {
    const treinoExistente = treinos.find((t: Treino) => t.data === dataIso);
    if (treinoExistente) {
      confirmarAcaoTreino(dataIso, null, true);
    } else {
      setShowMoodSelector({ data: dataIso });
    }
  }, [treinos, confirmarAcaoTreino]);

  // Cálculos de Estatísticas e Rank para o Dashboard e InstagramCard
  const stats = useMemo(() => {
    const hojeLocal = new Date().toLocaleDateString('en-CA');
    const prefixoMes = `${dataExibida.getFullYear()}-${(dataExibida.getMonth() + 1).toString().padStart(2, '0')}`;

    // Filtramos os treinos do mês exibido
    const treinosFiltrados = treinos.filter((t: Treino) => t.data.startsWith(prefixoMes));
    const treinosNoMesCount = treinosFiltrados.length;
    const metaMensal = metaSemanal * 4;

    return {
      treinosNoMes: treinosNoMesCount,
      nomeMes: dataExibida.toLocaleDateString('pt-BR', { month: 'long' }),
      anoExibido: dataExibida.getFullYear(),
      metaMensal: metaMensal,
      bateuMetaMensal: treinosNoMesCount >= metaMensal,
      treinouHoje: treinos.some((t: Treino) => t.data === hojeLocal),
      rank: treinos.length <= 10 ? { nome: "Iniciante", emoji: "🐣" } :
        treinos.length <= 30 ? { nome: "Focado", emoji: "🔥" } :
          treinos.length <= 80 ? { nome: "Constante", emoji: "🏋️‍♂️" } :
            { nome: "Gladiador", emoji: "🛡️" }
    };
  }, [treinos, metaSemanal, dataExibida]);

  const treinosDaSemana = useMemo(() => {
    const hoje = new Date();
    const domingo = new Date(hoje);
    domingo.setDate(hoje.getDate() - hoje.getDay());
    domingo.setHours(0, 0, 0, 0);
    return treinos.filter((t: Treino) => new Date(t.data + "T00:00:00") >= domingo);
  }, [treinos]);

  const metaAnualDinamica = useMemo(() => {
    const hoje = new Date();
    const dataCadastro = userData.createdAt ? new Date(userData.createdAt) : new Date(hoje.getFullYear(), 0, 1);
    const diffEmDias = Math.ceil((new Date(hoje.getFullYear(), 11, 31).getTime() - dataCadastro.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.floor((diffEmDias / 7) * metaSemanal));
  }, [metaSemanal, userData.createdAt]);

  const compartilharFrequencia = async () => {
    const node = document.getElementById('resumo-mensal-card');
    if (!node) return;
    setIsExportando(true);
    try {
      const dataUrl = await toPng(node, { quality: 1, pixelRatio: 2, backgroundColor: '#020617' });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `ignite-stats.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Ignite Evolution', text: 'Chama acesa! 🔥' });
      } else {
        const link = document.createElement('a');
        link.download = `ignite-stats.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (e) {
      console.error("Erro ao exportar:", e);
    } finally {
      setIsExportando(false);
    }
  };

  if (!isCarregado) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6 text-white">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.5em]">Sincronizando Chama</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#020617] text-slate-50 p-4 md:p-8 pb-32">
      {showMoodSelector && (
        <MoodSelector
          onSelect={(emoji: string) => confirmarAcaoTreino(showMoodSelector.data, emoji)}
          onClose={() => setShowMoodSelector(null)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6">

        {/* Renderização Condicional: TREINO */}
        {activeTab === 'frequencia' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Header treinosCount={treinos.length} userName={userData.nome} />
            <WaterTracker userId={userData.id} />

            {userData.sexo === 'feminino' && (
              userData.ultimoCiclo ? (
                <CyclePredictor
                  ultimoCiclo={userData.ultimoCiclo}
                  duracaoCiclo={userData.duracaoCiclo}
                  duracaoPeriodo={userData.duracaoPeriodo}
                  onReset={handleUpdateCycle}
                />
              ) : (
                <FemaleOnboarding onSave={(d: any) => handleUpdateCycle(d.ultimo_ciclo, d.duracao_ciclo, d.duracao_periodo)} />
              )
            )}

            <GoalEditor
              metaSemanal={metaSemanal}
              metaAnual={metaAnualDinamica}
              onUpdateMeta={handleUpdateMeta}
              isEditing={isEditingMetas}
              setIsEditing={setIsEditingMetas}
            />

            <WeeklyProgress treinos={treinos} metaSemanal={metaSemanal} />
            <MonthlyCalendar treinos={treinos} onToggleTreino={handleToggleTreino} onMonthChange={setDataExibida} />

            <button
              onClick={compartilharFrequencia}
              disabled={isExportando}
              className="w-full bg-gradient-to-br from-orange-500 to-orange-700 font-black py-6 rounded-[32px] flex items-center justify-center gap-3 uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-50"
            >
              {isExportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              {isExportando ? "GERANDO STATUS..." : "Exportar Evolução Mensal"}
            </button>
          </div>
        )}

        {/* Renderização Condicional: PESO */}
        {activeTab === 'peso' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <WeightTracker
              ultimoCiclo={userData.ultimoCiclo}
              duracaoCiclo={userData.duracaoCiclo}
              duracaoPeriodo={userData.duracaoPeriodo}
            />
          </div>
        )}

        {/* Renderização Condicional: LEITURA */}
        {activeTab === 'leitura' && (
          <ReadingTracker />
        )}
      </div>

      {/* NOVO: Barra de navegação com 3 botões (Treino, Peso, Leitura) ajustada para mobile */}
      <nav className="fixed bottom-6 w-[95%] max-w-md left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-3xl border border-white/10 p-2 rounded-[2rem] shadow-2xl flex justify-between gap-1 z-50">
        <button
          onClick={() => setActiveTab('frequencia')}
          className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-1.5 py-3 rounded-[1.5rem] font-black text-[9px] uppercase transition-all ${activeTab === 'frequencia' ? 'bg-orange-500 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Calendar className="w-4 h-4" /> <span>Treinos</span>
        </button>

        <button
          onClick={() => setActiveTab('peso')}
          className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-1.5 py-3 rounded-[1.5rem] font-black text-[9px] uppercase transition-all ${activeTab === 'peso' ? 'bg-orange-500 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Scale className="w-4 h-4" /> <span>Peso</span>
        </button>

        <button
          onClick={() => setActiveTab('leitura')}
          className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-1.5 py-3 rounded-[1.5rem] font-black text-[9px] uppercase transition-all ${activeTab === 'leitura' ? 'bg-orange-500 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <BookOpen className="w-4 h-4" /> <span>Leitura</span>
        </button>
      </nav>

      <InstagramCard
        {...stats}
        metaMensalEstimada={stats.metaMensal}
        treinosCount={treinos.length}
        metaAnual={metaAnualDinamica}
        consistencia={Math.round((treinos.length / metaAnualDinamica) * 100) || 0}
        ano={stats.anoExibido}
        mesNome={stats.nomeMes}
        metaSemanal={metaSemanal}
        concluidosSemana={treinosDaSemana.length}
        userName={userData.nome}
        bateuMetaMensal={stats.bateuMetaMensal}
      />
    </main>
  );
}