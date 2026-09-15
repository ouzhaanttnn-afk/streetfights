import React from 'react';
import { GameStateData, gameManager } from '../core/gameState';
import { t } from '../i18n/translations';
import { 
  Coins, 
  Gem, 
  Zap, 
  Settings, 
  Sparkles,
  Gift
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

  // Compact top padding: env(safe-area-inset-top) handles the exact iOS status bar / Dynamic Island zone.
  // With contentInset: "never", the webview starts at Y=0 behind the status bar.
  // We add 2px breathing room so HUD icons sit snug right below the status bar/island.
  const topPadding = 'calc(max(env(safe-area-inset-top, 0px), 8px) + 2px)';

  return (
    <header
      className="glass-panel border-b border-white/10 px-2.5 pb-1.5 flex items-center justify-between select-none z-30 shadow-xl sticky top-0 backdrop-blur-2xl shrink-0"
      style={{ paddingTop: topPadding }}
    >
      {/* LEFT: Level badge + XP */}
      <div className="flex items-center gap-1.5 min-w-0 shrink-0">
        <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-black font-black text-[11px] shadow-sm shadow-amber-500/30 border border-amber-300/60 shrink-0">
          <span>{state.playerLevel}</span>
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1 leading-none">
            <span className="text-[10px] font-black text-zinc-100 truncate max-w-[70px] sm:max-w-[90px]">
              {state.playerFighter.name}
            </span>
            <span className="text-[8px] font-mono font-bold text-amber-400">
              {xpPct}%
            </span>
          </div>
          <div className="w-16 sm:w-20 h-1 bg-black/70 rounded-full overflow-hidden mt-0.5 border border-white/10 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300 ease-out"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* RIGHT: Currencies + Quick Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap-reverse justify-end">
        {/* Coins */}
        <div className="flex items-center gap-0.5 bg-black/60 border border-amber-500/30 px-1.5 py-0.5 rounded-lg shadow-inner">
          <Coins className="w-2.5 h-2.5 text-amber-400 shrink-0" />
          <span className="text-[10px] font-black font-mono text-amber-300 leading-none">
            {state.coins >= 1000000 ? `${(state.coins / 1000000).toFixed(1)}M` : state.coins >= 10000 ? `${(state.coins / 1000).toFixed(1)}k` : state.coins.toLocaleString()}
          </span>
        </div>

        {/* Gems */}
        <div className="flex items-center gap-0.5 bg-black/60 border border-cyan-500/30 px-1.5 py-0.5 rounded-lg shadow-inner">
          <Gem className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
          <span className="text-[10px] font-black font-mono text-cyan-300 leading-none">
            {state.gems.toLocaleString()}
          </span>
        </div>

        {/* Speed Toggle */}
        <button
          onClick={() => gameManager.cycleBattleSpeed()}
          className="px-1.5 py-0.5 bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-[9px] font-black font-mono text-amber-400 rounded-lg border border-white/10 flex items-center gap-0.5 transition-all shadow-sm"
          title="Battle Speed"
        >
          <Zap className="w-2.5 h-2.5 text-amber-400" />
          <span>{state.battleSpeed}X</span>
        </button>

        {/* Daily */}
        <button
          onClick={() => gameManager.openDailyLogin()}
          className="p-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-black rounded-lg border border-amber-300/60 transition-all shadow-sm flex items-center justify-center relative"
          title="Daily Login Rewards"
        >
          <Gift className="w-3 h-3 text-black" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
        </button>

        {/* Spin */}
        <button
          onClick={() => gameManager.openLuckyWheel()}
          className="p-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white rounded-lg border border-cyan-300/60 transition-all shadow-sm flex items-center justify-center"
          title="Lucky Fortune Wheel"
        >
          <Sparkles className="w-3 h-3 text-yellow-200" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1 bg-neutral-900/90 hover:bg-neutral-800 active:scale-95 text-zinc-400 hover:text-white rounded-lg border border-white/10 transition-all shadow-sm flex items-center justify-center"
          title={t('settings', state.lang)}
        >
          <Settings className="w-3 h-3" />
        </button>
      </div>
    </header>
  );
};
