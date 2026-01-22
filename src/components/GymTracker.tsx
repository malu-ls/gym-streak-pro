"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Share2, Calendar, Scale, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import { createBrowserClient } from '@supabase/ssr';

// Componentes Core
import MonthlyCalendar from '@/components/MonthlyCalendar';
import Header from '@/components/dashboard/Header';
import GoalEditor from '@/components/dashboard/GoalEditor';
import InstagramCard from '@/components/social/InstagramCard';
import WaterTracker from '@/components/dashboard/WaterTracker'; // Novo Componente
import WeightTracker from '@/components/body/WeightTracker';
import WeeklyProgress from '@/components/dashboard/WeeklyProgress';
import CyclePredictor from '@/components/dashboard/CyclePredictor';
import FemaleOnboarding from '@/components/dashboard/FemaleOnboarding';
import MoodSelector from '@/components/dashboard/MoodSelector';

interface Treino {
  id: string;
  data: string;
  hora: number;
  mood?: string;
}

export default function GymTracker() {
  const [activeTab, setActiveTab] = useState<'frequencia' | 'peso'>('frequencia');
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
    pesoAtual: 0 // Adicionado para o WaterTracker
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
          // Busca o peso mais recente para o cálculo de água
          supabase.from('historico_peso')
            .select('peso')
            .eq('usuario_id', userId)
            .order('data', { ascending: false })
            .limit(1)
            .single()
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

  const handleToggleTreino = useCallback((dataIso: string) => {
    const treinoExistente = treinos.find(t => t.data === dataIso);
    if (treinoExistente) {
      confirmarAcaoTreino(dataIso, null, true);
    } else {
      setShowMoodSelector({ data: dataIso });
    }
  }, [treinos]);

  const confirmarAcaoTreino = async (dataIso: string, moodSelecionado: string | null, isDelete = false) => {
    const treinosAnteriores = [...treinos];
    setShowMoodSelector(null);

    if (isDelete) {
      setTreinos(prev => prev.filter(t => t.data !== dataIso));
      await fetch('/api/treinos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataIso })
      });
    } else {
      const moodFinal = moodSelecionado || '🏆';
      setTreinos(prev => [...prev, { id: 'temp', data: dataIso, hora: new Date().getHours(), mood: moodFinal }]);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
      await fetch('/api/treinos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataIso, mood: moodFinal, hora: new Date().getHours() })
      });
    }
    carregarDados();
  };

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
    const domingo = new Date(hoje);
    domingo.setDate(hoje.getDate() - hoje.getDay());
    domingo.setHours(0, 0, 0, 0);
    return treinos.filter(t => new Date(t.data + "T00:00:00") >= domingo);
  }, [treinos]);

  const stats = useMemo(() => {
    const prefixoMes = `${dataExibida.getFullYear()}-${(dataExibida.getMonth() + 1).toString().padStart(2, '0')}`;
    const treinosNoMes = treinos.filter(t => t.data.startsWith(prefixoMes)).length;
    return {
      treinosNoMes,
      nomeMes: dataExibida.toLocaleDateString('pt-BR', { month: 'long' }),
      anoExibido: dataExibida.getFullYear(),
      metaMensal: metaSemanal * 4,
    };
  }, [treinos, metaSemanal, dataExibida]);

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
    } catch (e) { console.error(e); } finally { setIsExportando(false); }
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
        {activeTab === 'frequencia' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Header treinosCount={treinos.length} userName={userData.nome} />

            {/* Inserção do WaterTracker na Frequência */}
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

            <button onClick={compartilharFrequencia} disabled={isExportando} className="w-full bg-gradient-to-br from-orange-500 to-orange-700 font-black py-6 rounded-[32px] flex items-center justify-center gap-3 uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-50">
              {isExportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              {isExportando ? "GERANDO STATUS..." : "Exportar Evolução Mensal"}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <WeightTracker
              ultimoCiclo={userData.ultimoCiclo}
              duracaoCiclo={userData.duracaoCiclo}
              duracaoPeriodo={userData.duracaoPeriodo}
            />
          </div>
        )}
      </div>

      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-3xl border border-white/10 p-2.5 rounded-full shadow-2xl flex gap-3 z-50">
        <button onClick={() => setActiveTab('frequencia')} className={`flex items-center gap-3 px-10 py-5 rounded-full font-black text-[10px] uppercase transition-all ${activeTab === 'frequencia' ? 'bg-orange-500 text-white shadow-xl scale-105' : 'text-slate-500'}`}>
          <Calendar className="w-4 h-4" /> Treinos
        </button>
        <button onClick={() => setActiveTab('peso')} className={`flex items-center gap-3 px-10 py-5 rounded-full font-black text-[10px] uppercase transition-all ${activeTab === 'peso' ? 'bg-orange-500 text-white shadow-xl scale-105' : 'text-slate-500'}`}>
          <Scale className="w-4 h-4" /> Peso
        </button>
      </nav>

      {/* Card oculto para exportação */}
      <InstagramCard
        bateuMetaMensal={false} rank={{
          nome: '',
          emoji: ''
        }} treinouHoje={false} {...stats}
        metaMensalEstimada={stats.metaMensal}
        treinosCount={treinos.length}
        metaAnual={metaAnualDinamica}
        consistencia={Math.round((treinos.length / metaAnualDinamica) * 100) || 0}
        ano={stats.anoExibido}
        mesNome={stats.nomeMes}
        metaSemanal={metaSemanal}
        concluidosSemana={treinosDaSemana.length} />
    </main>
  );
}