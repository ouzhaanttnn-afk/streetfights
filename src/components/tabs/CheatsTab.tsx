import React from 'react';
import { GameStateData, gameManager } from '../../core/gameState';
import { Rarity } from '../../types/game';
import { 
  Terminal, 
  Coins, 
  Gem, 
  Sparkles, 
  Trash2, 
  RotateCcw, 
  Unlock, 
  Zap,
  Filter
} from 'lucide-react';

interface CheatsTabProps {
  state: GameStateData;
}

export const CheatsTab: React.FC<CheatsTabProps> = ({ state }) => {
  const rarities: (Rarity | 'none')[] = ['none', 'common', 'uncommon', 'rare', 'epic'];

  return (
    <div className="w-full flex flex-col p-3 bg-neutral-950 space-y-4 pb-28">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950/60 to-neutral-900 border border-purple-600/30 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
        <div>
          <h3 className="text-xs font-black text-purple-300 tracking-wider flex items-center gap-1.5 uppercase">
            <Terminal className="w-4 h-4 text-purple-400" />
            BLACK MARKET & SETTINGS
          </h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            Auto-loot filters, dev sandboxes, and progression tools.
          </p>
        </div>
      </div>

      {/* Auto-Sell Filter Setting */}
      <div className="bg-neutral-900 border border-zinc-800 rounded-2xl p-3.5 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-black text-zinc-100 uppercase tracking-wider">
            Auto-Sell Loot Filter
          </h4>
        </div>
        <p className="text-[10px] text-zinc-400 mb-3">
          Automatically convert dropped equipment at or below selected rarity into instant gold without opening popup.
        </p>

        <div className="grid grid-cols-5 gap-1.5">
          {rarities.map((r) => {
            const isSelected = state.autoSellRarity === r;
            return (
              <button
                key={r}
                onClick={() => gameManager.setAutoSellRarity(r)}
                className={`py-1.5 px-1 rounded-xl text-[10px] font-black uppercase transition-all border ${
                  isSelected
                    ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sandbox & Instant Boosts */}
      <div className="bg-neutral-900 border border-zinc-800 rounded-2xl p-3.5 shadow-lg space-y-3">
        <h4 className="text-xs font-black text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Dev Sandbox Tools
        </h4>

        <div className="grid grid-cols-2 gap-2">
          {/* +5,000 Coins */}
          <button
            onClick={() => gameManager.cheatAddCoins(5000)}
            className="p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/30 text-amber-300 font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>+5,000 Coins</span>
          </button>

          {/* +200 Gems */}
          <button
            onClick={() => gameManager.cheatAddGems(200)}
            className="p-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-600/30 text-cyan-300 font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
          >
            <Gem className="w-4 h-4 text-cyan-400" />
            <span>+200 Gems</span>
          </button>

          {/* Drop Legendary Gear */}
          <button
            onClick={() => gameManager.cheatDropRandomGear('legendary')}
            className="p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-600/30 text-purple-300 font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Drop Legendary</span>
          </button>

          {/* Drop Mythic Gear */}
          <button
            onClick={() => gameManager.cheatDropRandomGear('mythic')}
            className="p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-600/30 text-rose-300 font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
          >
            <Zap className="w-4 h-4 text-rose-400" />
            <span>Drop Mythic Gear</span>
          </button>

          {/* Unlock All Stages */}
          <button
            onClick={() => gameManager.cheatUnlockAllStages()}
            className="p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-600/30 text-emerald-300 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 col-span-2"
          >
            <Unlock className="w-4 h-4 text-emerald-400" />
            <span>Unlock All 5 Worlds & Stages</span>
          </button>
        </div>
      </div>

      {/* Game Statistics & Reset */}
      <div className="bg-neutral-900 border border-zinc-800 rounded-2xl p-3.5 shadow-lg space-y-2.5">
        <h4 className="text-xs font-black text-zinc-100 uppercase tracking-wider">
          Career Statistics
        </h4>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-black/40 p-2 rounded-lg border border-zinc-800">
            <span className="text-zinc-500 block text-[10px]">Fights Won</span>
            <span className="font-mono font-bold text-zinc-200">{state.totalFightsWon}</span>
          </div>
          <div className="bg-black/40 p-2 rounded-lg border border-zinc-800">
            <span className="text-zinc-500 block text-[10px]">Bosses Defeated</span>
            <span className="font-mono font-bold text-amber-400">{state.bossDefeatedCount}</span>
          </div>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to reset all game progress?')) {
              gameManager.resetGame();
            }
          }}
          className="w-full py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 mt-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Career Data</span>
        </button>
      </div>
    </div>
  );
};
