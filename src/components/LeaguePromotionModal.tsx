import React from 'react';
import { GameStateData, gameManager } from '../core/gameState';
import { LEAGUE_COLORS, leagueId, leagueRewardMult } from '../core/leagues';
import { ui } from '../i18n/ui';
import { leagueLabel } from '../i18n/content-helpers';
import { Coins, Gem, Trophy } from 'lucide-react';

// League promotion celebration (docs/PLAN_BUILD_19.md C1): fixed reward, shown once per league
export const LeaguePromotionModal: React.FC<{ state: GameStateData }> = ({ state }) => {
  const p = state.pendingPromotion;
  if (!p) return null;
  const lang = state.lang;
  const color = LEAGUE_COLORS[leagueId(p.league)];
  const mult = leagueRewardMult(p.league);
  return (
    <div className="modal-shell fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none" data-league-promotion>
      <div className="relative w-full max-w-sm rounded-3xl border-2 game-card p-6 shadow-2xl flex flex-col items-center text-center text-white overflow-hidden" style={{ borderColor: color }} role="dialog" aria-label={ui(lang, 'promo_title')}>
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 50% 20%, ${color} 0%, transparent 60%)` }} />
        <div className="relative w-20 h-20 mb-3">
          <svg viewBox="0 0 12 12" className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]" aria-hidden="true">
            <path d="M6 0.6 L11 3.3 V8.7 L6 11.4 L1 8.7 V3.3 Z" fill={color} stroke="rgba(0,0,0,0.6)" strokeWidth="0.5" />
          </svg>
          <Trophy className="absolute inset-0 m-auto w-8 h-8 text-black/70" />
        </div>
        <span className="result-slam relative text-3xl font-black italic tracking-wider" style={{ color }}>{ui(lang, 'promo_title')}</span>
        <span className="relative mt-1 text-base font-black text-white">{leagueLabel(p.league, lang)}</span>
        <p className="relative mt-2 text-[12px] leading-snug text-zinc-300">{ui(lang, 'promo_body', { n: mult.toFixed(2).replace(/\.?0+$/, '') })}</p>
        <div className="relative mt-4 w-full rounded-2xl bg-black/60 border border-white/10 p-3">
          <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{ui(lang, 'promo_reward')}</div>
          <div className="mt-1.5 flex items-center justify-center gap-4 text-sm font-black tabular-nums">
            <span className="flex items-center gap-1 text-cyan-300"><Gem className="w-4 h-4" />+{p.gems}</span>
            <span className="flex items-center gap-1 text-amber-300"><Coins className="w-4 h-4" />+{p.coins.toLocaleString()}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => gameManager.claimPromotion()}
          className="relative mt-4 w-full min-h-12 rounded-2xl game-btn-gold text-black font-black text-sm active:scale-95 shine-effect"
        >
          {ui(lang, 'claim')}
        </button>
      </div>
    </div>
  );
};
