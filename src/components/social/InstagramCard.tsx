"use client";

import { Flame, CheckCircle2, Trophy, Activity } from 'lucide-react';

interface Props {
  treinosCount: number;
  metaAnual: number;
  consistencia: number;
  treinosNoMes: number;
  metaMensalEstimada: number;
  bateuMetaMensal: boolean;
  rank: { nome: string; emoji: string };
  treinouHoje: boolean;
  mesNome: string;
  ano: number;
  concluidosSemana: number;
  metaSemanal: number;
}

export default function InstagramCard(props: Props) {
  const porcentagemSemana = Math.min(100, (props.concluidosSemana / props.metaSemanal) * 100);

  return (
    <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -100 }}>
      <div
        id="resumo-mensal-card"
        style={{
          width: '1080px',
          height: '1920px',
          backgroundColor: '#020617',
          display: 'flex',
          flexDirection: 'column',
          padding: '70px', // Reduzido para evitar cortes laterais e no footer
          boxSizing: 'border-box',
          fontFamily: 'sans-serif',
        }}
      >
        {/* HEADER COM MÊS E ANO DE REFERÊNCIA */}
        <div style={{ marginBottom: '60px', textAlign: 'center' }}>
          <h1 style={{ color: 'white', fontSize: '110px', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', margin: 0, letterSpacing: '-5px' }}>
            GYM <span style={{ color: '#f97316' }}>IGNITE</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
            <div style={{ height: '3px', width: '60px', backgroundColor: '#f97316', opacity: 0.5 }}></div>
            <p style={{ color: '#64748b', fontSize: '32px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '10px', margin: 0 }}>
              ESTATÍSTICAS {props.mesNome} {props.ano}
            </p>
            <div style={{ height: '3px', width: '60px', backgroundColor: '#f97316', opacity: 0.5 }}></div>
          </div>
        </div>

        {/* STATUS EM LINHA ÚNICA (REDUZIDO PARA CABER) */}
        <div style={{ marginBottom: '50px' }}>
          <div style={{
            backgroundColor: props.treinouHoje ? 'rgba(249, 115, 22, 0.1)' : 'rgba(255,255,255,0.02)',
            height: '150px',
            borderRadius: '75px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 40px',
            border: props.treinouHoje ? '4px solid #f97316' : '2px solid rgba(255,255,255,0.05)',
            gap: '20px'
          }}>
            <span style={{
              color: props.treinouHoje ? '#f97316' : '#475569',
              fontSize: '55px', // Fonte reduzida para garantir linha única sem cortes
              fontWeight: '900',
              fontStyle: 'italic',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap'
            }}>
              {props.treinouHoje ? 'HOJE TÁ PAGO 🔥' : 'A CHAMA SEGUE ACESA 🛡️'}
            </span>
          </div>
        </div>

        {/* META DA SEMANA */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '70px',
          padding: '50px',
          marginBottom: '50px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Activity color="#f97316" size={35} />
              <span style={{ color: 'white', fontSize: '38px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>Meta da Semana</span>
            </div>
            <span style={{ color: '#f97316', fontSize: '60px', fontWeight: '900' }}>{props.concluidosSemana}/{props.metaSemanal}</span>
          </div>

          <div style={{ width: '100%', height: '40px', backgroundColor: '#1e293b', borderRadius: '20px', marginBottom: '40px', overflow: 'hidden' }}>
            <div style={{ width: `${porcentagemSemana}%`, height: '100%', backgroundColor: '#f97316', borderRadius: '20px' }}></div>
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            {Array.from({ length: props.metaSemanal }).map((_, i) => (
              <div key={i} style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: i < props.concluidosSemana ? '#f97316' : '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Flame size={40} color={i < props.concluidosSemana ? 'white' : '#334155'} fill={i < props.concluidosSemana ? 'white' : 'transparent'} />
              </div>
            ))}
          </div>
        </div>

        {/* RANK E VOLUME MENSAL */}
        <div style={{ display: 'flex', gap: '30px', marginBottom: '50px' }}>
          <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '60px', padding: '40px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '26px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px' }}>Rank</p>
            <div style={{ fontSize: '80px', marginBottom: '5px' }}>{props.rank.emoji}</div>
            <p style={{ color: 'white', fontSize: '45px', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', margin: 0 }}>{props.rank.nome}</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '60px', padding: '40px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '26px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px' }}>Volume {props.mesNome}</p>
            <div style={{ fontSize: '80px', marginBottom: '5px' }}>🗓️</div>
            <p style={{ color: 'white', fontSize: '80px', fontWeight: '900', margin: 0 }}>{props.treinosNoMes}</p>
          </div>
        </div>

        {/* ACUMULADO DO ANO */}
        <div style={{
          marginTop: 'auto',
          backgroundColor: '#f97316',
          borderRadius: '50px',
          padding: '45px 60px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '30px', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>Acumulado do Ano</p>
            <p style={{ color: 'white', fontSize: '85px', fontWeight: '900', margin: 0 }}>{props.treinosCount} <span style={{ fontSize: '40px', opacity: 0.7 }}>/ {props.metaAnual} TREINOS</span></p>
          </div>
          <Trophy color="white" size={75} />
        </div>

        {/* FOOTER AJUSTADO PARA NÃO CORTAR */}
        <div style={{ marginTop: '50px', textAlign: 'center', paddingBottom: '20px' }}>
          <p style={{ color: '#334155', fontSize: '32px', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '12px' }}>
            GYMIGNITE.APP
          </p>
        </div>
      </div>
    </div>
  );
}