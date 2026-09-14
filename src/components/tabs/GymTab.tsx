import React, { useState } from 'react';
import { GameStateData, gameManager } from '../../core/gameState';
import { t } from '../../i18n/translations';
import { 
  Dumbbell, 
  Flame, 
  Shield, 
  Footprints, 
  Zap, 
  Wind, 
  Coins, 
  ArrowUp
} from 'lucide-react';

interface GymTabProps {
  state: GameStateData;
}

export const GymTab: React.FC<GymTabProps> = ({ state }) => {
  const [activeWorkoutAnim, setActiveWorkoutAnim] = useState<string | null>(null);

  const getTrainingIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return Flame;
      case 'Shield': return Shield;
      case 'Footprints': return Footprints;
      case 'Zap': return Zap;
      case 'Wind': return Wind;
      default: return Dumbbell;
    }
  };

  const handleTrain = (id: string) => {
    const success = gameManager.trainGym(id);
    if (success) {
      setActiveWorkoutAnim(id);
      setTimeout(() => setActiveWorkoutAnim(null), 400);
    }
  };

  return (
    <div className="w-full flex flex-col p-3 bg-neutral-950 space-y-3.5 pb-28">
      
      {/* Gym Banner */}
      <div className="game-card rounded-2xl p-3.5 flex items-center justify-between shadow-xl border border-amber-500/30">
        <div>
          <h3 className="text-xs font-black text-amber-300 tracking-wider flex items-center gap-1.5 uppercase">
            <Dumbbell className="w-4 h-4 text-amber-400" />
            {t('gymTitle', state.lang)}
          </h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            {t('gymDesc', state.lang)}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-xl border border-amber-500/30 shadow-inner">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-black font-mono text-amber-300">
            {state.coins.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Gym Training Drills */}
      <div className="space-y-2.5">
        {state.gymTrainings.map((training) => {
          const Icon = getTrainingIcon(training.iconName);
          const canAfford = state.coins >= training.cost;
          const isAnimating = activeWorkoutAnim === training.id;

          return (
            <div
              key={training.id}
              className={`rounded-2xl border game-card p-3.5 flex items-center justify-between transition-all shadow-md ${
                isAnimating ? 'border-amber-400 scale-[1.02] bg-amber-950/40 shadow-amber-500/20' : 'border-white/5'
              }`}
            >
              {/* Left: Icon & Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                  <Icon className={`w-6 h-6 ${isAnimating ? 'text-amber-400 animate-bounce' : 'text-zinc-200'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-zinc-100">
                      {training.name}
                    </h4>
                    <span className="text-[10px] font-black font-mono text-amber-400 bg-black/50 px-2 py-0.2 rounded-lg border border-white/10">
                      Lv.{training.level}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {training.description}
                  </p>
                  <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                    <ArrowUp className="w-3 h-3" />
                    <span>+{training.statGain} {training.targetStat.toUpperCase()} {t('perDrill', state.lang)}</span>
                  </div>
                </div>
              </div>

              {/* Right: Train Upgrade Button */}
              <button
                onClick={() => handleTrain(training.id)}
                disabled={!canAfford}
                className={`py-2 px-3.5 rounded-xl font-black text-xs flex flex-col items-center justify-center min-w-[78px] border transition-all active:scale-95 shadow-md ${
                  canAfford
                    ? 'game-btn-gold text-black border-amber-300'
                    : 'bg-zinc-850 text-zinc-600 border-zinc-800 cursor-not-allowed'
                }`}
              >
                <span className="text-[9px] uppercase tracking-wider font-black">{t('train', state.lang)}</span>
                <div className="flex items-center gap-0.5 text-[11px] font-mono">
                  <Coins className="w-3 h-3" />
                  <span>{training.cost}</span>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
