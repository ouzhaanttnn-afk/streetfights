import React, { Suspense, lazy } from 'react';
import { EquipmentItem } from '../types/game';
import { RARITY_CONFIG } from '../core/lootGenerator';
import { RARITY_HEX } from '../game/itemModels';
import { ui } from '../i18n/ui';
import { itemName, rarityName } from '../i18n/content-helpers';
import { GameStateData, gameManager } from '../core/gameState';
import { t } from '../i18n/translations';
import { 
  Coins, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  Sparkles 
} from 'lucide-react';

const ThreeItemViewer = lazy(() => import('./ThreeItemViewer').then((module) => ({ default: module.ThreeItemViewer })));

interface LootCardModalProps {
  item: EquipmentItem;
  state: GameStateData;
}

export const LootCardModal: React.FC<LootCardModalProps> = ({ item, state }) => {
  const rarity = RARITY_CONFIG[item.rarity];
  // Godrays take the rarity colour so epic reads purple, legendary gold, mythic red
  const rarityHex = '#' + RARITY_HEX[item.rarity].toString(16).padStart(6, '0');
  const currentEquipped = state.playerFighter.equipped[item.slot];

  const currentPower = currentEquipped ? currentEquipped.powerScore : 0;
  const powerDiff = item.powerScore - currentPower;

  return (
    <div className="modal-shell fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      {/* 3D Enhanced Loot Card Box */}
      <div className={`relative w-full max-w-sm rounded-3xl border-2 ${rarity.borderColor} ${rarity.bgColor} p-5 shadow-2xl flex flex-col items-center text-center text-white overflow-hidden game-card ${
        ['epic', 'legendary', 'mythic'].includes(item.rarity) ? 'ring-2 ring-white/10' : ''
      }`}>
        
        {/* Rotating Godrays Light Beams for Rare+ Items */}
        {['rare', 'epic', 'legendary', 'mythic'].includes(item.rarity) && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[340px] h-[340px] pointer-events-none opacity-30 godrays-spin -z-0">
            <svg viewBox="0 0 200 200" className="w-full h-full" style={{ color: rarityHex }}>
              <defs>
                <radialGradient id="godrayGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="currentColor" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </radialGradient>
              </defs>
              <g fill="url(#godrayGrad)">
                {[...Array(12)].map((_, i) => (
                  <polygon
                    key={i}
                    points="100,100 85,0 115,0"
                    transform={`rotate(${i * 30} 100 100)`}
                  />
                ))}
              </g>
            </svg>
          </div>
        )}

        {/* Glow Header */}
        <div className="relative z-10 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/70 border border-white/10 text-[10px] font-black tracking-widest uppercase mb-1 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('newDrop', state.lang)} • {ui(state.lang, 'slot_' + item.slot)}</span>
        </div>

        {/* 3D WebGL Turntable Interactive Item Model */}
        <div className="relative z-10 my-1 flex items-center justify-center">
          <Suspense fallback={<div className="w-[180px] h-[180px]" />}>
            <ThreeItemViewer slot={item.slot} rarity={item.rarity} size={180} />
          </Suspense>
        </div>
        <span className="relative z-10 -mt-1 mb-1 text-[10px] text-zinc-400 font-bold">{ui(state.lang, 'drag_rotate')}</span>

        {/* Item Name & Rarity */}
        <h2 className="text-xl font-black tracking-tight text-white mb-0.5">
          {itemName(item, state.lang)}
        </h2>
        <div className={`text-[11px] font-black uppercase tracking-wider ${rarity.color} mb-3`}>
          {rarityName(item.rarity, rarity.name, state.lang)} • Lv.{item.level} {ui(state.lang, 'slot_' + item.slot)}
        </div>

        {/* Power Score Comparison Badge */}
        <div className="flex items-center justify-between bg-black/60 px-3.5 py-2 rounded-2xl border border-white/10 mb-3 w-full shadow-inner">
          <span className="text-xs text-zinc-400 font-bold uppercase">{t('powerScoreLabel', state.lang)}:</span>
          <div className="flex items-center gap-2">
            <span className="text-base font-black font-mono text-amber-400">⚡ {item.powerScore}</span>
            {powerDiff !== 0 && (
              <span className={`text-xs font-black font-mono flex items-center px-1.5 py-0.5 rounded-md ${
                powerDiff > 0 ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/30' : 'text-rose-400 bg-rose-950/60 border border-rose-500/30'
              }`}>
                {powerDiff > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {powerDiff > 0 ? `+${powerDiff}` : powerDiff}
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="w-full bg-black/50 rounded-2xl p-3 border border-white/5 mb-4 text-left space-y-1.5 text-xs">
          {item.stats.hp > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">{t('stat_hp', state.lang)}</span>
              <span className="font-mono font-black text-emerald-400">+{item.stats.hp}</span>
            </div>
          )}
          {item.stats.atk > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">{t('stat_atk', state.lang)}</span>
              <span className="font-mono font-black text-rose-400">+{item.stats.atk}</span>
            </div>
          )}
          {item.stats.def > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">{t('stat_def', state.lang)}</span>
              <span className="font-mono font-black text-sky-400">+{item.stats.def}</span>
            </div>
          )}
          {item.stats.spd > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">{t('stat_spd', state.lang)}</span>
              <span className="font-mono font-black text-amber-400">+{item.stats.spd}</span>
            </div>
          )}
          {item.stats.critRate > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">{t('stat_crit', state.lang)}</span>
              <span className="font-mono font-black text-purple-400">+{item.stats.critRate}%</span>
            </div>
          )}
          {item.stats.comboRate > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">{t('stat_cmb', state.lang)}</span>
              <span className="font-mono font-black text-yellow-400">+{item.stats.comboRate}%</span>
            </div>
          )}
          {item.stats.dodgeRate > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">{t('stat_dge', state.lang)}</span>
              <span className="font-mono font-black text-cyan-400">+{item.stats.dodgeRate}%</span>
            </div>
          )}
          {item.stats.lifesteal > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">{t('stat_vamp', state.lang)}</span>
              <span className="font-mono font-black text-pink-400">+{item.stats.lifesteal}%</span>
            </div>
          )}
        </div>

        {/* Action Buttons: SELL vs EQUIP */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <button
            onClick={() => gameManager.sellItem(item)}
            className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-zinc-300 font-black text-xs border border-zinc-700 transition-all shadow-md"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('sell', state.lang)} (+{item.sellPrice})</span>
          </button>

          <button
            onClick={() => gameManager.equipItem(item)}
            className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl game-btn-emerald text-black font-black text-xs shadow-xl active:scale-95 transition-all shine-effect"
          >
            <Check className="w-4 h-4 text-black" />
            <span>{t('equipKeep', state.lang)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
