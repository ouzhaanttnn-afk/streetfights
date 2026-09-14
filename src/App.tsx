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
import { CheatsTab } from './components/tabs/CheatsTab';
import { LootCardModal } from './components/LootCardModal';
import { SkillSelectModal } from './components/SkillSelectModal';
import { RewardedAdModal } from './components/RewardedAdModal';
import { SettingsModal } from './components/SettingsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { LoadingScreen } from './components/LoadingScreen';
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
      case 'cheats':
        return <CheatsTab state={state} />;
      default:
        return <GearTab state={state} />;
    }
  };

  return (
    <div className="w-full min-h-screen min-h-[100dvh] bg-[#050508] flex justify-center text-white font-sans selection:bg-amber-500 selection:text-black">
      
      {/* 0. Initial AAA Loading Splash Screen */}
      {isLoading && (
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      )}

      {/* Mobile-Friendly Portrait Phone Container with AAA Glow Frame */}
      <div className="relative w-full max-w-[430px] min-h-screen min-h-[100dvh] bg-neutral-950 flex flex-col shadow-2xl border-x border-zinc-800/80 overflow-x-hidden">
        
        {/* 1. Top Header HUD (Currencies, XP, Leaderboard, Settings) */}
        <HeaderNav 
          state={state} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        />

        {/* 2. Top Half: 2D Combat Canvas Viewport */}
        <BattleCanvas state={state} onVictory={handleStageVictory} />

        {/* 3. Mid Section: Real-time Stats Strip */}
        <StatBar stats={state.playerFighter.stats} lang={state.lang} />

        {/* 4. Bottom Half: Scrollable Interactive Content Tabs */}
        {renderActiveTab()}

        {/* 5. Bottom Navigation Bar */}
        <BottomNav activeTab={state.activeTab} lang={state.lang} />

        {/* 6. Loot Drop Decision Modal (SELL vs EQUIP) */}
        {state.pendingLootDrop && (
          <LootCardModal item={state.pendingLootDrop} state={state} />
        )}

        {/* 7. Roguelite Skill Decision Modal (ROLL AGAIN vs CLAIM) */}
        {state.pendingSkillOffer && (
          <SkillSelectModal skill={state.pendingSkillOffer} state={state} />
        )}

        {/* 8. Rewarded Video Ad Modal */}
        {state.activeAdModal && (
          <RewardedAdModal state={state} />
        )}

        {/* 9. Professional Game Settings Modal */}
        {isSettingsOpen && (
          <SettingsModal state={state} onClose={() => setIsSettingsOpen(false)} />
        )}

        {/* 10. Global Cloud Leaderboard / Top Tier List */}
        {isLeaderboardOpen && (
          <LeaderboardModal state={state} onClose={() => setIsLeaderboardOpen(false)} />
        )}
      </div>
    </div>
  );
}

export default App;
