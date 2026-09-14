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
    <div className="w-full flex flex-col p-3 bg-[#06070a] space-y-3.5 pb-28">
      
      {/* Header */}
      <div className="game-card rounded-3xl p-4 flex items-center justify-between shadow-2xl border border-purple-500/40">
        <div>
          <h3 className="text-xs font-black text-purple-300 tracking-wider flex items-center gap-2 uppercase">
            <Terminal className="w-4 h-4 text-purple-400 drop-shadow" />
            BLACK MARKET & DEV TOOLS
          </h3>
          <p className="text-[10px] text-zinc-400 mt-1 font-medium">
            Auto-loot filters, dev sandboxes, and progression tools.
          </p>
        </div>
      </div>

      {/* Auto-Sell Filter Setting */}
      <div className="game-card rounded-3xl p-4 shadow-2xl border border-white/10 space-y-2.5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-black text-zinc-100 uppercase tracking-wider">
            Auto-Sell Loot Filter
          </h4>
        </div>
        <p className="text-[10px] text-zinc-400 mb-2 font-medium">
          Automatically convert dropped equipment at or below selected rarity into instant gold without opening popup.
        </p>

        <div className="grid grid-cols-5 gap-1.5">
          {rarities.map((r) => {
            const isSelected = state.autoSellRarity === r;
            return (
              <button
                key={r}
                onClick={() => gameManager.setAutoSellRarity(r)}
                className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase transition-all border ${
                  isSelected
                    ? 'game-btn-gold text-black border-amber-300 shadow-md scale-105'
                    : 'bg-neutral-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sandbox & Instant Boosts */}
      <div className="game-card rounded-3xl p-4 shadow-2xl border border-white/10 space-y-3">
        <h4 className="text-xs font-black text-zinc-100 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 drop-shadow" />
          Dev Sandbox Tools
        </h4>

        <div className="grid grid-cols-2 gap-2.5">
          {/* +5,000 Coins */}
          <button
            onClick={() => gameManager.cheatAddCoins(5000)}
            className="p-3 rounded-2xl bg-gradient-to-b from-amber-950/50 to-neutral-950 border border-amber-500/30 text-amber-300 font-black text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md hover:border-amber-400"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>+5,000 Coins</span>
          </button>

          {/* +200 Gems */}
          <button
            onClick={() => gameManager.cheatAddGems(200)}
            className="p-3 rounded-2xl bg-gradient-to-b from-cyan-950/50 to-neutral-950 border border-cyan-500/30 text-cyan-300 font-black text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md hover:border-cyan-400"
          >
            <Gem className="w-4 h-4 text-cyan-400" />
            <span>+200 Gems</span>
          </button>

          {/* Drop Legendary Gear */}
          <button
            onClick={() => gameManager.cheatDropRandomGear('legendary')}
            className="p-3 rounded-2xl bg-gradient-to-b from-purple-950/50 to-neutral-950 border border-purple-500/30 text-purple-300 font-black text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md hover:border-purple-400"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Drop Legendary</span>
          </button>

          {/* Drop Mythic Gear */}
          <button
            onClick={() => gameManager.cheatDropRandomGear('mythic')}
            className="p-3 rounded-2xl bg-gradient-to-b from-rose-950/50 to-neutral-950 border border-rose-500/30 text-rose-300 font-black text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md hover:border-rose-400"
          >
            <Zap className="w-4 h-4 text-rose-400" />
            <span>Drop Mythic Gear</span>
          </button>

          {/* Unlock All Stages */}
          <button
            onClick={() => gameManager.cheatUnlockAllStages()}
            className="p-3 rounded-2xl bg-gradient-to-b from-emerald-950/50 to-neutral-950 border border-emerald-500/30 text-emerald-300 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 col-span-2 shadow-md hover:border-emerald-400"
          >
            <Unlock className="w-4 h-4 text-emerald-400" />
            <span>Unlock All 5 Worlds & Stages</span>
          </button>
        </div>
      </div>

      {/* Game Statistics & Reset */}
      <div className="game-card rounded-3xl p-4 shadow-2xl border border-white/10 space-y-3">
        <h4 className="text-xs font-black text-zinc-100 uppercase tracking-wider">
          Career Statistics
        </h4>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-black/50 p-2.5 rounded-2xl border border-white/5">
            <span className="text-zinc-500 block text-[10px] font-bold">Fights Won</span>
            <span className="font-mono font-black text-zinc-200 text-sm">{state.totalFightsWon}</span>
          </div>
          <div className="bg-black/50 p-2.5 rounded-2xl border border-white/5">
            <span className="text-zinc-500 block text-[10px] font-bold">Bosses Defeated</span>
            <span className="font-mono font-black text-amber-400 text-sm">{state.bossDefeatedCount}</span>
          </div>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to reset all game progress?')) {
              gameManager.resetGame();
            }
          }}
          className="w-full py-3 rounded-2xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md mt-1"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Career Data</span>
        </button>
      </div>
    </div>
  );
};
