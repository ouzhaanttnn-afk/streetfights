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
    <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto dock-nav px-1.5 py-2 flex items-center justify-around z-40 select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => gameManager.setActiveTab(tab.id)}
            className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all active:scale-90 ${
              isActive
                ? 'text-amber-300 font-black'
                : 'text-zinc-500 hover:text-zinc-300 font-medium'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-200 ${
              isActive 
                ? 'bg-gradient-to-b from-amber-400/25 to-amber-500/10 text-amber-300 border border-amber-400/50 shadow-md shadow-amber-500/20 scale-105' 
                : 'bg-transparent border border-transparent'
            }`}>
              <Icon className="w-4 h-4 drop-shadow" />
            </div>
            <span className={`text-[9px] tracking-tight uppercase truncate max-w-[55px] font-mono mt-0.5 ${
              isActive ? 'text-amber-300 font-black' : 'text-zinc-400'
            }`}>
              {t(tab.labelKey, lang)}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
