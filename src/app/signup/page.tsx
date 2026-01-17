"use client";

import React, { useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import EmailVerification from '@/components/auth/EmailVerification';
import { Mail, Lock, ArrowRight, Loader2, Flame, Calendar, User, ShieldAlert, Check, X, Orbit } from 'lucide-react';
import Link from 'next/link';

export default function SignUp() {
  const [nomeDeTratamento, setNomeDeTratamento] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);

  const passwordRequirements = useMemo(() => [
    { label: '8+ Caracteres', met: password.length >= 8 },
    { label: 'Letra Maiúscula', met: /[A-Z]/.test(password) },
    { label: 'Número', met: /[0-9]/.test(password) },
    { label: 'Símbolo (!@#$)', met: /[^A-Za-z0-9]/.test(password) },
  ], [password]);

  const isPasswordValid = passwordRequirements.every(req => req.met);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !isPasswordValid || !sexo) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: nomeDeTratamento,
            nome: nomeDeTratamento,
            data_nascimento: dataNascimento,
            sexo: sexo
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) throw authError;
      if (data?.user) setShowVerification(true);
    } catch (err: any) {
      setError(err.message || "Falha técnica no banco de dados.");
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerification) {
    return <EmailVerification email={email} onVerified={() => window.location.href = '/'} />;
  }

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-slate-50 font-sans">
      <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in duration-700">

        <div className="text-center space-y-3">
          <div className="inline-flex p-4 bg-orange-500/10 rounded-[2.5rem] border border-orange-500/20 mb-2 relative group">
            <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
            <Flame className="w-12 h-12 text-orange-500 fill-orange-500 relative z-10" />
          </div>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none text-white">
            JOIN <span className="text-orange-500">IGNITE</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em]">Fuel your evolution</p>
        </div>

        <div className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 backdrop-blur-2xl shadow-2xl">
          <form onSubmit={handleSignUp} className="space-y-6">

            {/* Campos de Texto */}
            <div className="space-y-3">
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="text" required placeholder="COMO QUER SER CHAMADO?" value={nomeDeTratamento}
                  onChange={(e) => setNomeDeTratamento(e.target.value)}
                  className="w-full bg-slate-800/20 border border-slate-800 p-4 pl-14 rounded-2xl text-white outline-none focus:border-orange-500/50 font-bold text-xs tracking-widest transition-all"
                />
              </div>

              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="email" required placeholder="E-MAIL" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/20 border border-slate-800 p-4 pl-14 rounded-2xl text-white outline-none focus:border-orange-500/50 font-bold text-xs tracking-widest transition-all"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="password" required placeholder="SENHA DE ACESSO" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-slate-800/20 border p-4 pl-14 rounded-2xl text-white outline-none transition-all font-bold text-xs tracking-widest ${isPasswordValid ? 'border-emerald-500/30' : 'border-slate-800'}`}
                />
              </div>

              {password.length > 0 && (
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/50 rounded-2xl border border-white/5 animate-in slide-in-from-top-2">
                  {passwordRequirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                        {req.met ? <Check size={10} className="text-emerald-500" /> : <X size={10} className="text-slate-600" />}
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-tighter ${req.met ? 'text-emerald-500' : 'text-slate-600'}`}>{req.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seletor de Data de Nascimento */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar size={12} /> Data de Nascimento
              </label>
              <input
                type="date" required value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="w-full bg-slate-800/20 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-orange-500/50 font-bold text-xs uppercase transition-all"
              />
            </div>

            {/* NOVO: Seletor de Sexo Estilizado */}
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Orbit size={12} /> Como você se identifica?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'masculino', label: 'Masculino' },
                  { id: 'feminino', label: 'Feminino' }
                ].map((opcao) => (
                  <button
                    key={opcao.id}
                    type="button"
                    onClick={() => setSexo(opcao.id)}
                    className={`
                      flex items-center justify-center p-4 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all duration-300 border
                      ${sexo === opcao.id
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-[1.02] border-transparent'
                        : 'bg-slate-800/40 text-slate-500 border-white/5 hover:border-orange-500/30 hover:text-slate-300'}
                    `}
                  >
                    {opcao.label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 p-4 rounded-xl border border-red-500/20 animate-in shake">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (password.length > 0 && !isPasswordValid) || !sexo}
              className="w-full bg-white text-black font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-white/5 uppercase text-xs tracking-widest disabled:opacity-20"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <>CRIAR PERFIL <ArrowRight size={20} /></>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link href="/login" className="text-slate-600 hover:text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all">
              Já tem conta? <span className="text-orange-500 underline decoration-2 underline-offset-4">LOG IN</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}