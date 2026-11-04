import React, { useState } from 'react';
import { GameStateData, gameManager } from '../../core/gameState';
import { t } from '../../i18n/translations';
import { ui } from '../../i18n/ui';
import { gymStatCapped } from '../../core/progression';

const STAT_KEY: Record<string, string> = { atk: 'stat_atk', hp: 'stat_hp', def: 'stat_def', spd: 'stat_spd', critRate: 'stat_crit', comboRate: 'stat_cmb', dodgeRate: 'stat_dge', lifesteal: 'stat_vamp' };
import { 
  Dumbbell, 
  Flame, 
  Shield, 
  Footprints, 
  Zap, 
  Wind, 
  Coins, 
  ArrowUp,
  Tv
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
    <div className="w-full flex flex-col p-3 bg-[#06070a] space-y-3.5 pb-16">
      
      {/* Gym Banner */}
      <div className="game-card rounded-3xl p-4 flex items-center justify-between shadow-2xl border border-amber-500/30">
        <div>
          <h3 className="text-xs font-black text-amber-300 tracking-wider flex items-center gap-2 uppercase">
            <Dumbbell className="w-4 h-4 text-amber-400 drop-shadow" />
            {t('gymTitle', state.lang)}
          </h3>
          <p className="text-[10px] text-zinc-400 mt-1 font-medium">
            {t('gymDesc', state.lang)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-2xl border border-amber-500/30 shadow-inner">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-black font-mono text-amber-300">
            {state.coins.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Short on coins: one free level of the cheapest drill for an optional ad (cooldown + daily cap) */}
      {(() => {
        const open = state.gymTrainings.filter((g) => !gymStatCapped(g.targetStat, state.playerFighter.stats));
        const cheapest = open.sort((a, b) => a.cost - b.cost)[0];
        if (!cheapest || state.coins >= cheapest.cost || !gameManager.gymFreeAvailable()) return null;
        const name = ui(state.lang, cheapest.id) !== cheapest.id ? ui(state.lang, cheapest.id) : cheapest.name;
        return (
          <button
            data-gym-free
            onClick={() => gameManager.openRewardedAd({ type: 'gym_free', trainingId: cheapest.id, title: ui(state.lang, 'gym_free_title'), rewardDesc: name })}
            className="w-full min-h-12 rounded-2xl px-3 flex items-center gap-2.5 bg-gradient-to-r from-amber-500/20 via-black/60 to-black/60 border border-amber-400/50 text-left active:scale-[0.98]"
          >
            <span className="w-8 h-8 shrink-0 rounded-xl game-btn-gold text-black flex items-center justify-center"><Tv className="w-4 h-4" /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-[11px] font-black text-amber-200">{ui(state.lang, 'gym_free_title')}</span>
              <span className="block text-[10px] font-bold text-zinc-300 truncate">{name} · {ui(state.lang, 'ads_left', { n: gameManager.adsLeftToday('gym_free') })}</span>
            </span>
          </button>
        );
      })()}

      {/* Gym Training Drills */}
      <div className="space-y-3">
        {state.gymTrainings.map((training) => {
          const Icon = getTrainingIcon(training.iconName);
          const capped = gymStatCapped(training.targetStat, state.playerFighter.stats);
          const canAfford = state.coins >= training.cost && !capped;
          const isAnimating = activeWorkoutAnim === training.id;

          return (
            <div
              key={training.id}
              className={`rounded-3xl border game-card p-4 flex items-center justify-between transition-all shadow-lg ${
                isAnimating ? 'border-amber-400 scale-[1.02] bg-amber-950/40 shadow-amber-500/30' : 'border-white/10'
              }`}
            >
              {/* Left: Icon & Info */}
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-black/60 border border-white/15 flex items-center justify-center shrink-0 shadow-inner">
                  <Icon className={`w-7 h-7 ${isAnimating ? 'text-amber-300 animate-bounce' : 'text-zinc-200'} drop-shadow`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-zinc-100 tracking-tight">
                      {ui(state.lang, training.id) !== training.id ? ui(state.lang, training.id) : training.name}
                    </h4>
                    <span className="text-[10px] font-black font-mono text-amber-300 bg-black/60 px-2.5 py-0.5 rounded-lg border border-white/10 shadow-inner">
                      Lv.{training.level}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {ui(state.lang, training.id + '_d') !== training.id + '_d' ? ui(state.lang, training.id + '_d') : training.description}
                  </p>
                  <div className="text-[10px] font-black text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>+{training.statGain} {t(STAT_KEY[training.targetStat] || 'stat_atk', state.lang)} {t('perDrill', state.lang)}</span>
                  </div>
                </div>
              </div>

              {/* Right: Train Upgrade Button */}
              <button
                onClick={() => handleTrain(training.id)}
                disabled={!canAfford}
                className={`py-2.5 px-4 rounded-2xl font-black text-xs flex flex-col items-center justify-center min-w-[85px] border transition-all active:scale-95 shadow-md ${
                  canAfford
                    ? 'game-btn-gold text-black border-amber-300 shadow-xl'
                    : 'bg-zinc-850 text-zinc-600 border-zinc-800 cursor-not-allowed'
                }`}
              >
                {capped ? (
                  <span className="text-[11px] uppercase tracking-wider font-black text-emerald-300">{ui(state.lang, 'gym_max')}</span>
                ) : (
                  <>
                    <span className="text-[10px] uppercase tracking-wider font-black">{t('train', state.lang)}</span>
                    <div className="flex items-center gap-1 text-[11px] font-black tabular-nums mt-0.5">
                      <Coins className="w-3 h-3" />
                      <span>{training.cost.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
