import React from "react";
import { GameStateData, gameManager } from "../core/gameState";
import { t } from "../i18n/translations";
import confetti from "canvas-confetti";
import { 
  Coins, 
  Dumbbell, 
  Tv, 
  Check, 
  Clock, 
  Sparkles 
} from "lucide-react";

interface OfflineRewardModalProps {
  state: GameStateData;
  amount: number;
  minutes: number;
  onClose: () => void;
}

export const OfflineRewardModal: React.FC<OfflineRewardModalProps> = ({ 
  state, 
  amount, 
  minutes, 
  onClose 
}) => {
  const handleClaim = (doubleWithAd: boolean) => {
    gameManager.claimOfflineGold(doubleWithAd ? amount * 2 : amount);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.5 }
    });
    onClose();
  };

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  const timeString = hours > 0 ? `${hours}h ${remainingMins}m` : `${remainingMins}m`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-sm game-card border-2 border-amber-400/50 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center text-white overflow-hidden">
        
        {/* Top Header Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] tracking-widest uppercase mb-2 border border-amber-500/40">
          <Clock className="w-3.5 h-3.5" />
          <span>AFK GYM TRAINING COMPLETE</span>
        </div>

        {/* Mascot / Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 text-black flex items-center justify-center text-3xl my-2 shadow-xl shadow-amber-500/30 animate-bounce">
          ??
        </div>

        <h2 className="text-lg font-black text-white mb-1">
          WELCOME BACK, CHAMP!
        </h2>
        <p className="text-xs text-zinc-300 mb-4 px-2 font-medium">
          While you were away for <strong className="text-amber-400">{timeString}</strong>, your fighter trained hard in the underground gym!
        </p>

        {/* Accumulated Gold Box */}
        <div className="w-full bg-black/60 rounded-2xl p-4 border border-white/10 mb-4 flex items-center justify-between shadow-inner">
          <span className="text-xs font-bold text-zinc-400 uppercase">AFK Earnings:</span>
          <div className="flex items-center gap-1.5">
            <Coins className="w-5 h-5 text-amber-400 animate-spin" />
            <span className="text-xl font-black font-mono text-amber-300">
              +{amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Actions: Claim vs 2X Video Ad */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <button
            onClick={() => handleClaim(false)}
            className="py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-zinc-300 font-black text-xs border border-zinc-700 active:scale-95 transition-all"
          >
            CLAIM (+{amount.toLocaleString()})
          </button>

          <button
            onClick={() => handleClaim(true)}
            className="py-3 rounded-2xl game-btn-gold text-black font-black text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 animate-pulse"
          >
            <Tv className="w-4 h-4 text-black" />
            <span>2X WITH AD (+{(amount * 2).toLocaleString()})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

