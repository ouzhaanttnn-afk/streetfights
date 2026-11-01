import React, { Suspense, lazy, useState } from 'react';
import { EquipmentItem, EquipmentSlot } from '../../types/game';
import { GameStateData, gameManager } from '../../core/gameState';
import { ACTIVE_SLOTS, RARITY_CONFIG } from '../../core/lootGenerator';
import { ui } from '../../i18n/ui';
import { t } from '../../i18n/translations';
import { 
  Crown, 
  Flame, 
  Shirt, 
  Smile, 
  Scissors, 
  Footprints, 
  Shield, 
  Crosshair, 
  Heart,
  Coins, 
  Trash2, 
  Sparkles, 
  Check,
  Hammer 
} from 'lucide-react';

import { ItemIcon } from '../ItemIcon';

const ThreeItemViewer = lazy(() => import('../ThreeItemViewer').then((module) => ({ default: module.ThreeItemViewer })));

interface GearTabProps {
  state: GameStateData;
}

export const GearTab: React.FC<GearTabProps> = ({ state }) => {
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [isEquippedSelected, setIsEquippedSelected] = useState<boolean>(false);
  const [forgeSuccessMsg, setForgeSuccessMsg] = useState<string | null>(null);

  const slotsOrder: EquipmentSlot[] = ACTIVE_SLOTS;
  const slotName = (slot: EquipmentSlot) => ui(state.lang, 'slot_' + slot);
  const equippedPower = (slot: EquipmentSlot) => state.playerFighter.equipped[slot]?.powerScore || 0;

  const getSlotIcon = (slot: EquipmentSlot) => {
    switch (slot) {
      case 'head': return Crown;
      case 'gloves': return Flame;
      case 'mouth': return Smile;
      case 'robe': return Shirt;
      case 'shorts': return Scissors;
      case 'boots': return Footprints;
      case 'belt': return Shield;
      case 'weapon': return Crosshair;
      case 'partner': return Heart;
    }
  };

  const handleSlotClick = (slot: EquipmentSlot) => {
    const item = state.playerFighter.equipped[slot];
    if (item) {
      setSelectedItem(item);
      setIsEquippedSelected(true);
    }
  };

  const handleInventoryClick = (item: EquipmentItem) => {
    setSelectedItem(item);
    setIsEquippedSelected(false);
  };

  const handleSellAllCommon = () => {
    state.inventory.forEach((item) => {
      if (item.rarity === 'common' || item.rarity === 'uncommon') {
        gameManager.sellItem(item);
      }
    });
  };

  const handleAutoForge = () => {
    // Look for any 3 items with matching rarity in inventory
    const rarityGroups: Record<string, EquipmentItem[]> = {};
    state.inventory.forEach((item) => {
      if (item.rarity !== 'mythic') {
        if (!rarityGroups[item.rarity]) rarityGroups[item.rarity] = [];
        rarityGroups[item.rarity].push(item);
      }
    });

    for (const r in rarityGroups) {
      if (rarityGroups[r].length >= 3) {
        const itemIds: [string, string, string] = [
          rarityGroups[r][0].id,
          rarityGroups[r][1].id,
          rarityGroups[r][2].id,
        ];
        const success = gameManager.fuseEquipment(itemIds);
        if (success) {
          setForgeSuccessMsg(`✨ ${ui(state.lang, 'forge_ok')}`);
          setTimeout(() => setForgeSuccessMsg(null), 3000);
          return;
        }
      }
    }

    setForgeSuccessMsg(`⚠️ ${ui(state.lang, 'forge_need')}`);
    setTimeout(() => setForgeSuccessMsg(null), 3000);
  };

  return (
    <div className="w-full flex flex-col p-3 bg-[#06070a] space-y-3.5 pb-16">
      
      {/* 1. Character Equipment Slots (3x2 Grid) */}
      <div className="game-card rounded-3xl p-4 shadow-2xl border border-white/10">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-black text-zinc-100 tracking-wider flex items-center gap-1.5 uppercase">
            <Sparkles className="w-4 h-4 text-amber-400" />
            {t('equippedGear', state.lang)}
          </span>
          <span className="text-[10px] text-zinc-400 font-bold bg-black/40 px-2 py-0.5 rounded-lg border border-white/5">
            {t('tapToInspect', state.lang)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {slotsOrder.map((slot) => {
            const item = state.playerFighter.equipped[slot];
            const Icon = getSlotIcon(slot);
            const rarity = item ? RARITY_CONFIG[item.rarity] : null;

            return (
              <button
                key={slot}
                onClick={() => handleSlotClick(slot)}
                className={`relative aspect-square rounded-2xl p-2.5 flex flex-col items-center justify-between border-2 transition-all active:scale-95 shadow-md ${
                  item && rarity
                    ? `${rarity.borderColor} ${rarity.bgColor} shadow-lg shadow-black/50`
                    : 'border-zinc-800/80 bg-neutral-900/50 hover:border-zinc-700'
                }`}
              >
                <div className="w-full flex justify-between items-center text-[9px] font-bold text-zinc-400">
                  <span className="truncate uppercase tracking-wider">{slotName(slot)}</span>
                  {item && <span className="font-mono text-amber-300 font-black bg-black/60 px-1.5 py-0.2 rounded border border-white/10">Lv.{item.level}</span>}
                </div>

                <div className="my-auto drop-shadow">
                  {item ? (
                    <ItemIcon slot={item.slot} rarity={item.rarity} size={64} fallback={<Icon className={`w-8 h-8 ${rarity ? rarity.color : ''}`} />} />
                  ) : (
                    <Icon className="w-8 h-8 text-zinc-700" />
                  )}
                </div>

                <div className="w-full text-center">
                  {item ? (
                    <span className="text-[10px] font-black font-mono text-amber-300 truncate block bg-black/60 py-0.5 rounded-lg border border-white/10 shadow-inner">
                      ⚡ {item.powerScore}
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">
                      {t('emptySlot', state.lang)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Inventory Bag */}
      <div className="game-card rounded-3xl p-4 shadow-2xl border border-white/10">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-zinc-100 tracking-wider uppercase">
              {t('inventory', state.lang)}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono font-bold bg-black/40 px-2 py-0.5 rounded-lg border border-white/5">
              {state.inventory.length} / {state.maxInventorySlots}
            </span>
          </div>

          {state.inventory.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleAutoForge}
                className="text-[10px] font-black text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 px-2.5 py-1 rounded-xl border border-cyan-500/40 flex items-center gap-1 active:scale-95 shadow-md"
              >
                <Hammer className="w-3 h-3 text-cyan-400" />
                <span>{ui(state.lang, 'forge_btn')}</span>
              </button>

              <button
                onClick={handleSellAllCommon}
                className="text-[10px] font-black text-amber-300 bg-amber-950/80 hover:bg-amber-900 px-2.5 py-1 rounded-xl border border-amber-600/40 flex items-center gap-1 active:scale-95 shadow-md"
              >
                <Trash2 className="w-3 h-3 text-amber-400" />
                <span>{t('sellLowTier', state.lang)}</span>
              </button>
            </div>
          )}
        </div>

        {forgeSuccessMsg && (
          <div className="mb-3 py-1.5 px-3 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-[10px] font-black text-cyan-300 text-center animate-bounce">
            {forgeSuccessMsg}
          </div>
        )}

        {state.inventory.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 italic bg-black/30 rounded-2xl border border-white/5 p-4">
            {t('emptyInventory', state.lang)}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {state.inventory.map((item) => {
              const rarity = RARITY_CONFIG[item.rarity];
              const Icon = getSlotIcon(item.slot);
              const isBetter = item.powerScore > equippedPower(item.slot);

              return (
                <button
                  key={item.id}
                  onClick={() => handleInventoryClick(item)}
                  className={`relative aspect-square rounded-2xl p-2 flex flex-col items-center justify-between border-2 transition-all active:scale-95 shadow-md ${rarity.borderColor} ${rarity.bgColor}`}
                >
                  {isBetter && (
                    <span data-better className="absolute -top-1.5 -right-1.5 px-1 py-0.5 rounded-md bg-emerald-400 text-black text-[7px] font-black shadow">
                      ▲ {ui(state.lang, 'better_badge')}
                    </span>
                  )}
                  <div className="w-full flex justify-between items-center text-[8px] font-bold text-zinc-400">
                    <span className="truncate uppercase">{slotName(item.slot)}</span>
                    <span className="text-amber-400 font-black font-mono">L{item.level}</span>
                  </div>

                  <ItemIcon slot={item.slot} rarity={item.rarity} size={46} fallback={<Icon className={`w-5 h-5 ${rarity.color} drop-shadow`} />} />

                  <span className="text-[9px] font-black font-mono text-zinc-200 bg-black/50 px-1 rounded">
                    ⚡{item.powerScore}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Selected Item Details Modal with 3D WebGL Turntable */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
          <div className="w-full max-w-sm game-card border-2 border-zinc-600/80 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center text-white">
            
            <div className="w-full flex justify-between items-start mb-2 text-left">
              <div>
                <h3 className="text-base font-black text-white">{selectedItem.name}</h3>
                <div className={`text-xs font-black uppercase tracking-wider ${RARITY_CONFIG[selectedItem.rarity].color}`}>
                  {RARITY_CONFIG[selectedItem.rarity].name} • Lv.{selectedItem.level} {slotName(selectedItem.slot)}
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-zinc-400 hover:text-white text-xs px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 active:scale-95"
              >
                ✕
              </button>
            </div>

            {/* 3D WebGL Interactive Viewer */}
            <div className="my-1">
              <Suspense fallback={<div className="w-[130px] h-[130px]" />}>
                <ThreeItemViewer slot={selectedItem.slot} rarity={selectedItem.rarity} size={130} />
              </Suspense>
            </div>

            <div className="w-full bg-black/60 px-3 py-2 rounded-2xl border border-white/10 mb-3 flex items-center justify-between shadow-inner">
              <span className="text-xs text-zinc-400 font-bold uppercase">{t('powerScoreLabel', state.lang)}</span>
              <span className="text-sm font-black font-mono text-amber-400">
                ⚡ {selectedItem.powerScore}
                {!isEquippedSelected && (() => {
                  const delta = selectedItem.powerScore - equippedPower(selectedItem.slot);
                  return (
                    <span className={`ml-2 text-[11px] ${delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`} title={ui(state.lang, 'vs_equipped')}>
                      {delta > 0 ? '▲ +' : '▼ '}{delta}
                    </span>
                  );
                })()}
              </span>
            </div>

            <div className="w-full bg-black/40 rounded-2xl p-3 border border-white/5 text-xs space-y-1.5 mb-4 text-left">
              {selectedItem.stats.hp > 0 && (
                <div className="flex justify-between text-zinc-300">
                  <span className="text-zinc-400">{t('stat_hp', state.lang)}</span>
                  <span className="font-bold text-emerald-400 font-mono">+{selectedItem.stats.hp}</span>
                </div>
              )}
              {selectedItem.stats.atk > 0 && (
                <div className="flex justify-between text-zinc-300">
                  <span className="text-zinc-400">{t('stat_atk', state.lang)}</span>
                  <span className="font-bold text-rose-400 font-mono">+{selectedItem.stats.atk}</span>
                </div>
              )}
              {selectedItem.stats.def > 0 && (
                <div className="flex justify-between text-zinc-300">
                  <span className="text-zinc-400">{t('stat_def', state.lang)}</span>
                  <span className="font-bold text-sky-400 font-mono">+{selectedItem.stats.def}</span>
                </div>
              )}
              {selectedItem.stats.spd > 0 && (
                <div className="flex justify-between text-zinc-300">
                  <span className="text-zinc-400">{t('stat_spd', state.lang)}</span>
                  <span className="font-bold text-amber-400 font-mono">+{selectedItem.stats.spd}</span>
                </div>
              )}
              {selectedItem.stats.critRate > 0 && (
                <div className="flex justify-between text-zinc-300">
                  <span className="text-zinc-400">{t('stat_crit', state.lang)}</span>
                  <span className="font-bold text-purple-400 font-mono">+{selectedItem.stats.critRate}%</span>
                </div>
              )}
              {selectedItem.stats.comboRate > 0 && (
                <div className="flex justify-between text-zinc-300">
                  <span className="text-zinc-400">{t('stat_cmb', state.lang)}</span>
                  <span className="font-bold text-yellow-400 font-mono">+{selectedItem.stats.comboRate}%</span>
                </div>
              )}
              {selectedItem.stats.dodgeRate > 0 && (
                <div className="flex justify-between text-zinc-300">
                  <span className="text-zinc-400">{t('stat_dge', state.lang)}</span>
                  <span className="font-bold text-cyan-400 font-mono">+{selectedItem.stats.dodgeRate}%</span>
                </div>
              )}
              {selectedItem.stats.lifesteal > 0 && (
                <div className="flex justify-between text-zinc-300">
                  <span className="text-zinc-400">{t('stat_vamp', state.lang)}</span>
                  <span className="font-bold text-pink-400 font-mono">+{selectedItem.stats.lifesteal}%</span>
                </div>
              )}
            </div>

            <div className="w-full grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  gameManager.sellItem(selectedItem);
                  setSelectedItem(null);
                }}
                className="py-3 bg-neutral-800 hover:bg-neutral-700 text-zinc-300 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 border border-zinc-700 active:scale-95 shadow-md"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('sell', state.lang)} (+{selectedItem.sellPrice})</span>
              </button>

              {isEquippedSelected ? (
                <button
                  onClick={() => {
                    gameManager.unequipItem(selectedItem.slot);
                    setSelectedItem(null);
                  }}
                  className="py-3 bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs rounded-2xl border border-rose-800 active:scale-95 shadow-md"
                >
                  {t('unequip', state.lang)}
                </button>
              ) : (
                <button
                  onClick={() => {
                    gameManager.equipItem(selectedItem);
                    setSelectedItem(null);
                  }}
                  className="py-3 game-btn-emerald text-black font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 shadow-lg shine-effect"
                >
                  <Check className="w-4 h-4" />
                  <span>{t('equipNow', state.lang)}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
