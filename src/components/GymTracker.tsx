"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Share2, Calendar, Scale, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import { createBrowserClient } from '@supabase/ssr';

// Componentes Existentes
import MonthlyCalendar from '@/components/MonthlyCalendar';
import Header from '@/components/dashboard/Header';
import GoalEditor from '@/components/dashboard/GoalEditor';
import InstagramCard from '@/components/social/InstagramCard';
import BadgeGrid from '@/components/achievements/BadgeGrid';
import WeightTracker from '@/components/body/WeightTracker';
import WeeklyProgress from '@/components/dashboard/WeeklyProgress';

// Novos Componentes de Saúde
import CyclePredictor from '@/components/dashboard/CyclePredictor';
import FemaleOnboarding from '@/components/dashboard/FemaleOnboarding';

interface Treino {
  id: string;
  data: string;
  hora: number;
}

export default function GymTracker() {
  const [activeTab, setActiveTab] = useState<'frequencia' | 'peso'>('frequencia');
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [feriados, setFeriados] = useState<{ date: string }[]>([]);
  const [metaSemanal, setMetaSemanal] = useState(4);
  const [userData, setUserData] = useState({
    nome: 'Atleta',
    createdAt: '',
    sexo: '',
    ultimoCiclo: '',
    duracaoCiclo: 28
  });
  const [isEditingMetas, setIsEditingMetas] = useState(false);
  const [isCarregado, setIsCarregado] = useState(false);
  const [isExportando, setIsExportando] = useState(false);
  const [dataExibida, setDataExibida] = useState(new Date());

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const carregarDados = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const [perfilRes, treinosRes] = await Promise.all([
          supabase.from('perfis')
            .select('nome, meta_semanal, created_at, sexo, ultimo_ciclo, duracao_ciclo')
            .eq('id', session.user.id)
            .single(),
          fetch('/api/treinos').then(r => r.json())
        ]);

        if (perfilRes.data) {
          setUserData({
            nome: perfilRes.data.nome || 'Atleta',
            createdAt: perfilRes.data.created_at,
            sexo: perfilRes.data.sexo,
            ultimoCiclo: perfilRes.data.ultimo_ciclo,
            duracaoCiclo: perfilRes.data.duracao_ciclo || 28
          });
          setMetaSemanal(perfilRes.data.meta_semanal || 4);
        }
        if (Array.isArray(treinosRes)) setTreinos(treinosRes);
      }
      const resFeriados = await fetch(`https://brasilapi.com.br/api/feriados/v1/2026`);
      const feriadosData = await resFeriados.json();
      setFeriados(Array.isArray(feriadosData) ? feriadosData : []);
    } catch (e) {
      console.error("Erro na sincronização:", e);
    } finally {
      setIsCarregado(true);
    }
  }, [supabase]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  // Salva dados iniciais do ciclo
  const handleSaveCycle = async (data: { ultimo_ciclo: string, duracao_ciclo: number }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { error } = await supabase
        .from('perfis')
        .update({
          ultimo_ciclo: data.ultimo_ciclo,
          duracao_ciclo: data.duracao_ciclo
        })
        .eq('id', session.user.id);

      if (!error) carregarDados();
    }
  };

  // Reseta o ciclo para o dia de hoje (Menstruação desceu)
  // Dentro do seu page.tsx, mude a handleResetCycle:
  const handleResetCycle = async (novaData: string, novaDuracao: number) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const { error } = await supabase
        .from('perfis')
        .update({
          ultimo_ciclo: novaData,
          duracao_ciclo: novaDuracao
        })
        .eq('id', session.user.id);

      if (!error) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ef4444', '#f97316', '#ffffff']
        });
        carregarDados();
      }
    }
  };

  // Cálculos de Status e Ranks
  const rankAtual = useMemo(() => {
    const total = treinos.length;
    if (total <= 10) return { nome: "Iniciante", emoji: "🐣" };
    if (total <= 30) return { nome: "Focado", emoji: "🔥" };
    if (total <= 80) return { nome: "Constante", emoji: "🏋️‍♂️" };
    return { nome: "Gladiador", emoji: "🛡️" };
  }, [treinos.length]);

  const metaAnualDinamica = useMemo(() => {
    const hoje = new Date();
    const dataCadastro = userData.createdAt ? new Date(userData.createdAt) : new Date(hoje.getFullYear(), 0, 1);
    const inicioCalculo = dataCadastro.getFullYear() < hoje.getFullYear() ? new Date(hoje.getFullYear(), 0, 1) : dataCadastro;
    const fimDoAno = new Date(hoje.getFullYear(), 11, 31);
    const diffEmDias = Math.ceil((fimDoAno.getTime() - inicioCalculo.getTime()) / (1000 * 60 * 60 * 24));
    const semanasRestantes = diffEmDias / 7;
    return Math.max(1, Math.floor(semanasRestantes * metaSemanal));
  }, [metaSemanal, userData.createdAt]);

  const treinosDaSemana = useMemo(() => {
    const hoje = new Date();
    const diaDaSemana = hoje.getDay();
    const diffParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;
    const segundaFeira = new Date(hoje);
    segundaFeira.setDate(hoje.getDate() + diffParaSegunda);
    segundaFeira.setHours(0, 0, 0, 0);

    return treinos.filter(t => {
      const dataTreino = new Date(t.data + "T00:00:00");
      return dataTreino >= segundaFeira && dataTreino <= hoje;
    });
  }, [treinos]);

  const treinouHoje = useMemo(() => {
    const hojeLocal = new Date().toLocaleDateString('en-CA');
    return treinos.some(t => t.data === hojeLocal);
  }, [treinos]);

  const statsSimplificados = useMemo(() => {
    const prefixoMes = `${dataExibida.getFullYear()}-${(dataExibida.getMonth() + 1).toString().padStart(2, '0')}`;
    const treinosNoMes = treinos.filter(t => t.data.startsWith(prefixoMes)).length;
    return {
      treinosNoMes,
      nomeMes: dataExibida.toLocaleDateString('pt-BR', { month: 'long' }),
      anoExibido: dataExibida.getFullYear(),
      bateuMetaMensal: treinosNoMes >= (metaSemanal * 4),
      metaMensal: metaSemanal * 4
    };
  }, [treinos, metaSemanal, dataExibida]);

  const toggleTreino = async (dataIso: string) => {
    const existe = treinos.some(t => t.data === dataIso);
    if (!existe) confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 }, colors: ['#f97316', '#ffffff', '#fb923c'] });
    const treinosAnteriores = [...treinos];
    if (existe) setTreinos(prev => prev.filter(t => t.data !== dataIso));
    else setTreinos(prev => [...prev, { id: 'temp', data: dataIso, hora: new Date().getHours() }]);
    try {
      const res = await fetch('/api/treinos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: dataIso, hora: new Date().getHours() }) });
      if (!res.ok) throw new Error();
      const atualizados = await fetch('/api/treinos').then(r => r.json());
      setTreinos(atualizados);
    } catch (e) { setTreinos(treinosAnteriores); }
  };

  const updateMeta = async (valor: number) => {
    setMetaSemanal(valor);
    const { data: session } = await supabase.auth.getSession();
    if (session.session) await supabase.from('perfis').update({ meta_semanal: valor }).eq('id', session.session.user.id);
  };

  const compartilharFrequencia = async () => {
    const node = document.getElementById('resumo-mensal-card');
    if (!node) return;
    setIsExportando(true);
    try {
      const dataUrl = await toPng(node, { quality: 1, pixelRatio: 2, cacheBust: true, backgroundColor: '#020617' });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const arquivo = new File([blob], `gym-ignite-${statsSimplificados.nomeMes}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [arquivo] })) await navigator.share({ files: [arquivo], title: 'Gym Ignite Status' });
      else { const link = document.createElement('a'); link.download = `gym-ignite-${statsSimplificados.nomeMes}.png`; link.href = dataUrl; link.click(); }
    } catch (e) { console.error("Erro na exportação:", e); }
    finally { setIsExportando(false); }
  };

  if (!isCarregado) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.5em] animate-pulse">Sincronizando Chama</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#020617] text-slate-50 p-4 md:p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        {activeTab === 'frequencia' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Header
              treinosCount={treinos.length}
              metaSemanal={metaSemanal}
              userName={userData.nome}
              onSolicitarNotificacao={() => { }} // Passe uma função vazia ou a lógica de push
            />

            {/* Sistema Biológico Integrado */}
            {userData.sexo === 'feminino' && (
              userData.ultimoCiclo ? (
                <CyclePredictor
                  ultimoCiclo={userData.ultimoCiclo}
                  duracaoCiclo={userData.duracaoCiclo}
                  onReset={handleResetCycle} // Função atualizada
                />
              ) : (
                <FemaleOnboarding onSave={handleSaveCycle} />
              )
            )}

            <WeeklyProgress treinos={treinos} metaSemanal={metaSemanal} />
            <GoalEditor metaSemanal={metaSemanal} metaAnual={metaAnualDinamica} onUpdateMeta={updateMeta} isEditing={isEditingMetas} setIsEditing={setIsEditingMetas} />
            <MonthlyCalendar treinos={treinos} onToggleTreino={toggleTreino} onMonthChange={setDataExibida} />
            <BadgeGrid treinos={treinos} feriados={feriados} mesReferencia={dataExibida} metaSemanal={metaSemanal} />

            <button onClick={compartilharFrequencia} disabled={isExportando} className="w-full bg-gradient-to-br from-orange-500 to-orange-700 font-black py-6 rounded-[32px] flex items-center justify-center gap-3 uppercase text-xs tracking-widest shadow-2xl shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50">
              {isExportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              {isExportando ? "GERANDO STATUS..." : "Exportar Evolução Mensal"}
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="p-12 bg-slate-900/40 rounded-[48px] border border-white/5 text-center backdrop-blur-xl">
              <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter">Corpo <span className="text-orange-500">& Peso</span></h1>
              <p className="text-slate-500 text-[10px] font-black uppercase mt-3 tracking-[0.5em]">Personal Tracker</p>
            </header>
            <WeightTracker />
          </div>
        )}
      </div>

      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-3xl border border-white/10 p-2.5 rounded-full shadow-2xl flex gap-3 z-50">
        <button onClick={() => setActiveTab('frequencia')} className={`flex items-center gap-3 px-10 py-5 rounded-full font-black text-[10px] uppercase transition-all ${activeTab === 'frequencia' ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/40 scale-105' : 'text-slate-500 hover:text-slate-300'}`}>
          <Calendar className="w-4 h-4" /> Treinos
        </button>
        <button onClick={() => setActiveTab('peso')} className={`flex items-center gap-3 px-10 py-5 rounded-full font-black text-[10px] uppercase transition-all ${activeTab === 'peso' ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/40 scale-105' : 'text-slate-500 hover:text-slate-300'}`}>
          <Scale className="w-4 h-4" /> Peso
        </button>
      </nav>

      <InstagramCard
        treinosCount={treinos.length}
        metaAnual={metaAnualDinamica}
        consistencia={Math.round((treinos.length / metaAnualDinamica) * 100) || 0}
        treinosNoMes={statsSimplificados.treinosNoMes}
        metaMensalEstimada={statsSimplificados.metaMensal}
        bateuMetaMensal={statsSimplificados.bateuMetaMensal}
        rank={rankAtual}
        treinouHoje={treinouHoje}
        mesNome={statsSimplificados.nomeMes}
        ano={statsSimplificados.anoExibido}
        concluidosSemana={treinosDaSemana.length}
        metaSemanal={metaSemanal}
      />
    </main>
  );
}