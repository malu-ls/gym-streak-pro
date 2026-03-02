"use client";

import React, { useMemo } from 'react';

interface InstagramCardProps {
  treinosNoMes: number;
  metaMensalEstimada: number;
  treinosCount: number;
  metaAnual: number;
  consistencia: number;
  ano: number;
  mesNome: string;
  metaSemanal: number;
  concluidosSemana: number;
  userName: string;
  bateuMetaMensal: boolean;
  rank: {
    nome: string;
    emoji: string;
  };
}

export default function InstagramCard({
  treinosNoMes,
  ano,
  mesNome,
  metaSemanal,
  concluidosSemana,
  userName,
  bateuMetaMensal,
  rank
}: InstagramCardProps) {

  const { flames, progressoSemana } = useMemo(() => {
    const flamesArray = Array.from({ length: metaSemanal }, (_, i) => i < concluidosSemana);
    const porcentagem = Math.min(100, Math.round((concluidosSemana / metaSemanal) * 100)) || 0;
    return { flames: flamesArray, progressoSemana: porcentagem };
  }, [metaSemanal, concluidosSemana]);

  return (
    <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', pointerEvents: 'none', zIndex: -100 }}>

      <div
        id="resumo-mensal-card"
        style={{
          width: '1080px',
          height: '1920px',
          backgroundColor: '#020617',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          /* AJUSTE 1: Reduzimos o padding vertical para 100px (antes era 160px). Isso salva 120px de altura */
          padding: '100px 80px',
          boxSizing: 'border-box',
          fontFamily: 'sans-serif',
          margin: 0
        }}
      >
        {/* --- HEADER --- */}
        <h1 style={{ fontSize: '130px', fontWeight: '900', fontStyle: 'italic', margin: '0 0 20px 0', letterSpacing: '-5px', color: 'white', textAlign: 'center', lineHeight: 1 }}>
          GYM <span style={{ color: '#f97316' }}>IGNITE</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '30px', fontWeight: '900', letterSpacing: '10px', textTransform: 'uppercase', margin: 0, textAlign: 'center' }}>
          — {userName} • {mesNome} {ano} —
        </p>

        {/* --- BADGE DE STATUS --- */}
        {/* AJUSTE 2: marginTop reduzido para 80px */}
        <div style={{
          marginTop: '80px',
          backgroundColor: bateuMetaMensal ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
          border: `3px solid ${bateuMetaMensal ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
          borderRadius: '100px',
          padding: '25px 60px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          boxShadow: `0 20px 40px ${bateuMetaMensal ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)'}`
        }}>
          <span style={{ color: bateuMetaMensal ? '#34d399' : '#60a5fa', fontSize: '36px', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', margin: 0 }}>
            {bateuMetaMensal ? 'META MENSAL BATIDA' : 'OBJETIVO EM ANDAMENTO'}
          </span>
          <span style={{ fontSize: '45px', margin: 0, lineHeight: 1 }}>{bateuMetaMensal ? '🏆' : '🛡️'}</span>
        </div>

        {/* --- CAIXA DE FREQUÊNCIA SEMANAL --- */}
        {/* AJUSTE 3: marginTop de 80px e padding interno reduzido para 60px 60px */}
        <div style={{
          width: '100%',
          backgroundColor: '#0f172a',
          borderRadius: '56px',
          padding: '60px 60px',
          marginTop: '80px',
          boxSizing: 'border-box',
          border: '3px solid #1e293b'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <span style={{ color: 'white', fontSize: '42px', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', margin: 0 }}>
                Frequência Semanal
              </span>
            </div>
            <span style={{ color: '#f97316', fontSize: '75px', fontWeight: '900', fontStyle: 'italic', lineHeight: '1', margin: 0 }}>
              {concluidosSemana}<span style={{ color: '#475569', fontSize: '55px' }}>/{metaSemanal}</span>
            </span>
          </div>

          {/* Barra de Progresso */}
          <div style={{ width: '100%', height: '26px', backgroundColor: '#1e293b', borderRadius: '13px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${progressoSemana}%`, backgroundColor: '#f97316', borderRadius: '13px' }} />
          </div>

          {/* Grid de Foguinhos */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', gap: '15px' }}>
            {flames.map((isActive, i) => (
              <div key={i} style={{
                flex: 1,
                height: '100px',
                backgroundColor: isActive ? 'rgba(249, 115, 22, 0.15)' : 'rgba(30, 41, 59, 0.4)',
                borderRadius: '24px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: isActive ? '3px solid rgba(249, 115, 22, 0.3)' : '3px solid transparent'
              }}>
                <span style={{ fontSize: '50px', margin: 0, opacity: isActive ? 1 : 0.2, filter: isActive ? 'drop-shadow(0 10px 15px rgba(249,115,22,0.4))' : 'none', lineHeight: 1 }}>
                  🔥
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* --- GRID DUPLO: PATENTE & SESSÕES --- */}
        {/* AJUSTE 4: marginTop de 60px (antes 100px) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '30px', marginTop: '60px', boxSizing: 'border-box' }}>

          <div style={{ flex: 1, backgroundColor: '#0f172a', borderRadius: '56px', padding: '60px 30px', textAlign: 'center', border: '3px solid #1e293b', boxSizing: 'border-box' }}>
            <p style={{ color: '#475569', fontSize: '24px', fontWeight: '900', margin: '0 0 40px 0', textTransform: 'uppercase', letterSpacing: '4px' }}>PATENTE ATUAL</p>
            <span style={{ fontSize: '130px', display: 'block', marginBottom: '30px', lineHeight: 1 }}>{rank?.emoji || '🐣'}</span>
            <p style={{ color: 'white', fontSize: '46px', fontWeight: '900', fontStyle: 'italic', margin: 0, textTransform: 'uppercase' }}>{rank?.nome || 'Iniciante'}</p>
          </div>

          <div style={{ flex: 1, backgroundColor: '#0f172a', borderRadius: '56px', padding: '60px 30px', textAlign: 'center', border: '3px solid #1e293b', boxSizing: 'border-box' }}>
            <p style={{ color: '#475569', fontSize: '24px', fontWeight: '900', margin: '0 0 40px 0', textTransform: 'uppercase', letterSpacing: '4px' }}>SESSÕES NO MÊS</p>
            <span style={{ fontSize: '130px', display: 'block', marginBottom: '30px', lineHeight: 1 }}>💪</span>
            <p style={{ color: 'white', fontSize: '90px', fontWeight: '900', fontStyle: 'italic', margin: 0, lineHeight: '0.8' }}>{treinosNoMes}</p>
          </div>
        </div>

        {/* --- FOOTER MINIMALISTA --- */}
        <p style={{ marginTop: 'auto', color: '#1e293b', fontSize: '34px', fontWeight: '900', letterSpacing: '16px', marginBottom: '40px', textAlign: 'center', width: '100%' }}>
          GYMIGNITE.APP
        </p>
      </div>
    </div>
  );
}