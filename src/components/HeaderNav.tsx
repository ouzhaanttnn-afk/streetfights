import React from 'react';
import { GameStateData, gameManager } from '../core/gameState';
import { t } from '../i18n/translations';
import { ui } from '../i18n/ui';
import { useIslandLayout } from '../core/useIslandLayout';
import { Coins, Gem, Settings, Gift, ChevronRight } from 'lucide-react';

interface HeaderNavProps {
  state: GameStateData;
  onOpenSettings: () => void;
}

const compact = (n: number) =>
  n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 10000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString();

// Level badge wrapped in a thin XP ring
const LevelRing: React.FC<{ level: number; pct: number; size: number }> = ({ level, pct, size }) => {
  const r = size / 2 - 1.5;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.65)" strokeWidth="3" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fde047" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(c * pct) / 100} ${c}`} />
      </svg>
      <div className="absolute inset-[4px] rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-black font-black text-[11px] flex items-center justify-center border border-amber-300/60">
        {level}
      </div>
    </div>
  );
};

export const HeaderNav: React.FC<HeaderNavProps> = ({ state, onOpenSettings }) => {
  const island = useIslandLayout();
  const xpPct = Math.min(100, Math.round((state.playerXp / state.playerMaxXp) * 100));
  const dailyReady = !state.claimedDailyDays.includes(state.dailyLoginStreak);

  const coinsPill = (
    <div className="flex items-center gap-0.5 bg-black/60 border border-amber-500/30 px-1.5 py-0.5 rounded-lg shadow-inner min-w-0">
      <Coins className="w-2.5 h-2.5 text-amber-400 shrink-0" />
      <span className="text-[10px] font-black font-mono text-amber-300 leading-none">{compact(state.coins)}</span>
    </div>
  );
  const gemsPill = (
    <div className="flex items-center gap-0.5 bg-black/60 border border-cyan-500/30 px-1.5 py-0.5 rounded-lg shadow-inner min-w-0">
      <Gem className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
      <span className="text-[10px] font-black font-mono text-cyan-300 leading-none">{compact(state.gems)}</span>
    </div>
  );
  const giftBtn = (
    <button
      onClick={() => gameManager.openDailyLogin()}
      className="w-7 h-7 shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 active:scale-95 text-black rounded-lg border border-amber-300/60 transition-all shadow-sm flex items-center justify-center relative"
      aria-label="Daily rewards"
    >
      <Gift className="w-3.5 h-3.5 text-black" />
      {dailyReady && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-black" />}
    </button>
  );
  const settingsBtn = (
    <button
      onClick={onOpenSettings}
      className="w-7 h-7 shrink-0 bg-neutral-900/90 active:scale-95 text-zinc-400 rounded-lg border border-white/10 transition-all shadow-sm flex items-center justify-center"
      aria-label={t('settings', state.lang)}
    >
      <Settings className="w-3.5 h-3.5" />
    </button>
  );

  if (island) {
    // Dynamic Island iPhones: the whole header lives in the band beside the island (status bar is hidden natively).
    // Island: ~126pt wide, 37pt tall, 11pt from the top. Side padding keeps clear of the rounded screen corners.
    return (
      <header data-island-header className="top-nav glass-panel border-b border-white/10 shrink-0 z-30 select-none" style={{ paddingTop: 11, paddingBottom: 6 }}>
        <div className="h-[37px] flex items-center px-[22px]">
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <button data-open-profile onClick={() => gameManager.setProfileOpen(true)} aria-label={ui(state.lang, 'profile_hint')} className="active:scale-95 transition-transform shrink-0">
              <LevelRing level={state.playerLevel} pct={xpPct} size={30} />
            </button>
            {coinsPill}
          </div>
          <div className="w-[142px] shrink-0" aria-hidden />
          <div className="flex-1 min-w-0 flex items-center justify-end gap-1">
            {gemsPill}
            {giftBtn}
            {settingsBtn}
          </div>
        </div>
      </header>
    );
  }

  // Other phones, iPad and browser: classic header below the status bar / notch
  const topPadding = 'calc(max(env(safe-area-inset-top, 0px), 8px) + 2px)';
  return (
    <header
      className="top-nav glass-panel border-b border-white/10 px-2.5 pb-1.5 flex items-center justify-between select-none z-30 shadow-xl sticky top-0 backdrop-blur-2xl shrink-0"
      style={{ paddingTop: topPadding }}
    >
      <button
        data-open-profile
        onClick={() => gameManager.setProfileOpen(true)}
        aria-label={ui(state.lang, 'profile_hint')}
        className="top-nav-left flex items-center gap-1.5 min-w-0 shrink-0 text-left active:scale-95 transition-transform"
      >
        <LevelRing level={state.playerLevel} pct={xpPct} size={30} />
        <div className="flex flex-col justify-center min-w-0 leading-none">
          <span className="text-[10px] font-black text-zinc-100 truncate max-w-[90px]">{state.playerFighter.name}</span>
          <span className="text-[10px] font-mono font-bold text-amber-400 mt-0.5">XP {xpPct}%</span>
        </div>
        <ChevronRight className="w-3 h-3 text-zinc-500 shrink-0" />
      </button>

      <div className="top-nav-actions flex items-center gap-1 sm:gap-1.5 shrink-0 justify-end">
        {coinsPill}
        {gemsPill}
        {giftBtn}
        {settingsBtn}
      </div>
    </header>
  );
};
