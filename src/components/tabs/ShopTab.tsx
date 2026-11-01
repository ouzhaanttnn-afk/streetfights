import React, { useState } from 'react';
import { GameStateData, gameManager } from '../../core/gameState';
import { COSMETICS_LIST, CosmeticCategory, CosmeticItem } from '../../core/cosmeticsData';
import { t } from '../../i18n/translations';
import { ui } from '../../i18n/ui';
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

const AURA_COLOR: Record<string, string> = { lightning: '#38bdf8', flame: '#f97316', neon: '#06b6d4', divine: '#fbbf24' };

// Small visual swatch of the cosmetic: outfit colour, hair colour, aura glow or ball colour.
const CosmeticPreview: React.FC<{ item: CosmeticItem }> = ({ item }) => {
  const v = item.visualData;
  if (item.category === 'ball') {
    return (
      <div className="w-12 h-12 shrink-0 rounded-2xl bg-neutral-900 border border-white/15 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-black/40" style={{ background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${v.ballColor || '#ffffff'} 45%, #111 100%)` }} />
      </div>
    );
  }
  if (item.category === 'aura') {
    const c = v.auraEffect ? AURA_COLOR[v.auraEffect] : '#52525b';
    return (
      <div className="w-12 h-12 shrink-0 rounded-2xl bg-neutral-950 border border-white/15 flex items-center justify-center" style={{ boxShadow: v.auraEffect ? `inset 0 0 16px ${c}, 0 0 12px ${c}66` : undefined }}>
        <Sparkles className="w-6 h-6" style={{ color: c }} />
      </div>
    );
  }
  const Icon = item.category === 'hair' ? Scissors : Shirt;
  return (
    <div className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center border border-white/20" style={{ backgroundColor: v.color || '#1e1b4b' }}>
      <Icon className="w-6 h-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
    </div>
  );
};

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
    <div className="w-full flex flex-col p-3 bg-[#06070a] space-y-3.5 pb-16">
      
      {/* 1. Rewarded Video Ads Center Banner */}
      <div className="game-card rounded-3xl p-4 shadow-2xl border border-amber-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-amber-300 tracking-wider flex items-center gap-2 uppercase">
            <Tv className="w-4 h-4 text-amber-400 drop-shadow" />
            {t('adCenter', state.lang)}
          </h3>
        </div>

        {/* Two clear offers only: free gems or a damage boost */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            data-ad="free_gems"
            onClick={() => gameManager.openRewardedAd({
              type: 'free_gems',
              title: t('adFreeGems', state.lang),
              rewardDesc: ui(state.lang, 'ad_gems_desc'),
            })}
            className="p-3.5 rounded-2xl bg-gradient-to-b from-cyan-950/70 via-black to-neutral-950 border border-cyan-500/40 flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 shadow-lg"
          >
            <Gem className="w-8 h-8 text-cyan-400 drop-shadow" />
            <span className="text-[12px] font-black text-zinc-100">{t('adFreeGems', state.lang)}</span>
            <span className="text-[10px] font-bold text-cyan-200">{ui(state.lang, 'ad_gems_desc')}</span>
            <span className="mt-1 w-full min-h-9 flex items-center justify-center gap-1 rounded-xl bg-cyan-500 text-black text-[11px] font-black">
              <Tv className="w-3.5 h-3.5" /> {ui(state.lang, 'ad_watch')}
            </span>
          </button>

          <button
            data-ad="double_damage"
            onClick={() => gameManager.openRewardedAd({
              type: 'double_damage',
              title: ui(state.lang, 'ad_dmg_title'),
              rewardDesc: ui(state.lang, 'ad_dmg_desc'),
            })}
            className="p-3.5 rounded-2xl bg-gradient-to-b from-rose-950/70 via-black to-neutral-950 border border-rose-500/40 flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 shadow-lg"
          >
            <Zap className="w-8 h-8 text-rose-400 drop-shadow" />
            <span className="text-[12px] font-black text-zinc-100">{ui(state.lang, 'ad_dmg_title')}</span>
            <span className="text-[10px] font-bold text-rose-200">{ui(state.lang, 'ad_dmg_desc')}</span>
            <span className={`mt-1 w-full min-h-9 flex items-center justify-center gap-1 rounded-xl text-[11px] font-black ${isDoubleDmgActive ? 'bg-rose-950 text-rose-200 border border-rose-500/50' : 'bg-rose-500 text-black'}`}>
              {isDoubleDmgActive ? ui(state.lang, 'ad_active', { n: dmgMinutesLeft }) : (<><Tv className="w-3.5 h-3.5" /> {ui(state.lang, 'ad_watch')}</>)}
            </span>
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
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <CosmeticPreview item={item} />

                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-zinc-100 tracking-tight truncate">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                      {item.description}
                    </p>
                  </div>
                </div>

                {equipped ? (
                  <div className="shrink-0 px-3 py-2 rounded-2xl bg-purple-950 border border-purple-500 text-purple-300 font-black text-[11px] flex items-center gap-1.5 shadow-sm">
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
