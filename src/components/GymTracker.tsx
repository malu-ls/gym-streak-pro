"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Share2, Calendar, Scale, Loader2, BookOpen } from 'lucide-react'; // Adicionado BookOpen
import confetti from 'canvas-confetti';
import { toBlob } from 'html-to-image';
import { createBrowserClient } from '@supabase/ssr';

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
import ReadingTracker from '@/components/routine/ReadingTracker'; // Importe o novo componente

interface Treino {
  id: string;
  data: string;
  hora: number;
  mood?: string;
}

export default function GymTracker() {
  // 1. Atualizamos o estado para aceitar a nova aba de Leitura
  const [activeTab, setActiveTab] = useState<'frequencia' | 'peso' | 'leitura'>('frequencia');

  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [metaSemanal, setMetaSemanal] = useState(4);
  const [isCarregado, setIsCarregado] = useState(false);
  const [isExportando, setIsExportando] = useState(false);
  const [dataExibida, setDataExibida] = useState(new Date());
  const [showMoodSelector, setShowMoodSelector] = useState<{ data: string } | null>(null);
  const [isEditingMetas, setIsEditingMetas] = useState(false);

  const [userData, setUserData] = useState({
    id: '',
    nome: 'Atleta',
    createdAt: '',
    sexo: '',
    ultimoCiclo: '',
    duracaoCiclo: 28,
    duracaoPeriodo: 5,
    pesoAtual: 0
  });

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const carregarDados = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const userId = session.user.id;

        const [perfilRes, treinosRes, pesoRes] = await Promise.all([
          supabase.from('perfis')
            .select('nome, meta_semanal, created_at, sexo, ultimo_ciclo, duracao_ciclo, duracao_periodo')
            .eq('id', userId)
            .single(),
          fetch('/api/treinos').then(r => r.json()),
          supabase.from('historico_peso')
            .select('peso')
            .eq('usuario_id', userId)
            .order('data', { ascending: false })
            .limit(1)
            .maybeSingle()
        ]);

        if (perfilRes.data) {
          const p = perfilRes.data;
          setUserData(prev => ({
            ...prev,
            id: userId,
            nome: p.nome || 'Atleta',
            createdAt: p.created_at,
            sexo: p.sexo,
            ultimoCiclo: p.ultimo_ciclo,
            duracaoCiclo: p.duracao_ciclo || 28,
            duracaoPeriodo: p.duracao_periodo || 5,
            pesoAtual: pesoRes.data?.peso || 0
          }));
          setMetaSemanal(p.meta_semanal || 4);
        }
        if (Array.isArray(treinosRes)) setTreinos(treinosRes);
      }
    } catch (e) {
      console.error("Erro na sincronização:", e);
    } finally {
      setIsCarregado(true);
    }
  }, [supabase]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  // Deep Link para notificações
  useEffect(() => {
    if (!isCarregado) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'open_mood_selector') {
      const hoje = new Date().toLocaleDateString('en-CA');
      if (!treinos.some(t => t.data === hoje)) {
        setShowMoodSelector({ data: hoje });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [isCarregado, treinos]);

  const handleUpdateMeta = async (novaMeta: number) => {
    setMetaSemanal(novaMeta);
    if (userData.id) {
      await supabase.from('perfis').update({ meta_semanal: novaMeta }).eq('id', userData.id);
    }
  };

  const confirmarAcaoTreino = async (dataIso: string, moodSelecionado: string | null, isDelete = false) => {
    setShowMoodSelector(null);
    const backupTreinos = [...treinos];

    if (isDelete) {
      setTreinos(prev => prev.filter(t => t.data !== dataIso));
    } else {
      const moodFinal = moodSelecionado || '🏆';
      const novoTreino: Treino = {
        id: `temp-${Date.now()}`,
        data: dataIso,
        hora: new Date().getHours(),
        mood: moodFinal
      };
      setTreinos(prev => [...prev, novoTreino]);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    }

    try {
      const res = await fetch('/api/treinos', {
        method: isDelete ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: dataIso,
          mood: moodSelecionado || '🏆',
          hora: new Date().getHours()
        })
      });

      if (!res.ok) throw new Error("Falha na sincronização");
      carregarDados();
    } catch (e) {
      console.error("Erro ao sincronizar treino:", e);
      setTreinos(backupTreinos);
      alert("Erro ao salvar treino. Verifique sua conexão.");
    }
  };

  const handleToggleTreino = useCallback((dataIso: string) => {
    const treinoExistente = treinos.find(t => t.data === dataIso);
    if (treinoExistente) {
      confirmarAcaoTreino(dataIso, null, true);
    } else {
      setShowMoodSelector({ data: dataIso });
    }
  }, [treinos, confirmarAcaoTreino]);

  const handleUpdateCycle = async (novaData: string, novaDuracao: number, novaDuracaoPeriodo: number) => {
    if (userData.id) {
      const { error } = await supabase.from('perfis')
        .update({ ultimo_ciclo: novaData, duracao_ciclo: novaDuracao, duracao_periodo: novaDuracaoPeriodo })
        .eq('id', userData.id);

      if (!error) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#ef4444', '#f97316', '#ffffff'] });
        carregarDados();
      }
    }
  };

  const treinosDaSemana = useMemo(() => {
    const hoje = new Date();
    const diaSem = hoje.getDay();
    const domingo = new Date(hoje);
    domingo.setDate(hoje.getDate() - diaSem);
    domingo.setHours(0, 0, 0, 0);
    return treinos.filter(t => new Date(t.data + "T00:00:00") >= domingo);
  }, [treinos]);

  const stats = useMemo(() => {
    const hojeLocal = new Date().toLocaleDateString('en-CA');
    const prefixoMes = `${dataExibida.getFullYear()}-${(dataExibida.getMonth() + 1).toString().padStart(2, '0')}`;
    const treinosNoMes = treinos.filter(t => t.data.startsWith(prefixoMes)).length;

    const rank = treinos.length <= 10 ? { nome: "Iniciante", emoji: "🐣" } :
      treinos.length <= 30 ? { nome: "Focado", emoji: "🔥" } :
        treinos.length <= 80 ? { nome: "Constante", emoji: "🏋️‍♂️" } :
          { nome: "Gladiador", emoji: "🛡️" };

    return {
      treinosNoMes,
      nomeMes: dataExibida.toLocaleDateString('pt-BR', { month: 'long' }),
      anoExibido: dataExibida.getFullYear(),
      metaMensal: metaSemanal * 4,
      treinouHoje: treinos.some(t => t.data === hojeLocal),
      rank
    };
  }, [treinos, metaSemanal, dataExibida]);

  const metaAnualDinamica = useMemo(() => {
    const hoje = new Date();
    const dataCadastro = userData.createdAt ? new Date(userData.createdAt) : new Date(hoje.getFullYear(), 0, 1);
    const diffEmDias = Math.ceil((new Date(hoje.getFullYear(), 11, 31).getTime() - dataCadastro.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.floor((diffEmDias / 7) * metaSemanal));
  }, [metaSemanal, userData.createdAt]);

  const handleExportarTreino = async () => {
    const node = document.getElementById('resumo-mensal-card');
    if (!node) return;
    setIsExportando(true);
    try {
      await new Promise(r => setTimeout(r, 400));
      const blob = await toBlob(node, { quality: 1, pixelRatio: 2 });
      if (!blob) return;

      const file = new File([blob], `ignite-stats.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Ignite Evolution', text: 'Chama acesa! 🔥' });
      } else {
        const link = document.createElement('a');
        link.download = `ignite-stats.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
      }
    } catch (e) {
      console.error(e);
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
          onSelect={(emoji) => confirmarAcaoTreino(showMoodSelector.data, emoji)}
          onClose={() => setShowMoodSelector(null)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* ABA DE TREINOS */}
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
                <FemaleOnboarding onSave={(d) => handleUpdateCycle(d.ultimo_ciclo, d.duracao_ciclo, d.duracao_periodo)} />
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
              onClick={handleExportarTreino}
              disabled={isExportando}
              className="w-full bg-gradient-to-br from-orange-500 to-orange-700 font-black py-6 rounded-[32px] flex items-center justify-center gap-3 uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-50"
            >
              {isExportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              {isExportando ? "GERANDO STATUS..." : "Exportar Evolução Mensal"}
            </button>
          </div>
        )}

        {/* ABA DE PESO */}
        {activeTab === 'peso' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <WeightTracker
              ultimoCiclo={userData.ultimoCiclo}
              duracaoCiclo={userData.duracaoCiclo}
              duracaoPeriodo={userData.duracaoPeriodo}
            />
          </div>
        )}

        {/* ABA DE LEITURA */}
        {activeTab === 'leitura' && (
          <ReadingTracker />
        )}
      </div>

      {/* 2. NavBar atualizada e com padding ajustado para caber 3 botões */}
      <nav className="fixed bottom-6 w-[90%] max-w-sm left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-3xl border border-white/10 p-2 rounded-[2rem] shadow-2xl flex justify-between gap-1 z-50">
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

      {/* Card oculto para exportação de Treino */}
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
        bateuMetaMensal={stats.treinosNoMes >= stats.metaMensal}
      />
    </main>
  );
}