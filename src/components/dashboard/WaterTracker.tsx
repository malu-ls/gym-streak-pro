"use client";

import { Droplets, Plus, Loader2, Keyboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface WaterTrackerProps {
  userId: string;
}

export default function WaterTracker({ userId }: WaterTrackerProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [consumido, setConsumido] = useState(0);
  const [pesoAtual, setPesoAtual] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [valorPersonalizado, setValorPersonalizado] = useState<string>('');

  const hoje = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      try {
        const { data: pesoData } = await supabase
          .from('historico_peso')
          .select('peso')
          .eq('usuario_id', userId)
          .order('data', { ascending: false })
          .limit(1)
          .single();

        if (pesoData) setPesoAtual(pesoData.peso);

        const { data: waterData } = await supabase
          .from('water_logs')
          .select('consumed_ml')
          .eq('user_id', userId)
          .eq('date', hoje)
          .single();

        if (waterData) setConsumido(waterData.consumed_ml);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId, hoje, supabase]);

  const metaMl = Math.round((pesoAtual || 70) * 35);
  const porcentagem = Math.min((consumido / metaMl) * 100, 100);

  const adicionarAgua = async (quantidade: number) => {
    if (isSaving || quantidade <= 0) return;
    const novoTotal = consumido + quantidade;
    setConsumido(novoTotal);
    setIsSaving(true);

    try {
      await supabase.from('water_logs').upsert({
        user_id: userId,
        date: hoje,
        consumed_ml: novoTotal,
        goal_ml: metaMl
      }, { onConflict: 'user_id,date' });

      setValorPersonalizado(''); // Limpa o campo após adicionar
    } catch (err) {
      console.error("Erro ao salvar:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="h-64 w-full bg-slate-900/40 animate-pulse rounded-[32px]" />;

  return (
    <div className="bg-slate-900/60 border border-white/5 rounded-[32px] p-6 w-full shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/20">
            <Droplets className="text-blue-400 w-7 h-7" />
          </div>
          <div>
            <h3 className="text-white font-black italic uppercase text-lg leading-none">Hidratação</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
              Meta: {(metaMl / 1000).toFixed(1)}L (Base: {pesoAtual || '--'}kg)
            </p>
          </div>
        </div>
        <span className="text-blue-400 font-black italic text-2xl">{Math.round(porcentagem)}%</span>
      </div>

      {/* Barra de Progresso */}
      <div className="relative w-full h-4 bg-slate-800/50 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          style={{ width: `${porcentagem}%` }}
        />
      </div>

      {/* Botões Rápidos */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[250, 500, 1000].map((ml) => (
          <button
            key={ml}
            onClick={() => adicionarAgua(ml)}
            disabled={isSaving}
            className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex flex-col items-center justify-center gap-1 border border-blue-500/10 transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="text-xs">{ml >= 1000 ? '1L' : `${ml}ml`}</span>
          </button>
        ))}
      </div>

      {/* Campo Personalizado */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            type="number"
            value={valorPersonalizado}
            onChange={(e) => setValorPersonalizado(e.target.value)}
            placeholder="Qtd personalizada (ml)..."
            className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-4 px-5 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          <Keyboard className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
        </div>
        <button
          onClick={() => adicionarAgua(Number(valorPersonalizado))}
          disabled={isSaving || !valorPersonalizado}
          className="bg-blue-500 text-white p-4 rounded-2xl font-black transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
        >
          {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} strokeWidth={3} />}
        </button>
      </div>
    </div>
  );
}