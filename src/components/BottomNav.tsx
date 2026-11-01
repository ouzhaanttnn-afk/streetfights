import React from 'react';
import { TabType } from '../types/game';
import { GameStateData, gameManager } from '../core/gameState';
import { t } from '../i18n/translations';
import { ui } from '../i18n/ui';
import { tabBadges } from '../core/guidance';
import { Dumbbell, ShoppingBag, Swords, User } from 'lucide-react';

interface BottomNavProps {
  state: GameStateData;
}

// Four destinations only: the fighter (gear + skills), the gym, the arena (stages + quests) and the shop
export const BottomNav: React.FC<BottomNavProps> = ({ state }) => {
  const { activeTab, lang } = state;
  const badges = tabBadges(state);
  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'gear', label: ui(lang, 'tab_fighter'), icon: User },
    { id: 'gym', label: t('tab_gym', lang), icon: Dumbbell },
    { id: 'arena', label: t('tab_arena', lang), icon: Swords },
    { id: 'shop', label: t('tab_shop', lang), icon: ShoppingBag },
  ];

  return (
    <nav className="sticky bottom-0 w-full dock-nav px-1.5 pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))] flex items-center justify-around z-40 select-none backdrop-blur-2xl shrink-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => gameManager.setActiveTab(tab.id)}
            className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all active:scale-90 ${
              isActive ? 'text-amber-300 font-black' : 'text-zinc-500 hover:text-zinc-300 font-medium'
            }`}
          >
            <div
              className={`relative p-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-b from-amber-400/25 to-amber-500/10 text-amber-300 border border-amber-400/50 shadow-md shadow-amber-500/20 scale-105'
                  : 'bg-transparent border border-transparent'
              }`}
            >
              <Icon className="w-5 h-5 drop-shadow" />
              {badges[tab.id] && (
                <span data-badge className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0b0c13]" />
              )}
            </div>
            <span className={`text-[10px] tracking-tight uppercase truncate max-w-[80px] font-mono mt-0.5 ${isActive ? 'text-amber-300 font-black' : 'text-zinc-400'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
