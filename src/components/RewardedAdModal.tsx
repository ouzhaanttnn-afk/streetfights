import React, { useEffect, useState } from 'react';
import { GameStateData, gameManager } from '../core/gameState';
import { t } from '../i18n/translations';
import { soundFx } from '../core/audio';
import confetti from 'canvas-confetti';
import { 
  Tv, 
  Sparkles, 
  Check, 
  X, 
  Zap, 
  Coins, 
  Gem, 
  Flame, 
  Shield 
} from 'lucide-react';

interface RewardedAdModalProps {
  state: GameStateData;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({ state }) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(5);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const offer = state.activeAdModal;

  useEffect(() => {
    if (secondsLeft > 0) {
      const timer = setTimeout(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsCompleted(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 },
      });
    }
  }, [secondsLeft]);

  if (!offer) return null;

  const handleClaim = () => {
    gameManager.claimRewardedAdReward();
  };

  const handleClose = () => {
    gameManager.closeRewardedAd();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-sm game-card border-2 border-amber-500/60 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center text-white overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
            <Tv className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('adSponsor', state.lang)}</span>
          </div>

          <div className="text-zinc-400 font-mono text-[11px]">
            {isCompleted ? (
              <span className="text-emerald-400 font-black flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                <Check className="w-3.5 h-3.5" /> {t('adRewardClaim', state.lang)}
              </span>
            ) : (
              <span>{t('adSkipIn', state.lang)}: <strong className="text-amber-400 font-black">{secondsLeft}{t('adSeconds', state.lang)}</strong></span>
            )}
          </div>
        </div>

        {/* Video Commercial Visual Stage */}
        <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-indigo-950/80 via-purple-950/80 to-black border border-white/15 flex flex-col items-center justify-center p-4 relative overflow-hidden mb-4 shadow-inner">
          <div className="absolute inset-0 bg-radial from-amber-500/15 via-transparent to-transparent animate-pulse" />
          
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-black flex items-center justify-center font-black text-2xl mb-2 shadow-xl shadow-amber-500/40 animate-bounce">
            ⚡
          </div>

          <h3 className="text-base font-black tracking-wider text-amber-300 drop-shadow">
            VOLT STRIKER ENERGY DRINK
          </h3>
          <p className="text-[11px] text-zinc-300 italic text-center max-w-[240px] mt-1">
            "Fuel your bicycle kicks with 100% pure adrenaline!"
          </p>

          {/* Video Timer Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/80">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-1000 ease-linear shadow-sm shadow-amber-400"
              style={{ width: `${((5 - secondsLeft) / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Reward Details Box */}
        <div className="w-full bg-black/60 rounded-2xl p-3.5 border border-white/10 mb-4 flex items-center justify-between shadow-inner">
          <div className="text-left">
            <div className="text-xs font-black text-zinc-100">{offer.title}</div>
            <div className="text-[11px] text-emerald-400 font-bold font-mono mt-0.5">{offer.rewardDesc}</div>
          </div>
          <Sparkles className="w-6 h-6 text-amber-400 shrink-0 animate-spin" />
        </div>

        {/* Claim / Close Actions */}
        <div className="w-full grid grid-cols-2 gap-2.5">
          <button
            onClick={handleClose}
            className="py-3 px-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-zinc-400 font-bold text-xs transition-all border border-zinc-700 active:scale-95 shadow-sm"
          >
            {t('unequip', state.lang) === 'ÇIKAR' ? 'Kapat' : 'Dismiss'}
          </button>

          <button
            onClick={handleClaim}
            disabled={!isCompleted}
            className={`py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              isCompleted
                ? 'game-btn-emerald text-black shadow-xl shine-effect'
                : 'bg-zinc-850 text-zinc-600 border border-zinc-800 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{t('adRewardClaim', state.lang)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
