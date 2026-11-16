import React from 'react';
import { Language } from '../i18n/translations';
import { ui } from '../i18n/ui';
import { FitText } from './FitText';

export interface PortraitLook {
  skinTone: string;
  hairColor: string;
  bodyColor: string;
  gloveColor: string;
}

interface BossIntroCardProps {
  lang: Language;
  durationMs: number; // real ms (already shortened at 2x / 4x)
  reducedMotion: boolean;
  stage: string;
  player: { name: string; level: number; look: PortraitLook };
  boss: { name: string; level: number; title: string; look: PortraitLook };
  mechanic: string | null; // the boss's signature move, if it has one
  onSkip: () => void;
}

// Flat bust in the fighter's colours: shoulders, head, hair, a glove raised in guard
const Portrait: React.FC<{ look: PortraitLook; mirror?: boolean; angry?: boolean }> = ({ look, mirror, angry }) => (
  <svg viewBox="0 0 80 80" className="w-full h-full" style={mirror ? { transform: 'scaleX(-1)' } : undefined} aria-hidden>
    <path d="M6 80 C8 58 22 52 40 52 C58 52 72 58 74 80 Z" fill={look.bodyColor} stroke="#0b0b14" strokeWidth="2.5" />
    <rect x="33" y="44" width="14" height="12" rx="4" fill={look.skinTone} stroke="#0b0b14" strokeWidth="2.5" />
    <circle cx="40" cy="31" r="19" fill={look.skinTone} stroke="#0b0b14" strokeWidth="2.5" />
    <path d="M21 29 C21 13 59 13 59 29 C52 22 30 20 21 29 Z" fill={look.hairColor} stroke="#0b0b14" strokeWidth="2" />
    <ellipse cx="47" cy="33" rx="2.6" ry="3.4" fill="#14141c" />
    <ellipse cx="34" cy="33" rx="2.6" ry="3.4" fill="#14141c" />
    <path d={angry ? 'M29 26 L37 28.5 M51 26 L43 28.5' : 'M29 27 L37 26.5 M51 27 L43 26.5'} stroke="#14141c" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M36 41 L44 41" stroke="#14141c" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="64" cy="58" r="11" fill={look.gloveColor} stroke="#0b0b14" strokeWidth="2.5" />
  </svg>
);

// Boss intro "VS" card: both fighters, the boss title and its signature move. Tap anywhere to skip.
export const BossIntroCard: React.FC<BossIntroCardProps> = ({ lang, durationMs, reducedMotion, stage, player, boss, mechanic, onSkip }) => {
  const anim = !reducedMotion;
  const style = { '--vs-dur': `${Math.max(250, durationMs)}ms` } as React.CSSProperties;
  return (
    <button
      type="button"
      data-boss-intro
      onClick={onSkip}
      aria-label={ui(lang, 'tap_skip')}
      className={`vs-card absolute inset-0 z-[35] flex flex-col items-stretch justify-center overflow-hidden text-left ${anim ? 'vs-anim' : ''}`}
      style={style}
    >
      <div className="vs-bg absolute inset-0" />
      <div className="relative flex items-center justify-center gap-1 mb-1">
        <span className="vs-tag px-2.5 py-0.5 rounded-md bg-rose-600 text-white text-[11px] font-black tracking-[0.25em] shadow-lg">{ui(lang, 'boss_fight')}</span>
        <span className="text-[11px] font-black text-amber-300 tabular-nums">{stage}</span>
      </div>
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center px-3 gap-1">
        <div className="vs-left min-w-0 flex flex-col items-center text-center">
          <div className="w-[min(26vw,96px)] aspect-square rounded-2xl bg-gradient-to-b from-sky-500/30 to-sky-900/40 border-2 border-sky-300/60 shadow-xl overflow-hidden">
            <Portrait look={player.look} />
          </div>
          <FitText text={player.name} max={13} min={9} className="mt-1 w-full font-black text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]" />
          <span className="text-[10px] font-black text-sky-300 tabular-nums">Lv.{player.level}</span>
        </div>
        <span className="vs-mark text-4xl font-black italic text-amber-300 drop-shadow-[0_3px_0_#7c2d12]">VS</span>
        <div className="vs-right min-w-0 flex flex-col items-center text-center">
          <div className="w-[min(26vw,96px)] aspect-square rounded-2xl bg-gradient-to-b from-rose-500/35 to-rose-950/50 border-2 border-rose-400/70 shadow-xl overflow-hidden">
            <Portrait look={boss.look} mirror angry />
          </div>
          <FitText text={boss.name} max={13} min={9} className="mt-1 w-full font-black text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]" />
          <span className="text-[10px] font-black text-rose-300 tabular-nums">Lv.{boss.level}</span>
        </div>
      </div>
      <div className="vs-foot relative mt-1.5 flex flex-col items-center px-4 text-center">
        <span className="text-[11px] font-bold text-amber-200 leading-tight">{boss.title}</span>
        {mechanic && (
          <span className="mt-1 px-2 py-0.5 rounded-lg bg-black/60 border border-amber-400/50 text-[11px] font-black text-amber-300 leading-tight">
            {ui(lang, 'vs_signature')}: {mechanic}
          </span>
        )}
      </div>
      <span className="relative mt-1.5 text-center text-[9px] font-bold uppercase tracking-wider text-zinc-400">{ui(lang, 'tap_skip')}</span>
    </button>
  );
};
