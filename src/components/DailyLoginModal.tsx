import React from "react";
import { GameStateData, gameManager } from "../core/gameState";
import { t } from "../i18n/translations";
import confetti from "canvas-confetti";
import { 
  Calendar, 
  Coins, 
  Gem, 
  Crown, 
  Sparkles, 
  Flame, 
  Check, 
  X, 
  Gift 
} from "lucide-react";

interface DailyLoginModalProps {
  state: GameStateData;
  onClose: () => void;
}

export const DailyLoginModal: React.FC<DailyLoginModalProps> = ({ state, onClose }) => {
  const rewards = [
    { day: 1, type: "coins", amount: 500, label: "500 Coins", icon: Coins, color: "text-amber-400" },
    { day: 2, type: "gems", amount: 50, label: "50 Gems", icon: Gem, color: "text-cyan-400" },
    { day: 3, type: "buff", amount: 1, label: "2x Damage Token", icon: Flame, color: "text-rose-400" },
    { day: 4, type: "coins", amount: 1500, label: "1,500 Coins", icon: Coins, color: "text-amber-400" },
    { day: 5, type: "gems", amount: 100, label: "100 Gems", icon: Gem, color: "text-cyan-400" },
    { day: 6, type: "gear", amount: 1, label: "Legendary Drop", icon: Sparkles, color: "text-yellow-300" },
    { day: 7, type: "mythic", amount: 250, label: "Mythic Crown + 250 Gems", icon: Crown, color: "text-fuchsia-400", isJackpot: true }
  ];

  const currentStreak = state.dailyLoginStreak || 1;
  const claimedDays = state.claimedDailyDays || [];

  const handleClaim = (day: number) => {
    gameManager.claimDailyLoginReward(day);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-md game-card border-2 border-amber-400/50 rounded-3xl p-5 shadow-2xl flex flex-col text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide text-white uppercase">
                7-DAY LOGIN REWARDS
              </h2>
              <p className="text-[10px] text-zinc-400 font-medium">
                Log in daily to claim escalating gold, gems & mythic gear!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-800 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {rewards.slice(0, 6).map((r) => {
            const isClaimed = claimedDays.includes(r.day);
            const isToday = currentStreak === r.day && !isClaimed;
            const Icon = r.icon;

            return (
              <div
                key={r.day}
                className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-between border text-center transition-all ${
                  isClaimed
                    ? "bg-black/40 border-white/5 opacity-60"
                    : isToday
                    ? "bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20"
                    : "bg-black/60 border-white/10"
                }`}
              >
                <div className="text-[9px] font-black font-mono text-zinc-400 uppercase">
                  Day {r.day}
                </div>
                <div className="my-1.5 p-2 rounded-xl bg-black/50 border border-white/5">
                  <Icon className={`w-5 h-5 ${r.color}`} />
                </div>
                <div className="text-[10px] font-black text-white font-mono truncate max-w-[80px]">
                  {r.label}
                </div>

                {isClaimed ? (
                  <div className="mt-1 flex items-center gap-1 text-[9px] font-black text-emerald-400 font-mono">
                    <Check className="w-3 h-3" /> CLAIMED
                  </div>
                ) : isToday ? (
                  <button
                    onClick={() => handleClaim(r.day)}
                    className="mt-1 w-full py-1 rounded-lg game-btn-gold text-black font-black text-[9px] uppercase shadow-md active:scale-95 animate-pulse"
                  >
                    CLAIM
                  </button>
                ) : (
                  <div className="mt-1 text-[8px] font-mono text-zinc-500 uppercase">
                    LOCKED
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Day 7 Mega Jackpot Card */}
        {(() => {
          const r7 = rewards[6];
          const isClaimed = claimedDays.includes(7);
          const isToday = currentStreak >= 7 && !isClaimed;

          return (
            <div className={`relative rounded-2xl p-3 border-2 flex items-center justify-between ${
              isToday
                ? "bg-gradient-to-r from-purple-950/80 via-fuchsia-950/80 to-black border-fuchsia-400 ring-2 ring-fuchsia-400/60 shadow-xl shadow-fuchsia-500/30"
                : "bg-black/70 border-fuchsia-500/30"
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-300">
                  <Crown className="w-7 h-7 animate-bounce" />
                </div>
                <div>
                  <div className="text-[10px] font-black font-mono text-fuchsia-400 uppercase tracking-widest">
                    DAY 7 GRAND REWARD
                  </div>
                  <div className="text-xs font-black text-white">
                    Mythic Dragon Crown + 250 Gems
                  </div>
                </div>
              </div>

              {isClaimed ? (
                <div className="flex items-center gap-1 text-xs font-black text-emerald-400 font-mono">
                  <Check className="w-4 h-4" /> CLAIMED
                </div>
              ) : isToday ? (
                <button
                  onClick={() => handleClaim(7)}
                  className="px-4 py-2 rounded-xl game-btn-gold text-black font-black text-xs uppercase shadow-xl animate-bounce"
                >
                  CLAIM
                </button>
              ) : (
                <div className="text-[9px] font-mono text-zinc-500 uppercase">
                  DAY 7
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

