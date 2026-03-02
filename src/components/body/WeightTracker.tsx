"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Scale, Plus, Loader2, History, TrendingUp, Share2, Droplets, Check } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toBlob } from 'html-to-image';
import { createBrowserClient } from '@supabase/ssr';

interface PesoRegistro {
  id: string;
  peso: number | string;
  data: string;
}

interface Props {
  ultimoCiclo?: string;
  duracaoCiclo?: number;
  duracaoPeriodo?: number;
}

export default function WeightTracker({ ultimoCiclo, duracaoCiclo, duracaoPeriodo }: Props) {
  const [pesoInput, setPesoInput] = useState('');
  const [historico, setHistorico] = useState<PesoRegistro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSalvando, setIsSalvando] = useState(false);
  const [isExportando, setIsExportando] = useState(false);

  const artRef = useRef<HTMLDivElement>(null);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const fetchPesos = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('historico_peso')
        .select('*')
        .eq('usuario_id', session.user.id)
        .order('data', { ascending: false });

      if (error) throw error;
      if (data) setHistorico(data);
    } catch (e) {
      console.error("[WeightTracker] Erro ao carregar histórico", e);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPesos();
  }, [fetchPesos]);

  const statusRetencao = useMemo(() => {
    if (!ultimoCiclo || !duracaoCiclo) return null;
    const hoje = new Date();
    const inicio = new Date(ultimoCiclo + "T00:00:00");
    const diffDias = Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    const diaAtual = (diffDias % duracaoCiclo) + 1;
    const isPreMenstrual = diaAtual > (duracaoCiclo - 7);
    return { isPreMenstrual, diaAtual };
  }, [ultimoCiclo, duracaoCiclo]);

  const pesoAtual = useMemo(() => (historico.length > 0 ? Number(historico[0].peso) : 0), [historico]);
  const pesoInicial = useMemo(() => (historico.length > 0 ? Number(historico[historico.length - 1].peso) : 0), [historico]);
  const perdaTotal = useMemo(() => Math.max(0, pesoInicial - pesoAtual), [pesoInicial, pesoAtual]);

  const dadosGrafico = useMemo(() => {
    return [...historico]
      .reverse()
      .map(item => ({
        peso: Number(item.peso),
        data: new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      }));
  }, [historico]);

  const comp = useMemo(() => {
    const v = Math.abs(perdaTotal);
    if (v >= 10) return { texto: "DOIS SACOS DE ARROZ", emoji: "🍚" };
    if (v >= 5) return { texto: "UMA MELANCIA GRANDE", emoji: "🍉" };
    if (v >= 2) return { texto: "UMA GARRAFA DE 2L", emoji: "🥤" };
    return { texto: "UM HALTERE LEVE", emoji: "🏋️‍♂️" };
  }, [perdaTotal]);

  const handleSalvar = async () => {
    const pesoLimpo = pesoInput.replace(',', '.');
    if (!pesoLimpo || isNaN(Number(pesoLimpo)) || isSalvando) return;

    setIsSalvando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.from('historico_peso').insert({
        usuario_id: session.user.id,
        peso: Number(pesoLimpo),
        data: new Date().toISOString()
      });

      if (!error) {
        setPesoInput('');
        fetchPesos();
      }
    } catch (e) {
      console.error("Erro ao salvar peso");
    } finally {
      setIsSalvando(false);
    }
  };

  const handleExportarSocial = async () => {
    if (!artRef.current || isExportando) return;
    setIsExportando(true);

    try {
      await new Promise(r => setTimeout(r, 600));

      const blob = await toBlob(artRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#020617',
        cacheBust: true,
      });

      if (!blob) throw new Error("Falha ao gerar o arquivo de imagem");

      const arquivo = new File([blob], `evolucao-ignite.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [arquivo] })) {
        await navigator.share({
          files: [arquivo],
          title: 'Evolução Ignite',
          text: 'O trabalho devolve! 🔥 #GymIgnite',
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `evolucao-ignite.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Erro ao exportar:", e);
      alert("Não foi possível gerar a imagem. Tente novamente.");
    } finally {
      setIsExportando(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* --- ARTE INVISÍVEL PARA STORIES (ENQUADRAMENTO PERFEITO) --- */}
      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
        <div ref={artRef} style={{ width: '1080px', height: '1920px', backgroundColor: '#020617', display: 'flex', flexDirection: 'column', padding: '160px 100px', boxSizing: 'border-box', fontFamily: 'sans-serif' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', width: '100%' }}>
            <h1 style={{ fontSize: '110px', fontWeight: '900', fontStyle: 'italic', margin: 0, letterSpacing: '-4px' }}>
              <span style={{ color: 'white' }}>GYM</span> <span style={{ color: '#f97316' }}>IGNITE</span>
            </h1>
            <p style={{ color: '#475569', fontSize: '32px', fontWeight: '900', letterSpacing: '12px', margin: '30px 0 0 0', textTransform: 'uppercase' }}>EVOLUÇÃO CORPORAL</p>
          </div>

          {/* Pesos (Agora com muito espaço entre eles) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '160px', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'left' }}>
              <p style={{ color: '#475569', fontSize: '28px', fontWeight: '900', margin: '0 0 16px 0', textTransform: 'uppercase' }}>INICIAL</p>
              <p style={{ color: 'white', fontSize: '75px', fontWeight: '900', fontStyle: 'italic', margin: 0 }}>{pesoInicial.toFixed(1)}kg</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#475569', fontSize: '28px', fontWeight: '900', margin: '0 0 16px 0', textTransform: 'uppercase' }}>ATUAL</p>
              <p style={{ color: 'white', fontSize: '75px', fontWeight: '900', fontStyle: 'italic', margin: 0 }}>{pesoAtual.toFixed(1)}kg</p>
            </div>
          </div>

          {/* Caixa Laranja (Arredondamento mais elegante e padding seguro) */}
          <div style={{ backgroundColor: '#f97316', width: '100%', borderRadius: '64px', padding: '80px 40px', marginTop: '120px', textAlign: 'center', boxShadow: '0 30px 60px rgba(249,115,22,0.2)', boxSizing: 'border-box' }}>
            <p style={{ color: 'white', fontSize: '32px', fontWeight: '900', margin: '0 0 20px 0', textTransform: 'uppercase' }}>TOTAL ELIMINADO</p>
            <p style={{ color: 'white', fontSize: '150px', fontWeight: '900', fontStyle: 'italic', margin: 0, lineHeight: '1', letterSpacing: '-4px', whiteSpace: 'nowrap' }}>-{perdaTotal.toFixed(1)} KG</p>
          </div>

          {/* Caixa de Emoji e Texto */}
          <div style={{ marginTop: '80px', backgroundColor: '#0f172a', padding: '80px 60px', borderRadius: '64px', border: '2px solid #1e293b', width: '100%', textAlign: 'center', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '120px', display: 'block', marginBottom: '40px' }}>{comp.emoji}</span>
            <p style={{ color: 'white', fontSize: '38px', fontWeight: '900', lineHeight: '1.4', margin: 0, textTransform: 'uppercase' }}>
              "EQUIVALE A <span style={{ color: '#f97316' }}>{comp.texto}</span> QUE VOCÊ NÃO CARREGA MAIS!"
            </p>
          </div>

          {/* Rodapé Minimalista */}
          <p style={{ marginTop: 'auto', color: '#1e293b', fontSize: '32px', fontWeight: '900', letterSpacing: '16px', marginBottom: 0, textAlign: 'center' }}>GYMIGNITE.APP</p>
        </div>
      </div>

      {/* --- UI VISÍVEL --- */}
      <header className="p-10 bg-slate-900/40 rounded-[40px] border border-white/5 text-center backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-orange-500/10 blur-3xl pointer-events-none" />
        <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter leading-none relative z-10">
          Corpo <span className="text-orange-500">& Peso</span>
        </h1>
        <p className="text-slate-500 text-[10px] font-black uppercase mt-3 tracking-[0.4em] relative z-10">Personal Tracker</p>
      </header>

      {statusRetencao && (
        <div className={`p-6 rounded-[32px] border flex items-start gap-4 transition-all duration-500 ${statusRetencao.isPreMenstrual ? "bg-blue-500/10 border-blue-500/20 shadow-lg shadow-blue-500/5" : "bg-emerald-500/10 border-emerald-500/20 shadow-lg shadow-emerald-500/5"}`}>
          <div className={`p-2.5 rounded-2xl ${statusRetencao.isPreMenstrual ? "bg-blue-500/20" : "bg-emerald-500/20"}`}>
            {statusRetencao.isPreMenstrual ? <Droplets className="text-blue-400 w-5 h-5 animate-pulse" /> : <Check className="text-emerald-400 w-5 h-5" />}
          </div>
          <div className="space-y-1">
            <h4 className={`text-[11px] font-black uppercase tracking-widest ${statusRetencao.isPreMenstrual ? "text-blue-400" : "text-emerald-400"}`}>Aviso Biológico</h4>
            <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
              {statusRetencao.isPreMenstrual ? "Você está na fase pré-menstrual. A balança pode oscilar até 2kg por retenção. Mantenha a calma!" : "Equilíbrio hídrico estável. Momento ideal para validar resultados reais."}
            </p>
          </div>
        </div>
      )}

      {historico.length > 1 && (
        <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 h-[320px] w-full">
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Evolução de Carga</span>
            </div>
            {perdaTotal > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-orange-500/20">-{perdaTotal.toFixed(1)} KG</span>
            )}
          </div>
          <ResponsiveContainer width="100%" height="70%">
            <AreaChart data={dadosGrafico}>
              <defs><linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.3} /><stop offset="95%" stopColor="#f97316" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
              <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: '900' }} dy={10} />
              <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip cursor={{ stroke: '#f97316', strokeWidth: 1 }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '20px', fontSize: '12px' }} itemStyle={{ color: '#f97316', fontWeight: '900' }} />
              <Area type="monotone" dataKey="peso" stroke="#f97316" strokeWidth={4} fill="url(#colorPeso)" animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-slate-900/50 p-8 rounded-[40px] border border-white/5 shadow-xl">
        <div className="flex items-center gap-4 mb-8"><Scale className="text-orange-500 w-6 h-6" /><h2 className="text-xl font-black uppercase text-white italic">Check-in Balança</h2></div>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input type="text" inputMode="decimal" value={pesoInput} onChange={(e) => setPesoInput(e.target.value.replace(/[^0-9,.]/g, ''))} placeholder="00.0" className="w-full bg-slate-800/50 border border-white/10 rounded-3xl py-6 px-8 text-3xl font-black text-white outline-none focus:border-orange-500/50 transition-all shadow-inner" />
            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-600 font-black text-xs">KG</span>
          </div>
          <button onClick={handleSalvar} disabled={isSalvando || !pesoInput} className="bg-orange-500 text-white px-8 rounded-3xl transition-all active:scale-90 shadow-xl shadow-orange-500/40 flex items-center justify-center">
            {isSalvando ? <Loader2 className="animate-spin" /> : <Plus className="w-8 h-8" strokeWidth={4} />}
          </button>
        </div>
      </div>

      {historico.length > 0 && (
        <button onClick={handleExportarSocial} disabled={isExportando} className="w-full bg-slate-800 hover:bg-slate-700 p-6 rounded-[32px] border border-white/5 flex items-center justify-center gap-4 transition-all active:scale-95 group">
          {isExportando ? <Loader2 className="w-5 h-5 animate-spin text-orange-500" /> : <Share2 className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />}
          <span className="text-[11px] font-black uppercase text-white tracking-[0.2em]">{isExportando ? "Processando Arte..." : "Exportar Evolução Corporal"}</span>
        </button>
      )}

      <div className="bg-slate-900/50 p-8 rounded-[40px] border border-white/5">
        <div className="flex items-center gap-3 mb-8 text-slate-500"><History size={14} /><span className="text-[10px] font-black uppercase tracking-[0.3em]">Histórico de Pesagem</span></div>
        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-orange-500 w-8 h-8" /></div> : historico.map((item) => (
          <div key={item.id} className="flex justify-between items-center p-6 bg-white/[0.02] rounded-[28px] border border-white/5 mb-4 group hover:border-orange-500/20 transition-colors">
            <span className="text-2xl font-black text-white italic">{Number(item.peso).toFixed(1)}<span className="text-sm ml-1 text-slate-500">kg</span></span>
            <div className="text-right">
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-tighter leading-none">Registrado em</p>
              <p className="text-white font-black text-xs uppercase mt-1">{new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}