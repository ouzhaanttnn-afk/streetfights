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
    <header className="glass-panel border-b border-white/10 px-3.5 pt-[max(0.75rem,calc(env(safe-area-inset-top)+0.35rem))] pb-2.5 flex flex-col gap-2 select-none z-30 shadow-xl sticky top-0 backdrop-blur-2xl">
      {/* Row 1: Player Level / XP & Top Controls */}
      <div className="w-full flex items-center justify-between">
        {/* Level & XP */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-black font-black text-xs shadow-md shadow-amber-500/25 border border-amber-300/50">
            <span>{state.playerLevel}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-zinc-200">
              <span className="truncate max-w-[110px]">{state.playerFighter.name}</span>
              <span className="text-[9px] font-mono font-bold text-amber-400 bg-black/60 px-1 py-0.2 rounded border border-white/5">{xpPct}%</span>
            </div>
            <div className="w-24 h-1.5 bg-black/60 rounded-full overflow-hidden mt-0.5 border border-white/10 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300 ease-out"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Speed, Leaderboard & Settings Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Speed Toggle */}
          <button
            onClick={() => gameManager.cycleBattleSpeed()}
            className="px-2 py-1 bg-neutral-900/90 hover:bg-neutral-800 active:scale-95 text-[10px] font-black font-mono text-amber-400 rounded-xl border border-white/10 flex items-center gap-0.5 transition-all shadow-sm"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{state.battleSpeed}X</span>
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={onOpenLeaderboard}
            className="p-1.5 bg-neutral-900/90 hover:bg-neutral-800 active:scale-95 text-amber-400 rounded-xl border border-white/10 transition-all shadow-sm flex items-center justify-center"
            title="Global Tier List"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 bg-neutral-900/90 hover:bg-neutral-800 active:scale-95 text-zinc-400 rounded-xl border border-white/10 transition-all shadow-sm flex items-center justify-center hover:text-white"
            title={t('settings', state.lang)}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row 2: Currencies & Event Shortcuts (7-Day Gift & Lucky Wheel) */}
      <div className="w-full flex items-center justify-between pt-0.5">
        {/* Currencies */}
        <div className="flex items-center gap-1.5">
          {/* Coins */}
          <div className="flex items-center gap-1 bg-black/60 border border-amber-500/30 px-2.5 py-1 rounded-xl shadow-inner">
            <Coins className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-black font-mono text-amber-300">
              {state.coins.toLocaleString()}
            </span>
          </div>

          {/* Gems */}
          <div className="flex items-center gap-1 bg-black/60 border border-cyan-500/30 px-2.5 py-1 rounded-xl shadow-inner">
            <Gem className="w-3 h-3 text-cyan-400" />
            <span className="text-xs font-black font-mono text-cyan-300">
              {state.gems.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Events: 7-Day Daily & Lucky Wheel */}
        <div className="flex items-center gap-1.5">
          {/* 7-Day Login Gift */}
          <button
            onClick={() => gameManager.openDailyLogin()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl game-btn-gold text-black font-black text-[10px] uppercase shadow-md active:scale-95 border border-amber-300/60"
          >
            <Gift className="w-3 h-3 text-black" />
            <span>DAILY</span>
          </button>

          {/* Lucky Wheel */}
          <button
            onClick={() => gameManager.openLuckyWheel()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-[10px] uppercase shadow-md active:scale-95 border border-cyan-300/60"
          >
            <Sparkles className="w-3 h-3 text-yellow-200 animate-spin" />
            <span>SPIN</span>
          </button>
        </div>
      </div>
    </header>
  );
};
