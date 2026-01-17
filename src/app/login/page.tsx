"use client";

import { createBrowserClient } from '@supabase/ssr';
import { useState, useEffect } from 'react';
import { Flame, Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Importado para navegação interna

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (!isClient) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setStatus(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Verifica se o erro é de e-mail não confirmado
        if (error.message.includes("Email not confirmed")) {
          setStatus({ type: 'error', text: "E-mail ainda não confirmado. Verifique sua caixa de entrada." });
        } else {
          setStatus({ type: 'error', text: "Acesso negado. Verifique suas credenciais." });
        }
        setLoading(false);
      } else {
        router.refresh();
        router.push('/');
      }
    } catch (err) {
      setStatus({ type: 'error', text: "Erro inesperado ao entrar." });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-slate-50 selection:bg-orange-500/30">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-700">

        {/* Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 bg-orange-500/10 rounded-[2.5rem] border border-orange-500/20 mb-2 relative group">
            <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <Flame className="w-14 h-14 text-orange-500 fill-orange-500 relative z-10" />
          </div>
          <h1 className="text-6xl font-black uppercase italic tracking-tighter leading-none">
            GYM <span className="text-orange-500">IGNITE</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.3em]">
            Fuel your evolution
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 backdrop-blur-2xl shadow-2xl relative">
          <form onSubmit={handleSignIn} className="space-y-6">

            {status && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-top-4 ${status.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <p className="text-[11px] font-black uppercase tracking-wider leading-tight">{status.text}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="email"
                  required
                  placeholder="E-MAIL"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/20 border border-slate-800 p-5 pl-14 rounded-2xl text-white outline-none focus:border-orange-500/50 focus:bg-slate-800/40 transition-all font-bold text-xs tracking-widest placeholder:text-slate-700"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="password"
                  required
                  placeholder="SENHA"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/20 border border-slate-800 p-5 pl-14 rounded-2xl text-white outline-none focus:border-orange-500/50 focus:bg-slate-800/40 transition-all font-bold text-xs tracking-widest placeholder:text-slate-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-orange-500/20 uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 active:scale-[0.97]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ENTRAR AGORA"}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 flex flex-col gap-4">
            {/* Redireciona para a página de Signup dedicada */}
            <Link
              href="/signup"
              className="text-center text-slate-500 hover:text-orange-400 font-black text-[10px] uppercase tracking-[0.25em] transition-all"
            >
              Primeira vez? <span className="underline decoration-2 underline-offset-4">CRIAR CONTA</span>
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-800 text-[10px] font-black uppercase tracking-[0.6em]">
          Gym Ignite OS 2.1
        </p>
      </div>
    </div>
  );
}