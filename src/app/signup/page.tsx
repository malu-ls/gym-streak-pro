"use client";

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import EmailVerification from '@/components/auth/EmailVerification';
import { Mail, Lock, ArrowRight, Loader2, Flame, Calendar, Users, User, AtSign } from 'lucide-react';
import Link from 'next/link';

export default function SignUp() {
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    // Limpeza do username: sem espaços, minúsculo e substitui espaços por underscore
    const cleanUsername = username.toLowerCase().trim().replace(/\s+/g, '_');

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Enviamos todos os campos extras aqui.
          // O Trigger no banco vai ler esses dados para criar o perfil.
          data: {
            display_name: nome,
            username: cleanUsername,
            data_nascimento: dataNascimento,
            sexo: sexo
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) throw authError;

      // Se o usuário foi criado no Auth, mostramos a tela do código.
      // O perfil será criado automaticamente no banco via Trigger.
      if (data?.user) {
        setShowVerification(true);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta.");
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerification) {
    return (
      <EmailVerification
        email={email}
        onVerified={() => window.location.href = '/'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-slate-50">
      <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in duration-700">

        <div className="text-center space-y-3">
          <div className="inline-flex p-4 bg-orange-500/10 rounded-[2.5rem] border border-orange-500/20 mb-2 relative group">
            <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
            <Flame className="w-12 h-12 text-orange-500 fill-orange-500 relative z-10" />
          </div>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none text-white">
            JOIN <span className="text-orange-500">IGNITE</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em]">
            Fuel your evolution
          </p>
        </div>

        <div className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 backdrop-blur-2xl shadow-2xl">
          <form onSubmit={handleSignUp} className="space-y-4">

            {/* Nome Completo */}
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text" required placeholder="NOME COMPLETO" value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-slate-800/20 border border-slate-800 p-4 pl-14 rounded-2xl text-white outline-none focus:border-orange-500/50 font-bold text-xs tracking-widest transition-all"
              />
            </div>

            {/* Username */}
            <div className="relative group">
              <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text" required placeholder="NOME_DE_USUARIO" value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="w-full bg-slate-800/20 border border-slate-800 p-4 pl-14 rounded-2xl text-orange-500 outline-none focus:border-orange-500/50 font-black text-xs tracking-widest transition-all"
              />
            </div>

            {/* E-mail */}
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="email" required placeholder="E-MAIL" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800/20 border border-slate-800 p-4 pl-14 rounded-2xl text-white outline-none focus:border-orange-500/50 font-bold text-xs tracking-widest transition-all"
              />
            </div>

            {/* Senha */}
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="password" required placeholder="SENHA" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/20 border border-slate-800 p-4 pl-14 rounded-2xl text-white outline-none focus:border-orange-500/50 font-bold text-xs tracking-widest transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Data de Nascimento */}
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="date" required value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="w-full bg-slate-800/20 border border-slate-800 p-4 pl-12 rounded-2xl text-white outline-none focus:border-orange-500/50 font-bold text-[10px] uppercase appearance-none transition-all"
                />
              </div>

              {/* Sexo */}
              <div className="relative group">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
                <select
                  required value={sexo}
                  onChange={(e) => setSexo(e.target.value)}
                  className="w-full bg-slate-800/20 border border-slate-800 p-4 pl-12 rounded-2xl text-white outline-none focus:border-orange-500/50 font-bold text-[10px] uppercase appearance-none cursor-pointer transition-all"
                >
                  <option value="" disabled className="bg-slate-900">SEXO</option>
                  <option value="masculino" className="bg-slate-900 uppercase">Masculino</option>
                  <option value="feminino" className="bg-slate-900 uppercase">Feminino</option>
                  <option value="outro" className="bg-slate-900 uppercase">Outro</option>
                </select>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20 animate-pulse tracking-widest">
                {error}
              </p>
            )}

            <button
              type="submit" disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-orange-500/20 uppercase text-xs tracking-[0.2em] disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>CRIAR PERFIL <ArrowRight size={20} /></>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <Link href="/login" className="text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-[0.25em] transition-all">
              Já tem conta? <span className="underline decoration-2 underline-offset-4">LOGIN</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}