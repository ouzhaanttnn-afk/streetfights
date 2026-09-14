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
    <header className="bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 border-b border-zinc-800/80 px-2.5 py-2 flex items-center justify-between select-none z-20 shadow-md">
      {/* Player Level & XP Indicator */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-black font-black text-xs shadow-lg shadow-amber-500/20 border border-amber-300/40">
          {state.playerLevel}
          <Sparkles className="w-2.5 h-2.5 absolute -top-1 -right-1 text-yellow-200 animate-spin" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-300">
            <span>Lv.{state.playerLevel}</span>
            <span className="text-[9px] font-mono text-amber-400/90 ml-1">{xpPct}%</span>
          </div>
          <div className="w-16 h-1.5 bg-neutral-950 rounded-full overflow-hidden mt-0.5 border border-zinc-700/60 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300 ease-out"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Currency Badges */}
      <div className="flex items-center gap-1.5">
        {/* Coins */}
        <div className="flex items-center gap-1 bg-gradient-to-r from-amber-950/80 to-neutral-900 border border-amber-500/40 px-2 py-1 rounded-xl shadow-inner">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-black font-mono text-amber-300">
            {state.coins.toLocaleString()}
          </span>
        </div>

        {/* Gems */}
        <div className="flex items-center gap-1 bg-gradient-to-r from-cyan-950/80 to-neutral-900 border border-cyan-500/40 px-2 py-1 rounded-xl shadow-inner">
          <Gem className="w-3.5 h-3.5 text-cyan-400" />
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
          className="p-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 text-black font-bold text-[10px] flex items-center justify-center active:scale-95 transition-all shadow-md shadow-amber-500/30 animate-pulse border border-amber-300/40"
          title={t('freeReward', state.lang)}
        >
          <Gift className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Controls: Leaderboard, Speed, Settings */}
      <div className="flex items-center gap-1">
        {/* Leaderboard Button */}
        <button
          onClick={onOpenLeaderboard}
          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-amber-400 hover:text-amber-300 rounded-xl border border-amber-500/40 transition-all shadow-sm flex items-center justify-center"
          title="Global Tier List"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
        </button>

        {/* Speed Toggle */}
        <button
          onClick={() => gameManager.cycleBattleSpeed()}
          className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-[11px] font-black font-mono text-amber-400 rounded-xl border border-zinc-700/80 flex items-center gap-0.5 transition-all shadow-sm"
          title="Battle Speed"
        >
          <Zap className="w-3 h-3 text-amber-400" />
          <span>{state.battleSpeed}x</span>
        </button>

        {/* Settings Gear Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-zinc-300 hover:text-white rounded-xl border border-zinc-700/80 transition-all shadow-sm"
          title={t('settings', state.lang)}
        >
          <Settings className="w-4 h-4 text-zinc-300 hover:rotate-45 transition-transform" />
        </button>
      </div>
    </header>
  );
};
