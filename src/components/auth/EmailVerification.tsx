"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, ArrowRight, RefreshCcw } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface Props {
  email: string;
  onVerified: () => void;
}

export default function EmailVerification({ email, onVerified }: Props) {
  const [codigo, setCodigo] = useState('');
  const [isVerificando, setIsVerificando] = useState(false);
  const [isReenviando, setIsReenviando] = useState(false);
  const [timer, setTimer] = useState(60);
  const [mensagem, setMensagem] = useState({ texto: '', erro: false });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.length !== 6) return;

    setIsVerificando(true);
    setMensagem({ texto: '', erro: false });

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: codigo,
        type: 'signup',
      });

      if (error) throw error;
      onVerified();
    } catch (err: any) {
      setMensagem({ texto: 'Código inválido ou expirado.', erro: true });
    } finally {
      setIsVerificando(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || isReenviando) return;
    setIsReenviando(true);
    setMensagem({ texto: '', erro: false });

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;
      setMensagem({ texto: 'Novo código enviado!', erro: false });
      setTimer(60);
    } catch (err: any) {
      setMensagem({ texto: 'Erro ao reenviar. Tente mais tarde.', erro: true });
    } finally {
      setIsReenviando(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-8 animate-in fade-in zoom-in duration-500">
      {/* Ícone de Escudo */}
      <div className="relative">
        <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full opacity-50" />
        <div className="relative p-5 bg-orange-500/10 rounded-[32px] border border-orange-500/20">
          <ShieldCheck className="w-12 h-12 text-orange-500" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Verificar Acesso</h2>
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold">
          Insira o código de 6 dígitos enviado para <br />
          <span className="text-orange-500">{email}</span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="w-full max-w-[340px] space-y-6">
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full bg-slate-950/50 border border-white/10 rounded-[28px] py-7 text-center text-4xl font-black tracking-[0.4em] text-orange-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all placeholder:opacity-20 shadow-inner"
          />
        </div>

        {mensagem.texto && (
          <div className={`p-4 rounded-2xl border text-center animate-in slide-in-from-top-2 ${mensagem.erro ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            }`}>
            <p className="text-[10px] font-black uppercase tracking-widest leading-none">
              {mensagem.texto}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <button
            type="submit"
            disabled={codigo.length !== 6 || isVerificando}
            className="w-full bg-white text-black font-black py-5 rounded-[24px] flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-20 shadow-xl shadow-white/5"
          >
            {isVerificando ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>ATIVAR CONTA <ArrowRight size={18} /></>
            )}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={timer > 0 || isReenviando}
            className="w-full flex items-center justify-center gap-3 text-slate-500 hover:text-white disabled:opacity-50 transition-all py-2"
          >
            {isReenviando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCcw className={`w-3.5 h-3.5 ${timer === 0 ? 'text-orange-500' : 'opacity-20'}`} />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {timer > 0 ? `Reenviar em ${timer}s` : 'Solicitar novo código'}
            </span>
          </button>
        </div>
      </form>

      <p className="text-[9px] text-slate-700 font-bold uppercase text-center max-w-[200px] leading-relaxed">
        Não recebeu? Verifique sua caixa de spam ou lixo eletrônico.
      </p>
    </div>
  );
}