import React, { useState } from 'react';
import { GameStateData, gameManager } from '../../core/gameState';
import { COSMETICS_LIST, CosmeticCategory, CosmeticItem } from '../../core/cosmeticsData';
import { t } from '../../i18n/translations';
import { 
  ShoppingBag, 
  Sparkles, 
  Tv, 
  Gem, 
  Coins, 
  Check, 
  Zap, 
  Shirt, 
  Scissors, 
  Crosshair
} from 'lucide-react';

interface ShopTabProps {
  state: GameStateData;
}

export const ShopTab: React.FC<ShopTabProps> = ({ state }) => {
  const [activeCategory, setActiveCategory] = useState<CosmeticCategory>('outfit');

  const categories: { id: CosmeticCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'outfit', label: t('categoryOutfits', state.lang), icon: Shirt },
    { id: 'hair', label: t('categoryHairs', state.lang), icon: Scissors },
    { id: 'aura', label: t('categoryAuras', state.lang), icon: Sparkles },
    { id: 'ball', label: t('categoryWeapons', state.lang), icon: Crosshair },
  ];

  const filteredCosmetics = COSMETICS_LIST.filter((c) => c.category === activeCategory);

  const isEquipped = (item: CosmeticItem): boolean => {
    if (item.category === 'outfit') return state.equippedOutfit === item.id;
    if (item.category === 'hair') return state.equippedHair === item.id;
    if (item.category === 'aura') return state.equippedAura === item.id;
    if (item.category === 'ball') return state.equippedBall === item.id;
    return false;
  };

  const isDoubleDmgActive = Date.now() < state.doubleDamageUntil;
  const dmgMinutesLeft = Math.ceil((state.doubleDamageUntil - Date.now()) / 60000);

  return (
    <div className="w-full flex flex-col p-3 bg-[#06070a] space-y-3.5 pb-28">
      
      {/* 1. Rewarded Video Ads Center Banner */}
      <div className="game-card rounded-3xl p-4 shadow-2xl border border-amber-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-amber-300 tracking-wider flex items-center gap-2 uppercase">
            <Tv className="w-4 h-4 text-amber-400 drop-shadow" />
            {t('adCenter', state.lang)}
          </h3>
          {isDoubleDmgActive && (
            <span className="text-[10px] font-black text-rose-300 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-500/40 flex items-center gap-1 animate-pulse shadow-sm">
              <Zap className="w-3 h-3 text-rose-400" /> 2x DMG ({dmgMinutesLeft}m)
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Ad 1: Free Gems */}
          <button
            onClick={() => gameManager.openRewardedAd({
              type: 'free_gems',
              title: t('adFreeGems', state.lang),
              rewardDesc: '+50 Gems & +1,000 Coins',
            })}
            className="p-3 rounded-2xl bg-gradient-to-b from-cyan-950/60 via-black to-neutral-950 border border-cyan-500/40 flex flex-col items-center justify-between text-center transition-all active:scale-95 shadow-lg hover:border-cyan-400 group"
          >
            <Gem className="w-6 h-6 text-cyan-400 mb-1.5 drop-shadow group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black text-zinc-200 truncate w-full">{t('adFreeGems', state.lang)}</span>
            <span className="text-[9px] font-mono font-bold text-cyan-300 mt-1.5 bg-cyan-950/90 px-2.5 py-0.5 rounded-lg border border-cyan-500/40">+50 💎</span>
          </button>

          {/* Ad 2: 2x Damage Buff */}
          <button
            onClick={() => gameManager.openRewardedAd({
              type: 'double_damage',
              title: t('adDoubleDmg', state.lang),
              rewardDesc: '2x Striking Attack Power for 10 min',
            })}
            className="p-3 rounded-2xl bg-gradient-to-b from-rose-950/60 via-black to-neutral-950 border border-rose-500/40 flex flex-col items-center justify-between text-center transition-all active:scale-95 shadow-lg hover:border-rose-400 group"
          >
            <Zap className="w-6 h-6 text-rose-400 mb-1.5 drop-shadow group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black text-zinc-200 truncate w-full">{t('adDoubleDmg', state.lang)}</span>
            <span className="text-[9px] font-mono font-bold text-rose-300 mt-1.5 bg-rose-950/90 px-2.5 py-0.5 rounded-lg border border-rose-500/40">⚡ 2x ATK</span>
          </button>

          {/* Ad 3: Mystery Chest */}
          <button
            onClick={() => gameManager.openRewardedAd({
              type: 'mystery_chest',
              title: t('adMysteryChest', state.lang),
              rewardDesc: 'Guaranteed Rare / Epic / Legendary Item Drop',
            })}
            className="p-3 rounded-2xl bg-gradient-to-b from-amber-950/60 via-black to-neutral-950 border border-amber-500/40 flex flex-col items-center justify-between text-center transition-all active:scale-95 shadow-lg hover:border-amber-400 group"
          >
            <Sparkles className="w-6 h-6 text-amber-400 mb-1.5 drop-shadow group-hover:scale-110 transition-transform animate-spin" />
            <span className="text-[9px] font-black text-zinc-200 truncate w-full">{t('adMysteryChest', state.lang)}</span>
            <span className="text-[9px] font-mono font-bold text-amber-300 mt-1.5 bg-amber-950/90 px-2.5 py-0.5 rounded-lg border border-amber-500/40">🎁 DROP</span>
          </button>
        </div>
      </div>

      {/* 2. Cosmetics Locker & Category Tabs */}
      <div className="game-card rounded-3xl p-4 shadow-2xl border border-white/10 space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-zinc-100 tracking-wider flex items-center gap-2 uppercase">
            <ShoppingBag className="w-4 h-4 text-purple-400 drop-shadow" />
            {t('shopTitle', state.lang)}
          </h3>
          <div className="flex items-center gap-2 text-xs font-mono font-black">
            <span className="text-amber-300 bg-black/60 px-2.5 py-0.5 rounded-lg border border-amber-500/30">🪙 {state.coins.toLocaleString()}</span>
            <span className="text-cyan-300 bg-black/60 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">💎 {state.gems.toLocaleString()}</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-black shrink-0 flex items-center gap-1.5 border transition-all active:scale-95 ${
                  isSelected
                    ? 'game-btn-cyan text-white border-cyan-300 shadow-lg'
                    : 'bg-neutral-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Cosmetics List */}
        <div className="space-y-2.5 pt-1">
          {filteredCosmetics.map((item) => {
            const owned = state.unlockedCosmetics.includes(item.id);
            const equipped = isEquipped(item);
            const canAffordGems = item.priceGems > 0 && state.gems >= item.priceGems;
            const canAffordCoins = item.priceCoins > 0 && state.coins >= item.priceCoins;
            const canBuy = canAffordGems || canAffordCoins || (item.priceCoins === 0 && item.priceGems === 0);

            return (
              <div
                key={item.id}
                className={`rounded-3xl border p-3.5 flex items-center justify-between transition-all shadow-md ${
                  equipped
                    ? 'bg-gradient-to-r from-purple-950/70 via-neutral-900 to-neutral-950 border-purple-500 shadow-lg shadow-purple-500/20'
                    : owned
                      ? 'bg-neutral-900/90 border-zinc-800'
                      : 'bg-neutral-950/70 border-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs border border-white/20 shadow-inner"
                    style={{ backgroundColor: item.visualData.color || '#1e1b4b' }}
                  >
                    {item.visualData.auraEffect ? (
                      <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
                    ) : (
                      <span className="text-white text-xl drop-shadow">🥊</span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-zinc-100 tracking-tight">
                        {item.name}
                      </h4>
                      {equipped && (
                        <span className="px-2 py-0.5 bg-purple-600 text-white font-black text-[9px] rounded-md uppercase shadow-sm">
                          {t('equippedSkin', state.lang)}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5 max-w-[185px] truncate">
                      {item.description}
                    </p>
                  </div>
                </div>

                {equipped ? (
                  <div className="px-3.5 py-2 rounded-2xl bg-purple-950 border border-purple-500 text-purple-300 font-black text-xs flex items-center gap-1.5 shadow-sm">
                    <Check className="w-4 h-4" />
                    <span>{t('equippedSkin', state.lang)}</span>
                  </div>
                ) : owned ? (
                  <button
                    onClick={() => gameManager.equipCosmetic(item)}
                    className="px-3.5 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs border border-zinc-700 active:scale-95 transition-all shadow-md"
                  >
                    {t('equipSkin', state.lang)}
                  </button>
                ) : (
                  <button
                    onClick={() => gameManager.buyCosmetic(item)}
                    disabled={!canBuy}
                    className={`px-3.5 py-2 rounded-2xl font-black text-xs flex items-center gap-1 border transition-all active:scale-95 ${
                      canBuy
                        ? 'game-btn-gold text-black border-amber-300 shadow-md'
                        : 'bg-zinc-800/60 text-zinc-600 border-zinc-800 cursor-not-allowed'
                    }`}
                  >
                    {item.priceGems > 0 ? (
                      <>
                        <Gem className="w-3.5 h-3.5 text-black" />
                        <span>{item.priceGems}</span>
                      </>
                    ) : (
                      <>
                        <Coins className="w-3.5 h-3.5 text-black" />
                        <span>{item.priceCoins}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
