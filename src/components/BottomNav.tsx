import React from 'react';
import { TabType } from '../types/game';
import { gameManager } from '../core/gameState';
import { t } from '../i18n/translations';
import { Language } from '../i18n/translations';
import { 
  Shirt, 
  Zap, 
  Dumbbell, 
  ShoppingBag,
  Swords, 
  Terminal
} from 'lucide-react';

interface BottomNavProps {
  activeTab: TabType;
  lang: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, lang }) => {
  const tabs: { id: TabType; labelKey: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'gear', labelKey: 'tab_gear', icon: Shirt },
    { id: 'skills', labelKey: 'tab_skills', icon: Zap },
    { id: 'gym', labelKey: 'tab_gym', icon: Dumbbell },
    { id: 'shop', labelKey: 'tab_shop', icon: ShoppingBag },
    { id: 'arena', labelKey: 'tab_arena', icon: Swords },
    { id: 'cheats', labelKey: 'tab_cheats', icon: Terminal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-neutral-900/95 backdrop-blur border-t border-zinc-800 px-1 py-1.5 flex items-center justify-around z-40 select-none shadow-2xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => gameManager.setActiveTab(tab.id)}
            className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all active:scale-95 ${
              isActive
                ? 'text-amber-400 font-extrabold'
                : 'text-zinc-500 hover:text-zinc-300 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${
              isActive ? 'bg-amber-400/10' : ''
            }`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[9px] tracking-tight uppercase truncate max-w-[55px]">
              {t(tab.labelKey, lang)}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
