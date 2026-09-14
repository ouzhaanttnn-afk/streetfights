import React, { useState } from 'react';
import { EquipmentItem, EquipmentSlot } from '../../types/game';
import { GameStateData, gameManager } from '../../core/gameState';
import { RARITY_CONFIG, SLOT_INFO } from '../../core/lootGenerator';
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
  Check 
} from 'lucide-react';

interface GearTabProps {
  state: GameStateData;
}

export const GearTab: React.FC<GearTabProps> = ({ state }) => {
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [isEquippedSelected, setIsEquippedSelected] = useState<boolean>(false);

  const slotsOrder: EquipmentSlot[] = [
    'head', 'gloves', 'mouth',
    'robe', 'shorts', 'boots',
    'belt', 'weapon', 'partner'
  ];

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

  return (
    <div className="flex-1 flex flex-col p-3 bg-neutral-950 overflow-y-auto space-y-3.5 select-none pb-20">
      
      {/* 1. Character Equipment Slots (3x3 Grid) */}
      <div className="game-card rounded-2xl p-3.5 shadow-xl border border-white/10">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-xs font-black text-zinc-200 tracking-wider flex items-center gap-1.5 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {t('equippedGear', state.lang)}
          </span>
          <span className="text-[10px] text-zinc-400 font-semibold">{t('tapToInspect', state.lang)}</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {slotsOrder.map((slot) => {
            const item = state.playerFighter.equipped[slot];
            const info = SLOT_INFO[slot];
            const Icon = getSlotIcon(slot);
            const rarity = item ? RARITY_CONFIG[item.rarity] : null;

            return (
              <button
                key={slot}
                onClick={() => handleSlotClick(slot)}
                className={`relative aspect-square rounded-2xl p-2 flex flex-col items-center justify-between border-2 transition-all active:scale-95 shadow-md ${
                  item && rarity
                    ? `${rarity.borderColor} ${rarity.bgColor} shadow-lg shadow-black/40`
                    : 'border-zinc-800 bg-neutral-900/60 hover:border-zinc-700'
                }`}
              >
                <div className="w-full flex justify-between items-center text-[9px] font-bold text-zinc-400">
                  <span className="truncate">{info.label}</span>
                  {item && <span className="font-mono text-amber-400 font-extrabold">Lv.{item.level}</span>}
                </div>

                <div className="my-auto">
                  <Icon className={`w-8 h-8 ${item && rarity ? rarity.color : 'text-zinc-700'}`} />
                </div>

                <div className="w-full text-center">
                  {item ? (
                    <span className="text-[10px] font-black font-mono text-zinc-200 truncate block bg-black/40 py-0.5 rounded border border-white/5">
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
      <div className="game-card rounded-2xl p-3.5 shadow-xl border border-white/10">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-zinc-200 tracking-wider uppercase">
              {t('inventory', state.lang)}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              ({state.inventory.length}/{state.maxInventorySlots})
            </span>
          </div>

          {state.inventory.length > 0 && (
            <button
              onClick={handleSellAllCommon}
              className="text-[10px] font-bold text-amber-300 bg-amber-950/80 hover:bg-amber-900 px-2.5 py-1 rounded-xl border border-amber-600/40 flex items-center gap-1 active:scale-95 shadow-sm"
            >
              <Trash2 className="w-3 h-3 text-amber-400" />
              <span>{t('sellLowTier', state.lang)}</span>
            </button>
          )}
        </div>

        {state.inventory.length === 0 ? (
          <div className="py-7 text-center text-xs text-zinc-500 italic">
            {t('emptyInventory', state.lang)}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {state.inventory.map((item) => {
              const rarity = RARITY_CONFIG[item.rarity];
              const Icon = getSlotIcon(item.slot);

              return (
                <button
                  key={item.id}
                  onClick={() => handleInventoryClick(item)}
                  className={`relative aspect-square rounded-2xl p-1.5 flex flex-col items-center justify-between border-2 transition-all active:scale-95 shadow-sm ${rarity.borderColor} ${rarity.bgColor}`}
                >
                  <div className="w-full flex justify-between items-center text-[8px] font-bold text-zinc-400">
                    <span className="truncate">{item.slot}</span>
                    <span className="text-amber-400 font-black">L{item.level}</span>
                  </div>

                  <Icon className={`w-5 h-5 ${rarity.color}`} />

                  <span className="text-[9px] font-black font-mono text-zinc-200">
                    ⚡{item.powerScore}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Selected Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-fadeIn">
          <div className="w-full max-w-sm game-card border-2 border-zinc-600 rounded-3xl p-5 shadow-2xl flex flex-col text-white">
            
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-base font-black text-white">{selectedItem.name}</h3>
                <div className={`text-xs font-bold uppercase ${RARITY_CONFIG[selectedItem.rarity].color}`}>
                  {RARITY_CONFIG[selectedItem.rarity].name} • Lv.{selectedItem.level} {SLOT_INFO[selectedItem.slot].label}
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-zinc-400 hover:text-white text-xs px-2.5 py-1 rounded-xl bg-zinc-800 border border-zinc-700"
              >
                ✕
              </button>
            </div>

            <div className="bg-black/50 px-3 py-2 rounded-xl border border-white/10 mb-3 flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-semibold">{t('powerScoreLabel', state.lang)}</span>
              <span className="text-sm font-black font-mono text-amber-400">⚡ {selectedItem.powerScore}</span>
            </div>

            <div className="bg-black/40 rounded-2xl p-3 border border-white/5 text-xs space-y-1.5 mb-4">
              {selectedItem.stats.hp > 0 && (
                <div className="flex justify-between text-zinc-300">
                  <span>Health:</span>
                  <span className="font-bold text-emerald-400">+{selectedItem.stats.hp}</span>
                </div>
              )}
              {selectedItem.stats.atk > 0 && (
                <div className="flex justify-between text-zinc-300">
                  <span>Attack:</span>
                  <span className="font-bold text-rose-400">+{selectedItem.stats.atk}</span>
                </div>
              )}
              {selectedItem.stats.def > 0 && (
                <div className="flex justify-between text-zinc-300">
                  <span>Defense:</span>
                  <span className="font-bold text-sky-400">+{selectedItem.stats.def}</span>
                </div>
              )}
              {selectedItem.stats.spd > 0 && (
                <div className="flex justify-between text-zinc-300">
                  <span>Speed:</span>
                  <span className="font-bold text-amber-400">+{selectedItem.stats.spd}</span>
                </div>
              )}
              {selectedItem.stats.critRate > 0 && (
                <div className="flex justify-between text-zinc-300">
                  <span>Crit Rate:</span>
                  <span className="font-bold text-purple-400">+{selectedItem.stats.critRate}%</span>
                </div>
              )}
              {selectedItem.stats.comboRate > 0 && (
                <div className="flex justify-between text-zinc-300">
                  <span>Combo Rate:</span>
                  <span className="font-bold text-yellow-400">+{selectedItem.stats.comboRate}%</span>
                </div>
              )}
              {selectedItem.stats.dodgeRate > 0 && (
                <div className="flex justify-between text-zinc-300">
                  <span>Dodge Rate:</span>
                  <span className="font-bold text-cyan-400">+{selectedItem.stats.dodgeRate}%</span>
                </div>
              )}
              {selectedItem.stats.lifesteal > 0 && (
                <div className="flex justify-between text-zinc-300">
                  <span>Lifesteal:</span>
                  <span className="font-bold text-pink-400">+{selectedItem.stats.lifesteal}%</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  gameManager.sellItem(selectedItem);
                  setSelectedItem(null);
                }}
                className="py-2.5 bg-neutral-800 hover:bg-neutral-700 text-zinc-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1 border border-zinc-700 active:scale-95"
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
                  className="py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs rounded-xl border border-rose-800 active:scale-95"
                >
                  {t('unequip', state.lang)}
                </button>
              ) : (
                <button
                  onClick={() => {
                    gameManager.equipItem(selectedItem);
                    setSelectedItem(null);
                  }}
                  className="py-2.5 game-btn-emerald text-black font-black text-xs rounded-xl flex items-center justify-center gap-1 active:scale-95 shadow-lg"
                >
                  <Check className="w-3.5 h-3.5" />
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
