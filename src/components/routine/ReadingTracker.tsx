"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BookOpen, Search, Star, Plus, Loader2, BookMarked, Trophy, Trash2, Edit3, X, Target, Check } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface Livro {
  id: string;
  titulo: string;
  autor: string;
  capa_url: string;
  total_paginas: number;
  pagina_atual: number;
  status: string;
  avaliacao: number;
  data_fim?: string; // NOVO: Para calcularmos se o livro foi lido neste ano
}

interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    pageCount?: number;
    imageLinks?: {
      thumbnail?: string;
    };
  };
}

export default function ReadingTracker() {
  const [livroAtual, setLivroAtual] = useState<Livro | null>(null);
  const [historico, setHistorico] = useState<Livro[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // NOVO: Estados da Meta Anual
  const [metaAnual, setMetaAnual] = useState<number>(12);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [novaMetaInput, setNovaMetaInput] = useState('');
  const [isSalvandoMeta, setIsSalvandoMeta] = useState(false);

  // Estados da Busca API
  const [busca, setBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<GoogleBookItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Estados para Adição Manual
  const [isAdicionandoManual, setIsAdicionandoManual] = useState(false);
  const [manualTitulo, setManualTitulo] = useState('');
  const [manualAutor, setManualAutor] = useState('');
  const [manualPaginas, setManualPaginas] = useState('');

  // Estados de Atualização
  const [novaPagina, setNovaPagina] = useState('');
  const [isAtualizando, setIsAtualizando] = useState(false);
  const [showAvaliacao, setShowAvaliacao] = useState(false);
  const [notaDada, setNotaDada] = useState(0);

  // Estado para o Modal Customizado de Exclusão
  const [livroParaRemover, setLivroParaRemover] = useState<{ id: string, isAtual: boolean } | null>(null);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const carregarDados = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Busca os livros E o perfil do usuário (para pegar a meta) ao mesmo tempo
      const [livrosRes, perfilRes] = await Promise.all([
        supabase.from('livros').select('*').eq('user_id', session.user.id).order('data_inicio', { ascending: false }),
        supabase.from('perfis').select('meta_anual_livros').eq('id', session.user.id).single()
      ]);

      if (perfilRes.data && perfilRes.data.meta_anual_livros) {
        setMetaAnual(perfilRes.data.meta_anual_livros);
      }

      if (livrosRes.data) {
        const lendo = livrosRes.data.find(l => l.status === 'lendo');
        const finalizados = livrosRes.data.filter(l => l.status === 'finalizado');

        setLivroAtual(lendo || null);
        setHistorico(finalizados);
      }
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // NOVO: Função para salvar a nova meta anual
  const salvarMetaAnual = async () => {
    const metaNum = parseInt(novaMetaInput);
    if (isNaN(metaNum) || metaNum <= 0) return;

    setIsSalvandoMeta(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.from('perfis')
        .update({ meta_anual_livros: metaNum })
        .eq('id', session.user.id);

      if (!error) {
        setMetaAnual(metaNum);
        setIsEditingMeta(false);
      }
    } catch (error) {
      console.error("Erro ao salvar meta", error);
    } finally {
      setIsSalvandoMeta(false);
    }
  };

  const buscarLivro = async (query: string) => {
    setBusca(query);
    if (query.length < 3) {
      setResultadosBusca([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
      const data = await res.json();
      if (data.items) {
        setResultadosBusca(data.items);
      }
    } catch (error) {
      console.error("Erro na API do Google Books", error);
    } finally {
      setIsSearching(false);
    }
  };

  const salvarNovoLivroBD = async (titulo: string, autor: string, capa: string, paginas: number) => {
    setIsAtualizando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.from('livros').insert({
        user_id: session.user.id,
        titulo: titulo,
        autor: autor,
        capa_url: capa,
        total_paginas: paginas,
        pagina_atual: 0,
        status: 'lendo'
      });

      if (!error) {
        setBusca('');
        setResultadosBusca([]);
        setIsAdicionandoManual(false);
        setManualTitulo('');
        setManualAutor('');
        setManualPaginas('');
        carregarDados();
      }
    } finally {
      setIsAtualizando(false);
    }
  };

  const iniciarLeitura = async (book: GoogleBookItem) => {
    const info = book.volumeInfo;
    const paginas = info.pageCount || 300;
    const capa = info.imageLinks?.thumbnail?.replace('http:', 'https:') || '';
    salvarNovoLivroBD(info.title, info.authors ? info.authors[0] : 'Autor Desconhecido', capa, paginas);
  };

  const iniciarLeituraManual = async () => {
    if (!manualTitulo || !manualPaginas) return;
    const paginas = parseInt(manualPaginas);
    if (isNaN(paginas) || paginas <= 0) return;
    salvarNovoLivroBD(manualTitulo, manualAutor || 'Autor Desconhecido', '', paginas);
  };

  const atualizarPagina = async () => {
    if (!livroAtual || !novaPagina) return;
    let pag = parseInt(novaPagina);
    if (pag > livroAtual.total_paginas) pag = livroAtual.total_paginas;

    setIsAtualizando(true);
    try {
      const { error } = await supabase.from('livros')
        .update({ pagina_atual: pag })
        .eq('id', livroAtual.id);

      if (!error) {
        setLivroAtual({ ...livroAtual, pagina_atual: pag });
        setNovaPagina('');
        if (pag >= livroAtual.total_paginas) {
          setShowAvaliacao(true);
        }
      }
    } finally {
      setIsAtualizando(false);
    }
  };

  const finalizarLivro = async () => {
    if (!livroAtual) return;
    setIsAtualizando(true);
    try {
      const { error } = await supabase.from('livros')
        .update({
          status: 'finalizado',
          avaliacao: notaDada,
          data_fim: new Date().toISOString()
        })
        .eq('id', livroAtual.id);

      if (!error) {
        setShowAvaliacao(false);
        carregarDados();
      }
    } finally {
      setIsAtualizando(false);
    }
  };

  const confirmarRemocao = async () => {
    if (!livroParaRemover) return;
    setIsAtualizando(true);
    try {
      const { error } = await supabase.from('livros').delete().eq('id', livroParaRemover.id);
      if (!error) {
        if (livroParaRemover.isAtual) {
          setLivroAtual(null);
          setNovaPagina('');
          setShowAvaliacao(false);
        } else {
          setHistorico(prev => prev.filter(l => l.id !== livroParaRemover.id));
        }
      }
    } catch (e) {
      console.error("Erro ao apagar livro", e);
    } finally {
      setIsAtualizando(false);
      setLivroParaRemover(null);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500 w-10 h-10" /></div>;

  const progressoLeituraAtual = livroAtual ? Math.round((livroAtual.pagina_atual / livroAtual.total_paginas) * 100) : 0;

  // Lógica de cálculo da Meta Anual
  const anoAtual = new Date().getFullYear();
  const livrosLidosEsteAno = historico.filter(l => l.data_fim && new Date(l.data_fim).getFullYear() === anoAtual).length;
  const progressoMeta = Math.min(100, Math.round((livrosLidosEsteAno / metaAnual) * 100)) || 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

      {/* --- MODAL DE CONFIRMAÇÃO DE EXCLUSÃO --- */}
      {livroParaRemover && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isAtualizando && setLivroParaRemover(null)}>
          <div
            className="bg-slate-900 border border-white/10 p-8 rounded-[48px] w-full max-w-[360px] shadow-[0_32px_64px_rgba(0,0,0,0.5)] animate-in zoom-in duration-300 text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 blur-3xl pointer-events-none" />
            <div className="w-16 h-16 bg-red-500/10 rounded-[20px] flex items-center justify-center mx-auto mb-6 border border-red-500/20 rotate-3">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white font-black uppercase italic tracking-tighter text-2xl leading-none mb-3">
              Apagar <span className="text-red-500">Livro?</span>
            </h3>
            <p className="text-slate-400 text-[11px] font-bold mb-8 px-2">
              Essa ação não pode ser desfeita. Todo o seu progresso neste livro será perdido.
            </p>
            <div className="space-y-3">
              <button onClick={confirmarRemocao} disabled={isAtualizando} className="w-full py-5 rounded-[24px] bg-red-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 active:scale-95 flex items-center justify-center">
                {isAtualizando ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sim, apagar livro'}
              </button>
              <button onClick={() => setLivroParaRemover(null)} disabled={isAtualizando} className="w-full py-3 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="p-8 bg-slate-900/40 rounded-[40px] border border-white/5 text-center backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 blur-3xl pointer-events-none" />
        <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter leading-none relative z-10 flex items-center justify-center gap-3">
          <BookOpen className="text-orange-500 w-8 h-8" /> Life <span className="text-orange-500">Tracker</span>
        </h1>
        <p className="text-slate-500 text-[10px] font-black uppercase mt-3 tracking-[0.4em] relative z-10">Controle de Leitura</p>
      </header>

      {/* --- NOVO: PAINEL DE META ANUAL --- */}
      <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 shadow-xl relative overflow-hidden">
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-500/5 blur-3xl pointer-events-none" />

        <div className="flex justify-between items-center mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <Target className="text-orange-500 w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-black uppercase tracking-widest text-[11px]">Meta de Leitura {anoAtual}</h3>
              <p className="text-slate-500 text-[10px] font-bold mt-0.5">Livros concluídos no ano</p>
            </div>
          </div>

          <button
            onClick={() => {
              setNovaMetaInput(metaAnual.toString());
              setIsEditingMeta(!isEditingMeta);
            }}
            className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 transition-colors"
          >
            {isEditingMeta ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          </button>
        </div>

        {isEditingMeta ? (
          <div className="flex gap-3 mt-4 relative z-10 animate-in fade-in slide-in-from-top-2">
            <input
              type="number"
              value={novaMetaInput}
              onChange={(e) => setNovaMetaInput(e.target.value)}
              className="flex-1 bg-slate-950/50 border border-white/10 rounded-2xl py-3 px-4 text-sm font-bold text-white outline-none focus:border-orange-500/50 transition-all text-center"
              placeholder="Quantos livros no ano?"
            />
            <button
              onClick={salvarMetaAnual}
              disabled={isSalvandoMeta || !novaMetaInput}
              className="bg-orange-500 text-white px-5 rounded-2xl flex items-center justify-center hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSalvandoMeta ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
            </button>
          </div>
        ) : (
          <div className="relative z-10 mt-2">
            <div className="flex justify-between items-end mb-2">
              <span className="text-2xl font-black italic text-white leading-none">{livrosLidosEsteAno} <span className="text-slate-500 text-sm">/ {metaAnual}</span></span>
              <span className="text-orange-500 font-black text-[10px] tracking-widest">{progressoMeta}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-linear-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-1000"
                style={{ width: `${progressoMeta}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* --- MODO: BUSCANDO OU ADICIONANDO NOVO LIVRO --- */}
      {!livroAtual && (
        <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 shadow-xl relative overflow-hidden">

          {!isAdicionandoManual ? (
            <>
              <div className="mb-6 text-center">
                <h3 className="text-white font-black uppercase text-lg italic">Qual sua próxima leitura?</h3>
                <p className="text-slate-500 text-xs mt-1">Busque pelo título ou autor</p>
              </div>

              <div className="relative mb-4">
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => buscarLivro(e.target.value)}
                  placeholder="Ex: Hábitos Atômicos..."
                  className="w-full bg-slate-800/50 border border-white/10 rounded-3xl py-4 pl-12 pr-6 text-sm font-bold text-white outline-none focus:border-orange-500/50 transition-all"
                />
                {isSearching ? (
                  <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 w-5 h-5 animate-spin" />
                ) : (
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                )}
              </div>

              <div className="space-y-3 mb-4">
                {resultadosBusca.map((book, index) => (
                  <div key={`${book.id}-${index}`} onClick={() => iniciarLeitura(book)} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl hover:bg-orange-500/10 border border-transparent hover:border-orange-500/20 cursor-pointer transition-all active:scale-95">
                    {book.volumeInfo.imageLinks?.thumbnail ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={book.volumeInfo.imageLinks.thumbnail} alt="Capa" className="w-12 h-16 object-cover rounded-md shadow-md" />
                    ) : (
                      <div className="w-12 h-16 bg-slate-800 rounded-md flex items-center justify-center"><BookMarked className="text-slate-600 w-5 h-5" /></div>
                    )}
                    <div className="flex-1">
                      <h4 className="text-white font-bold text-sm line-clamp-1">{book.volumeInfo.title}</h4>
                      <p className="text-slate-500 text-xs line-clamp-1">{book.volumeInfo.authors?.join(', ') || 'Desconhecido'}</p>
                    </div>
                    <Plus className="text-orange-500 w-5 h-5" />
                  </div>
                ))}
              </div>

              <button
                onClick={() => setIsAdicionandoManual(true)}
                className="w-full mt-2 py-4 bg-transparent border-2 border-dashed border-white/10 text-slate-500 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:border-orange-500/30 hover:text-orange-500 transition-all flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Não encontrou? Adicionar Manualmente
              </button>
            </>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-black uppercase text-lg italic">Adicionar Manualmente</h3>
                <button onClick={() => setIsAdicionandoManual(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-4 mb-2 block">Título do Livro *</label>
                  <input
                    type="text"
                    value={manualTitulo}
                    onChange={(e) => setManualTitulo(e.target.value)}
                    placeholder="Ex: A Palavra Que Resta"
                    className="w-full bg-slate-800/50 border border-white/10 rounded-3xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-orange-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-4 mb-2 block">Autor</label>
                  <input
                    type="text"
                    value={manualAutor}
                    onChange={(e) => setManualAutor(e.target.value)}
                    placeholder="Ex: Stênio Gardel"
                    className="w-full bg-slate-800/50 border border-white/10 rounded-3xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-orange-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-4 mb-2 block">Total de Páginas *</label>
                  <input
                    type="number"
                    value={manualPaginas}
                    onChange={(e) => setManualPaginas(e.target.value)}
                    placeholder="Ex: 160"
                    className="w-full bg-slate-800/50 border border-white/10 rounded-3xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-orange-500/50 transition-all"
                  />
                </div>
              </div>

              <button
                onClick={iniciarLeituraManual}
                disabled={isAtualizando || !manualTitulo || !manualPaginas}
                className="w-full py-5 bg-orange-500 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shadow-xl shadow-orange-500/20"
              >
                {isAtualizando ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Começar a Ler'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- MODO: LIVRO ATUAL --- */}
      {livroAtual && !showAvaliacao && (
        <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[80px] rounded-full pointer-events-none" />

          <button
            onClick={() => setLivroParaRemover({ id: livroAtual.id, isAtual: true })}
            className="absolute top-6 right-6 z-20 p-2 bg-slate-800 text-slate-500 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="flex gap-6 relative z-10">
            {livroAtual.capa_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={livroAtual.capa_url} alt="Capa" className="w-28 h-40 object-cover rounded-xl shadow-2xl border border-white/10" />
            ) : (
              <div className="w-28 h-40 bg-slate-800 rounded-xl flex items-center justify-center border border-white/10"><BookMarked className="text-slate-600 w-8 h-8" /></div>
            )}

            <div className="flex-1 flex flex-col justify-center pr-8">
              <span className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-2">Lendo Agora</span>
              <h2 className="text-xl font-black text-white leading-tight mb-1 line-clamp-2">{livroAtual.titulo}</h2>
              <p className="text-slate-400 text-xs font-bold mb-4">{livroAtual.autor}</p>

              <div className="flex items-end justify-between mb-2">
                <span className="text-white font-black text-2xl italic">{progressoLeituraAtual}%</span>
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">{livroAtual.pagina_atual} / {livroAtual.total_paginas} Pág</span>
              </div>

              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-linear-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-1000" style={{ width: `${progressoLeituraAtual}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3 relative z-10">
            <div className="flex-1 relative">
              <input
                type="number"
                value={novaPagina}
                onChange={(e) => setNovaPagina(e.target.value)}
                placeholder="Página atual..."
                className="w-full bg-slate-950/50 border border-white/10 rounded-3xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-orange-500/50 transition-all text-center"
              />
            </div>
            <button
              onClick={atualizarPagina}
              disabled={isAtualizando || !novaPagina}
              className="bg-orange-500 text-white px-6 rounded-3xl font-black text-xs uppercase tracking-wider hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
            >
              {isAtualizando ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Atualizar'}
            </button>
          </div>
        </div>
      )}

      {/* --- MODO: AVALIAÇÃO (Livro Terminado) --- */}
      {showAvaliacao && livroAtual && (
        <div className="bg-slate-900/80 p-8 rounded-[40px] border border-orange-500/30 shadow-2xl text-center relative overflow-hidden">

          <button
            onClick={() => setLivroParaRemover({ id: livroAtual.id, isAtual: true })}
            className="absolute top-6 right-6 z-20 p-2 bg-slate-800/50 text-slate-500 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <Trophy className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black italic uppercase text-white mb-2">Livro Concluído!</h2>
          <p className="text-slate-400 text-xs font-bold mb-8">Que nota você dá para &quot;{livroAtual.titulo}&quot;?</p>

          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                onClick={() => setNotaDada(star)}
                className={`w-10 h-10 cursor-pointer transition-all ${notaDada >= star ? 'text-orange-500 fill-orange-500 scale-110' : 'text-slate-700 hover:text-orange-500/50'}`}
              />
            ))}
          </div>

          <button
            onClick={finalizarLivro}
            disabled={isAtualizando || notaDada === 0}
            className="w-full py-5 bg-orange-500 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50"
          >
            {isAtualizando ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Salvar no Histórico'}
          </button>
        </div>
      )}

      {/* --- HISTÓRICO DE LEITURAS (Prateleira) --- */}
      {historico.length > 0 && (
        <div className="bg-slate-900/40 p-8 rounded-[40px] border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <BookMarked className="text-slate-500 w-5 h-5" />
            <h3 className="text-white font-black uppercase tracking-widest text-sm">Prateleira de Conquistas</h3>
          </div>

          <div className="flex flex-wrap gap-4 sm:gap-6">
            {historico.map((livro) => (
              <div key={livro.id} className="flex flex-col items-center gap-2 group relative w-24 md:w-28 shrink-0">

                <button
                  onClick={() => setLivroParaRemover({ id: livro.id, isAtual: false })}
                  className="absolute -top-2 -right-2 z-20 p-2 bg-slate-900 border border-white/10 text-slate-500 rounded-full hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-xl"
                >
                  <Trash2 className="w-3 h-3" />
                </button>

                <div className="relative rounded-lg overflow-hidden shadow-xl border border-white/10 group-hover:border-orange-500/50 transition-colors w-full">
                  {livro.capa_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={livro.capa_url} alt="Capa" className="w-full aspect-2/3 object-cover" />
                  ) : (
                    <div className="w-full aspect-2/3 bg-slate-800 flex items-center justify-center"><BookMarked className="text-slate-600 w-6 h-6" /></div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md py-1 flex justify-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-2.5 h-2.5 ${i < livro.avaliacao ? 'text-orange-500 fill-orange-500' : 'text-slate-700'}`} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}