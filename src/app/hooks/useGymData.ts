import { useState, useEffect, useCallback, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import confetti from 'canvas-confetti';

// Interface exportada para que o page.tsx possa usá-la nos filtros
export interface Treino {
  id: string;
  data: string;
  hora: number;
  mood?: string;
}

export function useGymData() {
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [metaSemanal, setMetaSemanal] = useState(4);
  const [isCarregado, setIsCarregado] = useState(false);
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
      if (!session) return;

      const userId = session.user.id;

      // Executa buscas em paralelo para performance máxima
      const [perfilRes, treinosRes, pesoRes] = await Promise.all([
        supabase.from('perfis').select('*').eq('id', userId).maybeSingle(),
        fetch('/api/treinos').then(r => r.ok ? r.json() : []),
        supabase.from('historico_peso')
          .select('peso')
          .eq('usuario_id', userId)
          .order('data', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      if (perfilRes.data) {
        setUserData({
          id: userId,
          nome: perfilRes.data.nome || 'Atleta',
          createdAt: perfilRes.data.created_at,
          sexo: perfilRes.data.sexo,
          ultimoCiclo: perfilRes.data.ultimo_ciclo,
          duracaoCiclo: perfilRes.data.duracao_ciclo || 28,
          duracaoPeriodo: perfilRes.data.duracao_periodo || 5,
          pesoAtual: pesoRes.data?.peso || 0
        });
        setMetaSemanal(perfilRes.data.meta_semanal || 4);
      }

      if (Array.isArray(treinosRes)) {
        setTreinos(treinosRes);
      }
    } catch (e) {
      console.error("[useGymData Error]:", e);
    } finally {
      setIsCarregado(true);
    }
  }, [supabase]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const confirmarAcaoTreino = useCallback(async (dataIso: string, moodSelecionado: string | null, isDelete = false) => {
    // UI Otimista: Atualiza a tela antes mesmo do banco responder para parecer instantâneo
    const treinosAnteriores = [...treinos];

    if (isDelete) {
      setTreinos(prev => prev.filter(t => t.data !== dataIso));
      try {
        await fetch('/api/treinos', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: dataIso })
        });
      } catch (e) {
        setTreinos(treinosAnteriores); // Reverte se der erro
      }
    } else {
      const moodFinal = moodSelecionado || '🏆';
      const novoTreino: Treino = {
        id: 'temp-' + Math.random(),
        data: dataIso,
        hora: new Date().getHours(),
        mood: moodFinal
      };

      setTreinos(prev => [...prev, novoTreino]);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });

      try {
        await fetch('/api/treinos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: dataIso, mood: moodFinal, hora: novoTreino.hora })
        });
      } catch (e) {
        setTreinos(treinosAnteriores); // Reverte se der erro
      }
    }
    carregarDados();
  }, [treinos, carregarDados]);

  const handleUpdateMeta = async (novaMeta: number) => {
    setMetaSemanal(novaMeta);
    if (userData.id) {
      await supabase.from('perfis').update({ meta_semanal: novaMeta }).eq('id', userData.id);
    }
  };

  const handleUpdateCycle = async (novaData: string, novaDuracao: number, novaDuracaoPeriodo: number) => {
    if (userData.id) {
      await supabase.from('perfis')
        .update({
          ultimo_ciclo: novaData,
          duracao_ciclo: novaDuracao,
          duracao_periodo: novaDuracaoPeriodo
        })
        .eq('id', userData.id);

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      carregarDados();
    }
  };

  return {
    treinos,
    metaSemanal,
    handleUpdateMeta,
    isCarregado,
    userData,
    confirmarAcaoTreino,
    carregarDados,
    handleUpdateCycle
  };
}