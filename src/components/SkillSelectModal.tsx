import React from 'react';
import { Skill } from '../types/game';
import { RARITY_CONFIG } from '../core/lootGenerator';
import { GameStateData, gameManager } from '../core/gameState';
import { t } from '../i18n/translations';
import { 
  Sparkles, 
  Dices, 
  Check, 
  Zap, 
  Shield, 
  Flame, 
  Wind, 
  HeartPulse, 
  Crosshair,
  Coins
} from 'lucide-react';

interface SkillSelectModalProps {
  skill: Skill;
  state: GameStateData;
}

export const SkillSelectModal: React.FC<SkillSelectModalProps> = ({ skill, state }) => {
  const rarity = RARITY_CONFIG[skill.rarity];
  const canReroll = state.coins >= 25;

  const renderIcon = () => {
    switch (skill.iconName) {
      case 'Zap': return <Zap className="w-8 h-8 text-yellow-400" />;
      case 'Flame': return <Flame className="w-8 h-8 text-orange-400" />;
      case 'Shield': return <Shield className="w-8 h-8 text-sky-400" />;
      case 'Wind': return <Wind className="w-8 h-8 text-cyan-400" />;
      case 'HeartPulse': return <HeartPulse className="w-8 h-8 text-pink-400" />;
      case 'Crosshair': return <Crosshair className="w-8 h-8 text-purple-400" />;
      default: return <Sparkles className="w-8 h-8 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className={`relative w-full max-w-sm rounded-2xl border-2 ${rarity.borderColor} ${rarity.bgColor} p-6 shadow-2xl ${rarity.glowColor} flex flex-col items-center text-center text-white`}>
        
        {/* Header Tag */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-xs font-black tracking-widest uppercase mb-4 text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('newRogueliteSkill', state.lang)}</span>
        </div>

        {/* Skill Icon */}
        <div className="w-16 h-16 rounded-2xl bg-black/60 border border-white/20 flex items-center justify-center mb-3 shadow-inner">
          {renderIcon()}
        </div>

        {/* Skill Name */}
        <h2 className="text-2xl font-black tracking-tight text-white mb-1">
          {skill.name}
        </h2>

        {/* Quote */}
        {skill.quote && (
          <p className="text-xs text-zinc-300 italic mb-3 font-serif">
            {skill.quote}
          </p>
        )}

        {/* Rarity & Category */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${rarity.color} bg-black/40 border border-white/10`}>
            {rarity.name}
          </span>
          <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider text-zinc-300 bg-black/40 border border-white/10">
            {skill.category}
          </span>
        </div>

        {/* Skill Effect Box */}
        <div className="w-full bg-black/60 rounded-xl p-3.5 border border-white/10 mb-5 text-center">
          <div className="text-xs text-zinc-400 mb-1">{skill.description}</div>
          <div className="text-sm font-black text-amber-400 font-mono mt-2 flex items-center justify-center gap-1">
            ⚡ {skill.bonusText}
          </div>
        </div>

        {/* Actions: ROLL AGAIN vs CLAIM */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={() => gameManager.rerollSkill()}
            disabled={!canReroll}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-black text-xs border transition-all ${
              canReroll 
                ? 'bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-amber-400 border-amber-600/40' 
                : 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>{t('rollSkill', state.lang)} (25 🪙)</span>
          </button>

          <button
            onClick={() => gameManager.claimSkill(skill)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-black font-black text-xs shadow-lg shadow-amber-500/30 transition-all"
          >
            <Check className="w-4 h-4 text-black" />
            <span>{t('claimSkill', state.lang)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
