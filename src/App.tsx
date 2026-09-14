import React, { useEffect, useState } from 'react';
import { GameStateData, gameManager } from './core/gameState';
import { HeaderNav } from './components/HeaderNav';
import { BattleCanvas } from './components/BattleCanvas';
import { StatBar } from './components/StatBar';
import { BottomNav } from './components/BottomNav';
import { GearTab } from './components/tabs/GearTab';
import { SkillsTab } from './components/tabs/SkillsTab';
import { GymTab } from './components/tabs/GymTab';
import { ShopTab } from './components/tabs/ShopTab';
import { ArenaTab } from './components/tabs/ArenaTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { LootCardModal } from './components/LootCardModal';
import { SkillSelectModal } from './components/SkillSelectModal';
import { RewardedAdModal } from './components/RewardedAdModal';
import { SettingsModal } from './components/SettingsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { LoadingScreen } from './components/LoadingScreen';
import { DailyLoginModal } from './components/DailyLoginModal';
import { LuckyWheelModal } from './components/LuckyWheelModal';
import { OfflineRewardModal } from './components/OfflineRewardModal';
import { SkillReplaceModal } from './components/SkillReplaceModal';
import { Stage } from './types/game';

export function App() {
  const [state, setState] = useState<GameStateData>(gameManager.getState());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = gameManager.subscribe((newState) => {
      setState({ ...newState });
    });
    return () => unsubscribe();
  }, []);

  const handleStageVictory = (stage: Stage) => {
    gameManager.onStageVictory(stage);
  };

  const renderActiveTab = () => {
    switch (state.activeTab) {
      case 'gear':
        return <GearTab state={state} />;
      case 'skills':
        return <SkillsTab state={state} />;
      case 'gym':
        return <GymTab state={state} />;
      case 'shop':
        return <ShopTab state={state} />;
      case 'arena':
        return <ArenaTab state={state} />;
      case 'profile':
        return <ProfileTab state={state} />;
      default:
        return <GearTab state={state} />;
    }
  };

  return (
    <div className="w-full h-screen h-[100dvh] max-h-[100dvh] bg-[#050508] flex justify-center text-white font-sans selection:bg-amber-500 selection:text-black overflow-hidden select-none">
      
      {/* 0. Initial AAA Loading Splash Screen */}
      {isLoading && (
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      )}

      {/* Mobile-Friendly Portrait Phone Container with AAA Glow Frame */}
      <div className="relative w-full max-w-[430px] h-full h-[100dvh] max-h-[100dvh] bg-neutral-950 flex flex-col shadow-2xl border-x border-zinc-800/80 overflow-hidden">
        
        {/* Pinned Top Combat Deck (Header HUD + Battle Canvas + Stats) */}
        <div className="shrink-0 z-20 flex flex-col bg-neutral-950">
          {/* 1. Top Header HUD (Currencies, XP, Leaderboard, Settings) */}
          <HeaderNav 
            state={state} 
            onOpenSettings={() => setIsSettingsOpen(true)} 
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          />

          {/* 2. Top Half: 2.5D Combat Canvas Viewport */}
          <BattleCanvas state={state} onVictory={handleStageVictory} />

          {/* 3. Mid Section: Real-time Stats Strip */}
          <StatBar stats={state.playerFighter.stats} lang={state.lang} />
        </div>

        {/* Scrollable Center: Only Interactive Tab Views Scroll */}
        <main className="flex-1 overflow-y-auto overscroll-contain pb-24 scroll-smooth">
          {renderActiveTab()}
        </main>

        {/* Pinned Bottom Navigation Bar */}
        <BottomNav activeTab={state.activeTab} lang={state.lang} />

        {/* 6. Loot Drop Decision Modal (SELL vs EQUIP) */}
        {state.pendingLootDrop && (
          <LootCardModal item={state.pendingLootDrop} state={state} />
        )}

        {/* 7. Roguelite Skill Decision Modal (ROLL AGAIN vs CLAIM) */}
        {state.pendingSkillOffer && (
          <SkillSelectModal skill={state.pendingSkillOffer} state={state} />
        )}

        {/* 8. Safe Skill Deck Replacement Modal (When Deck is 6/6) */}
        {state.pendingSkillReplacement && (
          <SkillReplaceModal 
            state={state} 
            newSkill={state.pendingSkillReplacement} 
            onClose={() => gameManager.dismissSkillReplacement()} 
          />
        )}

        {/* 9. 7-Day Daily Login Reward Modal */}
        {state.isDailyLoginOpen && (
          <DailyLoginModal state={state} onClose={() => gameManager.closeDailyLogin()} />
        )}

        {/* 10. Lucky Fortune Wheel Modal */}
        {state.isLuckyWheelOpen && (
          <LuckyWheelModal state={state} onClose={() => gameManager.closeLuckyWheel()} />
        )}

        {/* 11. AFK Offline Training Gold Modal */}
        {state.isOfflineRewardOpen && state.offlineGoldAccumulated > 0 && (
          <OfflineRewardModal
            state={state}
            amount={state.offlineGoldAccumulated}
            minutes={state.offlineMinutesAccumulated || 30}
            onClose={() => gameManager.closeOfflineReward()}
          />
        )}

        {/* 12. Rewarded Video Ad Modal */}
        {state.activeAdModal && (
          <RewardedAdModal state={state} />
        )}

        {/* 13. Professional Game Settings Modal */}
        {isSettingsOpen && (
          <SettingsModal state={state} onClose={() => setIsSettingsOpen(false)} />
        )}

        {/* 14. Global Cloud Leaderboard / Top Tier List */}
        {isLeaderboardOpen && (
          <LeaderboardModal state={state} onClose={() => setIsLeaderboardOpen(false)} />
        )}
      </div>
    </div>
  );
}

export default App;
