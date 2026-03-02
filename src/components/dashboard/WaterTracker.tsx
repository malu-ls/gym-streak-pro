"use client";

import { Droplets, Plus, Loader2, Keyboard } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface WaterTrackerProps {
  userId: string;
}

export default function WaterTracker({ userId }: WaterTrackerProps) {
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const [consumido, setConsumido] = useState(0);
  const [pesoAtual, setPesoAtual] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [valorPersonalizado, setValorPersonalizado] = useState<string>('');

  const hoje = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
    }).format(new Date());
  }, []);

  const fetchData = useCallback(async () => {
    // TRAVA 1: Se não houver userId, não tenta buscar nada
    if (!userId) return;

    try {
      const [pesoRes, waterRes] = await Promise.all([
        supabase
          .from('historico_peso')
          .select('peso')
          .eq('usuario_id', userId)
          .order('data', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('water_logs')
          .select('consumed_ml')
          .eq('user_id', userId)
          .eq('date', hoje)
          .maybeSingle()
      ]);

      if (pesoRes?.data) setPesoAtual(pesoRes.data.peso);
      if (waterRes?.data) setConsumido(waterRes.data.consumed_ml);
    } catch (err) {
      console.error("[WaterTracker] Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, hoje, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const metaMl = Math.round((pesoAtual || 70) * 35);
  const porcentagem = Math.min((consumido / metaMl) * 100, 100);

  const adicionarAgua = async (quantidade: number) => {
    // TRAVA 2: Segurança máxima antes do salvamento
    if (!userId || isSaving || isNaN(quantidade) || quantidade <= 0) return;

    const novoTotal = consumido + quantidade;
    const cacheAnterior = consumido;

    setConsumido(novoTotal);
    setIsSaving(true);

    try {
      const { error } = await supabase.from('water_logs').upsert({
        user_id: userId,
        date: hoje,
        consumed_ml: novoTotal,
        goal_ml: metaMl
      }, {
        onConflict: 'user_id,date',
        ignoreDuplicates: false
      });

      if (error) throw error;
      setValorPersonalizado('');
    } catch (err) {
      console.error("[WaterTracker] Erro ao salvar:", err);
      setConsumido(cacheAnterior); // Rollback se der erro
      alert("Erro ao sincronizar água. Verifique sua conexão.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="h-64 w-full bg-slate-900/40 animate-pulse rounded-[32px] border border-white/5" />
  );

  return (
    <div className="bg-slate-900/60 border border-white/5 rounded-[32px] p-6 w-full shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-blue-500/5 blur-[50px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-inner">
            <Droplets className="text-blue-400 w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-white font-black italic uppercase text-lg leading-none tracking-tight">Hidratação</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">
              Meta: {(metaMl / 1000).toFixed(1)}L <span className="text-slate-700 ml-1">/</span> {pesoAtual || '--'}kg
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-blue-400 font-black italic text-3xl tracking-tighter">{Math.round(porcentagem)}%</span>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="relative w-full h-3 bg-slate-950/50 rounded-full overflow-hidden mb-8 border border-white/5">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          style={{ width: `${porcentagem}%` }}
        />
      </div>

      {/* Botões Rápidos */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[250, 500, 1000].map((ml) => (
          <button
            key={ml}
            type="button"
            onClick={() => adicionarAgua(ml)}
            disabled={isSaving}
            className="bg-slate-800/40 hover:bg-blue-500/20 text-blue-400 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/5 hover:border-blue-500/30 transition-all active:scale-90 disabled:opacity-50"
          >
            {ml >= 1000 ? '1 Litro' : `${ml}ml`}
          </button>
        ))}
      </div>

      {/* Campo Personalizado */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            type="number"
            inputMode="numeric"
            value={valorPersonalizado}
            onChange={(e) => setValorPersonalizado(e.target.value)}
            placeholder="Adicionar ml..."
            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 px-5 text-sm font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 transition-all shadow-inner"
          />
          <Keyboard className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 w-4 h-4" />
        </div>
        <button
          type="button"
          onClick={() => adicionarAgua(Number(valorPersonalizado))}
          disabled={isSaving || !valorPersonalizado}
          className="bg-blue-500 hover:bg-blue-600 text-white px-5 rounded-2xl font-black transition-all active:scale-95 disabled:opacity-30 disabled:grayscale shadow-lg shadow-blue-500/20"
        >
          {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Plus size={22} strokeWidth={4} />}
        </button>
      </div>
    </div>
  );
}