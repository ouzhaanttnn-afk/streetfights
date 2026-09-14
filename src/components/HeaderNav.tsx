import React from 'react';
import { GameStateData, gameManager } from '../core/gameState';
import { t } from '../i18n/translations';
import { 
  Coins, 
  Gem, 
  Zap, 
  Settings, 
  Sparkles,
  Gift,
  Trophy
} from 'lucide-react';

interface HeaderNavProps {
  state: GameStateData;
  onOpenSettings: () => void;
  onOpenLeaderboard: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ 
  state, 
  onOpenSettings,
  onOpenLeaderboard 
}) => {
  const xpPct = Math.min(100, Math.round((state.playerXp / state.playerMaxXp) * 100));

  return (
    <header className="glass-panel border-b border-white/10 px-3 py-2.5 flex items-center justify-between select-none z-20 shadow-xl sticky top-0">
      {/* Player Level & XP Indicator */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-black font-black text-xs shadow-lg shadow-amber-500/25 border border-amber-300/50">
          <span>{state.playerLevel}</span>
          <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-100 animate-spin" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center justify-between text-[11px] font-black text-zinc-200">
            <span>LVL {state.playerLevel}</span>
            <span className="text-[9px] font-mono font-bold text-amber-400 ml-1.5">{xpPct}%</span>
          </div>
          <div className="w-20 h-1.5 bg-black/60 rounded-full overflow-hidden mt-0.5 border border-white/10 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300 ease-out shadow-sm shadow-amber-400/50"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Currency Badges */}
      <div className="flex items-center gap-1.5">
        {/* Coins */}
        <div className="flex items-center gap-1 bg-black/50 border border-amber-500/30 px-2.5 py-1 rounded-xl shadow-inner backdrop-blur-sm">
          <Coins className="w-3.5 h-3.5 text-amber-400 drop-shadow" />
          <span className="text-xs font-black font-mono text-amber-300">
            {state.coins.toLocaleString()}
          </span>
        </div>

        {/* Gems */}
        <div className="flex items-center gap-1 bg-black/50 border border-cyan-500/30 px-2.5 py-1 rounded-xl shadow-inner backdrop-blur-sm">
          <Gem className="w-3.5 h-3.5 text-cyan-400 drop-shadow" />
          <span className="text-xs font-black font-mono text-cyan-300">
            {state.gems.toLocaleString()}
          </span>
        </div>

        {/* Free Ad Gift */}
        <button
          onClick={() => gameManager.openRewardedAd({
            type: 'free_gems',
            title: t('adFreeGems', state.lang),
            rewardDesc: '+50 Gems & +1,000 Coins',
          })}
          className="p-1.5 rounded-xl game-btn-gold text-black font-black text-[10px] flex items-center justify-center active:scale-95 transition-all shadow-md shadow-amber-500/30 animate-bounce border border-amber-300/60"
          title={t('freeReward', state.lang)}
        >
          <Gift className="w-3.5 h-3.5 text-black" />
        </button>
      </div>

      {/* Quick Controls: Leaderboard, Speed, Settings */}
      <div className="flex items-center gap-1.5">
        {/* Leaderboard Button */}
        <button
          onClick={onOpenLeaderboard}
          className="p-1.5 bg-neutral-900/90 hover:bg-neutral-800 active:scale-95 text-amber-400 rounded-xl border border-amber-500/30 transition-all shadow-sm flex items-center justify-center hover:border-amber-400"
          title="Global Tier List"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
        </button>

        {/* Speed Toggle */}
        <button
          onClick={() => gameManager.cycleBattleSpeed()}
          className="px-2 py-1 bg-neutral-900/90 hover:bg-neutral-800 active:scale-95 text-[11px] font-black font-mono text-amber-400 rounded-xl border border-white/10 flex items-center gap-0.5 transition-all shadow-sm hover:border-amber-500/40"
          title="Battle Speed"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{state.battleSpeed}x</span>
        </button>

        {/* Settings Gear Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 bg-neutral-900/90 hover:bg-neutral-800 active:scale-95 text-zinc-300 hover:text-white rounded-xl border border-white/10 transition-all shadow-sm hover:border-white/20"
          title={t('settings', state.lang)}
        >
          <Settings className="w-4 h-4 text-zinc-300 hover:rotate-45 transition-transform" />
        </button>
      </div>
    </header>
  );
};
