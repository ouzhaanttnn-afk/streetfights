import React from 'react';
import { GameStateData, gameManager } from '../../core/gameState';
import { RARITY_CONFIG } from '../../core/lootGenerator';
import { t } from '../../i18n/translations';
import { 
  Zap, 
  Sparkles, 
  Flame, 
  Shield, 
  Wind, 
  HeartPulse, 
  Crosshair, 
  Dices,
  CircleDot,
  Skull
} from 'lucide-react';

interface SkillsTabProps {
  state: GameStateData;
}

export const SkillsTab: React.FC<SkillsTabProps> = ({ state }) => {
  const getSkillIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap': return Zap;
      case 'Flame': return Flame;
      case 'Shield': return Shield;
      case 'Wind': return Wind;
      case 'HeartPulse': return HeartPulse;
      case 'Crosshair': return Crosshair;
      case 'CircleDot': return CircleDot;
      case 'Skull': return Skull;
      default: return Sparkles;
    }
  };

  return (
    <div className="w-full flex flex-col p-3 bg-[#06070a] space-y-3.5 pb-28">
      
      {/* Header Banner */}
      <div className="game-card rounded-3xl p-4 flex items-center justify-between shadow-2xl border border-white/10">
        <div>
          <h3 className="text-xs font-black text-zinc-100 tracking-wider flex items-center gap-2 uppercase">
            <Zap className="w-4 h-4 text-amber-400 drop-shadow" />
            {t('skillDeck', state.lang)}
          </h3>
          <p className="text-[10px] text-zinc-400 font-bold mt-1">
            <span className="text-amber-300 font-mono font-black">{state.playerFighter.equippedSkills.length}</span> / 6 {t('activeSkills', state.lang)}
          </p>
        </div>

        <button
          onClick={() => gameManager.rerollSkill()}
          disabled={state.coins < 25}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-1.5 border transition-all ${
            state.coins >= 25 
              ? 'game-btn-gold text-black border-amber-300 shadow-xl active:scale-95 shine-effect' 
              : 'bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed'
          }`}
        >
          <Dices className="w-4 h-4" />
          <span>{t('rollSkill', state.lang)} (25 🪙)</span>
        </button>
      </div>

      {/* Equipped Skills List */}
      <div className="space-y-3">
        {state.playerFighter.equippedSkills.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-500 italic game-card rounded-3xl border border-white/5 p-5">
            No active skills yet. Complete stages or roll for skills!
          </div>
        ) : (
          state.playerFighter.equippedSkills.map((skill) => {
            const rarity = RARITY_CONFIG[skill.rarity];
            const Icon = getSkillIcon(skill.iconName);

            return (
              <div
                key={skill.id}
                className={`rounded-3xl border-2 ${rarity.borderColor} ${rarity.bgColor} p-4 shadow-xl flex items-start gap-3.5 relative overflow-hidden game-card`}
              >
                <div className="w-13 h-13 rounded-2xl bg-black/70 border border-white/15 flex items-center justify-center shrink-0 shadow-inner">
                  <Icon className={`w-7 h-7 ${rarity.color} drop-shadow`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-white truncate tracking-tight">
                      {skill.name}
                    </h4>
                    <span className="text-[10px] font-black font-mono text-amber-300 bg-black/70 px-2.5 py-0.5 rounded-xl border border-white/10 shadow-inner">
                      Lv.{skill.level}/{skill.maxLevel}
                    </span>
                  </div>

                  {skill.quote && (
                    <div className="text-[10px] text-zinc-400 italic truncate font-serif mt-0.5">
                      "{skill.quote}"
                    </div>
                  )}

                  <p className="text-[11px] text-zinc-300 mt-1 font-medium leading-tight">
                    {skill.description}
                  </p>

                  <div className="mt-2.5 flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-wider ${rarity.color} bg-black/60 px-2 py-0.5 rounded-lg border border-white/10`}>
                      {rarity.name}
                    </span>
                    <span className="text-[10px] font-mono font-black text-amber-300 bg-black/70 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                      ⚡ {skill.bonusText}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Synergy Recommendations */}
      <div className="game-card rounded-3xl p-4 shadow-2xl border border-white/10">
        <h4 className="text-[11px] font-black text-zinc-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('synergyBuilds', state.lang)}</span>
        </h4>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-black/50 p-3 rounded-2xl border border-rose-500/20 shadow-sm">
            <span className="font-black text-rose-400 block mb-1">🥊 Flurry Striker</span>
            <span className="text-zinc-400 leading-tight">High ATK + Combo Rate + Double Punch</span>
          </div>
          <div className="bg-black/50 p-3 rounded-2xl border border-cyan-500/20 shadow-sm">
            <span className="font-black text-cyan-400 block mb-1">⚡ Counter Ghost</span>
            <span className="text-zinc-400 leading-tight">High Dodge Rate + Counter Strike + SPD</span>
          </div>
          <div className="bg-black/50 p-3 rounded-2xl border border-pink-500/20 shadow-sm">
            <span className="font-black text-pink-400 block mb-1">🩸 Vampiric Berserker</span>
            <span className="text-zinc-400 leading-tight">Lifesteal + Heavy Haymaker + HP Pool</span>
          </div>
          <div className="bg-black/50 p-3 rounded-2xl border border-amber-500/20 shadow-sm">
            <span className="font-black text-amber-400 block mb-1">⚽ Bicycle Overlord</span>
            <span className="text-zinc-400 leading-tight">Crit DMG + Curveball + Thunder Kick</span>
          </div>
        </div>
      </div>
    </div>
  );
};
