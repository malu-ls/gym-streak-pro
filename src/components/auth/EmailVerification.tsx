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
  const [timer, setTimer] = useState(60); // Timer de 60 segundos
  const [mensagem, setMensagem] = useState({ texto: '', erro: false });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Lógica do Contador
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setTimer(60); // Reinicia o contador
    } catch (err: any) {
      setMensagem({ texto: 'Erro ao reenviar. Tente mais tarde.', erro: true });
    } finally {
      setIsReenviando(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="p-5 bg-orange-500/10 rounded-[32px] border border-orange-500/20">
        <ShieldCheck className="w-12 h-12 text-orange-500" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Verificar E-mail</h2>
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold">
          Código enviado para <br />
          <span className="text-orange-500">{email}</span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="w-full max-w-[340px] space-y-6">
        <input
          type="text"
          maxLength={8}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          className="w-full bg-slate-900 border border-white/10 rounded-[24px] py-6 text-center text-3xl font-black tracking-[0.2em] text-orange-500 focus:border-orange-500/50 outline-none transition-all"
        />

        {mensagem.texto && (
          <p className={`text-[10px] font-black uppercase text-center ${mensagem.erro ? 'text-red-500' : 'text-emerald-500'}`}>
            {mensagem.texto}
          </p>
        )}

        <div className="space-y-4">
          <button
            disabled={codigo.length < 6 || isVerificando}
            className="w-full bg-white text-black font-black py-5 rounded-[24px] flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30"
          >
            {isVerificando ? <Loader2 className="animate-spin" /> : <>CONFIRMAR CÓDIGO <ArrowRight size={18} /></>}
          </button>

          {/* Botão de Reenvio com Timer */}
          <button
            type="button"
            onClick={handleResend}
            disabled={timer > 0 || isReenviando}
            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-white disabled:opacity-50 transition-colors py-2"
          >
            {isReenviando ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCcw className={`w-3 h-3 ${timer === 0 ? 'animate-none' : 'opacity-20'}`} />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {timer > 0 ? `Reenviar em ${timer}s` : 'Reenviar novo código'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}