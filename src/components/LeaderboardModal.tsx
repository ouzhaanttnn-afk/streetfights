import React from 'react';
import { GameStateData } from '../core/gameState';
import { TOP_TIER_PLAYERS } from '../core/leaderboardData';
import { t } from '../i18n/translations';
import { 
  Trophy, 
  Crown, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  X, 
  Zap, 
  Globe, 
  Medal, 
  Timer,
  ChevronRight
} from 'lucide-react';

interface LeaderboardModalProps {
  state: GameStateData;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ state, onClose }) => {
  const pPower = state.playerFighter.stats.powerScore;
  
  // Calculate Player Tier & Rank
  const getPlayerTierInfo = (power: number) => {
    if (power >= 12000) return { tier: 'Apex', color: 'text-amber-400 bg-amber-950/80 border-amber-400', nextTier: 15000, nextName: 'Pinnacle', rank: 2 };
    if (power >= 9000) return { tier: 'Grandmaster', color: 'text-purple-400 bg-purple-950/80 border-purple-400', nextTier: 12000, nextName: 'Apex', rank: 5 };
    if (power >= 6000) return { tier: 'Master', color: 'text-cyan-400 bg-cyan-950/80 border-cyan-400', nextTier: 9000, nextName: 'Grandmaster', rank: 8 };
    if (power >= 3000) return { tier: 'Diamond', color: 'text-sky-400 bg-sky-950/80 border-sky-400', nextTier: 6000, nextName: 'Master', rank: 24 };
    if (power >= 1500) return { tier: 'Platinum', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-400', nextTier: 3000, nextName: 'Diamond', rank: 142 };
    if (power >= 600) return { tier: 'Gold Striker', color: 'text-yellow-400 bg-yellow-950/80 border-yellow-400', nextTier: 1500, nextName: 'Platinum', rank: 850 };
    return { tier: 'Street Rookie', color: 'text-zinc-400 bg-zinc-900 border-zinc-700', nextTier: 600, nextName: 'Gold Striker', rank: 2450 };
  };

  const pTier = getPlayerTierInfo(pPower);
  const tierProgress = Math.min(100, Math.round((pPower / pTier.nextTier) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-sm game-card rounded-3xl p-5 shadow-2xl flex flex-col text-white max-h-[90vh] overflow-y-auto border border-amber-500/40">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner">
              <Trophy className="w-5 h-5 text-amber-400 drop-shadow" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                <span>GLOBAL TIER LADDER</span>
                <span className="text-[10px] text-amber-400 font-mono font-black bg-amber-950/90 px-2 py-0.2 rounded-lg border border-amber-500/40">S1</span>
              </h2>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5 font-medium">
                <Timer className="w-3 h-3 text-amber-400" /> Season ends in 4d 18h
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-zinc-400 hover:text-white transition-all border border-zinc-700 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Player's Current Rank Summary Card */}
        <div className="game-card-gold rounded-3xl p-4 mb-4 shadow-xl relative overflow-hidden border border-amber-500/50">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-black font-black flex items-center justify-center text-sm shadow-md border border-amber-300">
                #{pTier.rank}
              </div>
              <div>
                <span className="text-sm font-black text-white">{state.playerFighter.name}</span>
                <div className="text-[10px] font-black text-amber-300 flex items-center gap-1">
                  <span>{pTier.tier} Division</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-black font-mono text-amber-300">⚡ {pPower.toLocaleString()}</span>
              <span className="text-[9px] text-zinc-400 block font-mono font-bold">Stage {state.currentWorld}-{state.currentSubStage}</span>
            </div>
          </div>

          {/* Progress to next tier */}
          <div className="space-y-1.5 pt-2 border-t border-amber-500/20">
            <div className="flex justify-between text-[10px] font-black text-zinc-200">
              <span>Next Rank: {pTier.nextName}</span>
              <span className="font-mono text-amber-300">{pPower.toLocaleString()} / {pTier.nextTier.toLocaleString()}</span>
            </div>
            <div className="w-full h-2.5 bg-black/70 rounded-full overflow-hidden border border-amber-500/30 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-300 shadow-sm shadow-amber-400"
                style={{ width: `${tierProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Top Tier Leaderboard Roster */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider block px-1">
            Top Global Champions
          </span>

          {TOP_TIER_PLAYERS.map((entry) => {
            const isTop1 = entry.rank === 1;
            const isTop2 = entry.rank === 2;
            const isTop3 = entry.rank === 3;

            return (
              <div
                key={entry.rank}
                className={`rounded-3xl border p-3 flex items-center justify-between transition-all shadow-md ${
                  isTop1
                    ? 'bg-gradient-to-r from-amber-950/80 via-neutral-900 to-amber-950/80 border-amber-400 shadow-amber-500/20'
                    : isTop2
                      ? 'bg-gradient-to-r from-zinc-900 via-neutral-900 to-zinc-900 border-zinc-400/80'
                      : isTop3
                        ? 'bg-gradient-to-r from-amber-950/50 to-neutral-900 border-amber-700/80'
                        : 'bg-neutral-900/90 border-zinc-800'
                }`}
              >
                {/* Left Rank & Avatar */}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-2xl font-black text-xs flex items-center justify-center border shadow-sm ${
                    isTop1 ? 'bg-amber-500 text-black border-amber-300 font-black text-sm' :
                    isTop2 ? 'bg-zinc-300 text-black border-white font-black' :
                    isTop3 ? 'bg-amber-700 text-white border-amber-500 font-black' :
                    'bg-neutral-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {isTop1 ? '👑' : entry.rank}
                  </div>

                  <div
                    className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs border border-white/20 shadow-inner"
                    style={{ backgroundColor: entry.avatarColor }}
                  >
                    <span className="text-base drop-shadow">🥊</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-zinc-100 truncate max-w-[110px]">
                        {entry.name}
                      </span>
                      <span className="text-xs">{entry.flag}</span>
                    </div>
                    <span className="text-[9px] text-zinc-400 block truncate max-w-[130px] font-medium">
                      {entry.title}
                    </span>
                  </div>
                </div>

                {/* Right: Power Score & Tier */}
                <div className="text-right">
                  <span className="text-xs font-black font-mono text-amber-300 block">
                    ⚡ {entry.powerScore.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400 font-mono">
                    {entry.stageProgress}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
