"use client";

import React, { useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import EmailVerification from '@/components/auth/EmailVerification';
import { Mail, Lock, ArrowRight, Loader2, Flame, Calendar, Users, User, AtSign, ShieldAlert, Check, X } from 'lucide-react';
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

  // Lógica do Validador de Senha
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
    if (isLoading || !isPasswordValid) return;
    setIsLoading(true);
    setError(null);

    const cleanUsername = username.toLowerCase().trim().replace(/\s+/g, '_');

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
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
      if (data?.user) setShowVerification(true);
    } catch (err: any) {
      let message = err.message || "Erro ao criar conta.";
      if (message.includes("Password should be")) message = "A senha não atende aos requisitos de segurança.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerification) {
    return <EmailVerification email={email} onVerified={() => window.location.href = '/'} />;
  }

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-slate-50">
      <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in duration-700">

        <div className="text-center space-y-3">
          <div className="inline-flex p-4 bg-orange-500/10 rounded-[2.5rem] border border-orange-500/20 mb-2 relative">
            <Flame className="w-12 h-12 text-orange-500 fill-orange-500 relative z-10" />
          </div>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none text-white">
            JOIN <span className="text-orange-500">IGNITE</span>
          </h1>
        </div>

        <div className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 backdrop-blur-2xl shadow-2xl">
          <form onSubmit={handleSignUp} className="space-y-4">

            {/* Nome e Username */}
            <input type="text" required placeholder="NOME COMPLETO" value={nome} onChange={(e) => setNome(e.target.value)}
              className="w-full bg-slate-800/20 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-orange-500 font-bold text-xs tracking-widest transition-all" />

            <input type="text" required placeholder="USERNAME" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800/20 border border-slate-800 p-4 rounded-2xl text-orange-500 outline-none focus:border-orange-500 font-black text-xs tracking-widest transition-all" />

            {/* E-mail */}
            <input type="email" required placeholder="E-MAIL" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800/20 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-orange-500 font-bold text-xs tracking-widest transition-all" />

            {/* Senha com Validador Visual */}
            <div className="space-y-3">
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="password" required placeholder="SENHA" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-slate-800/20 border p-4 pl-14 rounded-2xl text-white outline-none transition-all font-bold text-xs tracking-widest ${isPasswordValid ? 'border-emerald-500/30' : 'border-slate-800'}`}
                />
              </div>

              {/* GRID DO VALIDADOR */}
              {password.length > 0 && (
                <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/50 rounded-2xl border border-white/5 animate-in slide-in-from-top-2">
                  {passwordRequirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {req.met ? (
                        <Check size={10} className="text-emerald-500" />
                      ) : (
                        <X size={10} className="text-slate-600" />
                      )}
                      <span className={`text-[8px] font-black uppercase tracking-tighter ${req.met ? 'text-emerald-500' : 'text-slate-600'}`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input type="date" required value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)}
                className="w-full bg-slate-800/20 border border-slate-800 p-4 rounded-2xl text-white outline-none text-[10px] font-bold uppercase" />

              <select required value={sexo} onChange={(e) => setSexo(e.target.value)}
                className="w-full bg-slate-800/20 border border-slate-800 p-4 rounded-2xl text-white outline-none text-[10px] font-bold uppercase cursor-pointer">
                <option value="" disabled>SEXO</option>
                <option value="masculino">MASCULINO</option>
                <option value="feminino">FEMININO</option>
              </select>
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit" disabled={isLoading || (password.length > 0 && !isPasswordValid)}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-30 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-orange-500/20 uppercase text-xs tracking-widest"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <>CRIAR PERFIL <ArrowRight size={20} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}