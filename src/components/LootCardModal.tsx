import React from 'react';
import { EquipmentItem } from '../types/game';
import { RARITY_CONFIG, SLOT_INFO } from '../core/lootGenerator';
import { GameStateData, gameManager } from '../core/gameState';
import { ThreeItemViewer } from './ThreeItemViewer';
import { t } from '../i18n/translations';
import { 
  Coins, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  Sparkles 
} from 'lucide-react';

interface LootCardModalProps {
  item: EquipmentItem;
  state: GameStateData;
}

export const LootCardModal: React.FC<LootCardModalProps> = ({ item, state }) => {
  const rarity = RARITY_CONFIG[item.rarity];
  const slotInfo = SLOT_INFO[item.slot];
  const currentEquipped = state.playerFighter.equipped[item.slot];

  const currentPower = currentEquipped ? currentEquipped.powerScore : 0;
  const powerDiff = item.powerScore - currentPower;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      {/* 3D Enhanced Loot Card Box */}
      <div className={`relative w-full max-w-sm rounded-3xl border-2 ${rarity.borderColor} ${rarity.bgColor} p-4 shadow-2xl flex flex-col items-center text-center text-white overflow-hidden game-card`}>
        
        {/* Glow Header */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-[11px] font-black tracking-widest uppercase mb-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('newDrop', state.lang)} ({item.slot.toUpperCase()})</span>
        </div>

        {/* 3D WebGL Turntable Interactive Item Model */}
        <div className="relative my-0.5 flex items-center justify-center">
          <ThreeItemViewer slot={item.slot} rarity={item.rarity} size={135} />
          <span className="absolute bottom-0 text-[8px] text-zinc-400 font-mono tracking-wider opacity-60">
            DRAG TO ROTATE 3D
          </span>
        </div>

        {/* Item Name & Rarity */}
        <h2 className="text-lg font-black tracking-tight text-white mb-0.5">
          {item.name}
        </h2>
        <div className={`text-[11px] font-black uppercase tracking-wider ${rarity.color} mb-2`}>
          {rarity.name} • Lv.{item.level} {slotInfo.label}
        </div>

        {/* Power Score Comparison Badge */}
        <div className="flex items-center justify-center gap-2 bg-black/50 px-3 py-1.5 rounded-xl border border-white/10 mb-2.5 w-full shadow-inner">
          <span className="text-xs text-zinc-400 font-semibold">{t('powerScoreLabel', state.lang)}:</span>
          <span className="text-sm font-black font-mono text-amber-400">⚡ {item.powerScore}</span>
          {powerDiff !== 0 && (
            <span className={`text-xs font-bold flex items-center ${powerDiff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {powerDiff > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {powerDiff > 0 ? `+${powerDiff}` : powerDiff}
            </span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="w-full bg-black/60 rounded-2xl p-2.5 border border-white/5 mb-3 text-left space-y-1">
          {item.stats.hp > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Health (HP)</span>
              <span className="font-mono font-bold text-emerald-400">+{item.stats.hp}</span>
            </div>
          )}
          {item.stats.atk > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Attack (ATK)</span>
              <span className="font-mono font-bold text-rose-400">+{item.stats.atk}</span>
            </div>
          )}
          {item.stats.def > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Defense (DEF)</span>
              <span className="font-mono font-bold text-sky-400">+{item.stats.def}</span>
            </div>
          )}
          {item.stats.spd > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Speed (SPD)</span>
              <span className="font-mono font-bold text-amber-400">+{item.stats.spd}</span>
            </div>
          )}
          {item.stats.critRate > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Crit Rate</span>
              <span className="font-mono font-bold text-purple-400">+{item.stats.critRate}%</span>
            </div>
          )}
          {item.stats.comboRate > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Combo Rate</span>
              <span className="font-mono font-bold text-yellow-400">+{item.stats.comboRate}%</span>
            </div>
          )}
          {item.stats.dodgeRate > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Dodge Chance</span>
              <span className="font-mono font-bold text-cyan-400">+{item.stats.dodgeRate}%</span>
            </div>
          )}
          {item.stats.lifesteal > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Vampiric Lifesteal</span>
              <span className="font-mono font-bold text-pink-400">+{item.stats.lifesteal}%</span>
            </div>
          )}
        </div>

        {/* Action Buttons: SELL vs EQUIP */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <button
            onClick={() => gameManager.sellItem(item)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-zinc-300 font-black text-xs border border-zinc-700 transition-all shadow-sm"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('sell', state.lang)} (+{item.sellPrice})</span>
          </button>

          <button
            onClick={() => gameManager.equipItem(item)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl game-btn-emerald text-black font-black text-xs shadow-lg active:scale-95 transition-all shine-effect"
          >
            <Check className="w-4 h-4 text-black" />
            <span>{t('equipKeep', state.lang)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
