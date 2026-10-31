import React, { useEffect, useRef, useState } from 'react';
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
import { DailyLoginModal } from './components/DailyLoginModal';
import { OfflineRewardModal } from './components/OfflineRewardModal';
import { SkillReplaceModal } from './components/SkillReplaceModal';
import { TutorialHint } from './components/TutorialHint';
import { ui } from './i18n/ui';
import { Stage } from './types/game';

export function App() {
  const [state, setState] = useState<GameStateData>(gameManager.getState());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [reviveToken, setReviveToken] = useState(0);
  // Level-up banner: progression should feel like an event, not a silent number change
  const [levelUpTo, setLevelUpTo] = useState<number | null>(null);
  const prevLevel = useRef(state.playerLevel);
  useEffect(() => {
    if (state.playerLevel > prevLevel.current) {
      setLevelUpTo(state.playerLevel);
      const timer = setTimeout(() => setLevelUpTo(null), 2200);
      prevLevel.current = state.playerLevel;
      return () => clearTimeout(timer);
    }
    prevLevel.current = state.playerLevel;
  }, [state.playerLevel]);

  // CSS uppercase follows the document language (Turkish dotted/dotless I), so keep it in sync with the game language
  useEffect(() => {
    document.documentElement.lang = state.lang;
  }, [state.lang]);

  useEffect(() => {
    const unsubscribe = gameManager.subscribe((newState) => {
      setState({ ...newState });
    });

    // Mobile lifecycle: save on background, grant AFK/daily rewards on return
    const onVisibility = () => {
      if (document.hidden) gameManager.onAppHidden();
      else gameManager.refreshSession();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onVisibility);

    // Expire timed buffs without waiting for the next fight
    const buffTimer = setInterval(() => gameManager.refreshBuffs(), 5000);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onVisibility);
      clearInterval(buffTimer);
    };
  }, []);

  const handleStageVictory = (stage: Stage) => {
    gameManager.onStageVictory(stage);
  };

  const isBattlePaused = Boolean(
    state.pendingLootDrop || state.pendingSkillOffer || state.pendingSkillReplacement ||
    state.isDailyLoginOpen || state.isLuckyWheelOpen || state.isOfflineRewardOpen ||
    state.activeAdModal || isSettingsOpen || isLeaderboardOpen
  );

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
      
      {/* Mobile-Friendly Portrait Phone Container with AAA Glow Frame */}
      <div className="app-shell relative w-full max-w-[430px] h-full h-[100dvh] max-h-[100dvh] bg-neutral-950 flex flex-col shadow-2xl border-x border-zinc-800/80 overflow-hidden">
        
        {/* Pinned Top Combat Deck (Header HUD + Battle Canvas + Stats) - Strictly non-scrollable */}
        <div className="combat-deck shrink-0 z-20 flex flex-col bg-neutral-950 select-none overscroll-none">
          {/* 1. Top Header HUD (Currencies, XP, Leaderboard, Settings) */}
          <HeaderNav 
            state={state} 
            onOpenSettings={() => setIsSettingsOpen(true)} 
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          />

          {/* 2. Top Half: 2.5D Combat Canvas Viewport */}
          <BattleCanvas state={state} onVictory={handleStageVictory} reviveToken={reviveToken} paused={isBattlePaused} />

          {/* 3. Mid Section: Real-time Stats Strip */}
          <StatBar stats={state.playerFighter.stats} lang={state.lang} />
        </div>

        {/* Scrollable Center: Only Interactive Tab Views Scroll */}
        <main className="tab-content flex-1 overflow-y-auto overscroll-y-contain overscroll-x-none scroll-smooth min-h-0">
          {renderActiveTab()}
        </main>

        {/* Pinned Bottom Navigation Bar */}
        <BottomNav activeTab={state.activeTab} lang={state.lang} />

        <TutorialHint state={state} blocked={isBattlePaused} />

        {levelUpTo !== null && (
          <div className="pointer-events-none absolute left-1/2 top-[58px] -translate-x-1/2 z-40 animate-fadeIn">
            <div className="px-5 py-2 rounded-2xl game-btn-gold text-black text-center shadow-2xl border border-amber-200">
              <div className="text-[13px] font-black tracking-wider">⬆ {ui(state.lang, 'level_up')}</div>
              <div className="text-[11px] font-black">Lv. {levelUpTo}</div>
            </div>
          </div>
        )}

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
          <RewardedAdModal state={state} onReviveClaimed={() => setReviveToken((token) => token + 1)} />
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
