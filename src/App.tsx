import React, { useEffect, useRef, useState } from 'react';
import { GameStateData, gameManager } from './core/gameState';
import { HeaderNav } from './components/HeaderNav';
import { BattleCanvas } from './components/BattleCanvas';
import { StatBar } from './components/StatBar';
import { BottomNav } from './components/BottomNav';
import { FighterTab } from './components/tabs/FighterTab';
import { GymTab } from './components/tabs/GymTab';
import { ShopTab } from './components/tabs/ShopTab';
import { ArenaTab } from './components/tabs/ArenaTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { LootCardModal } from './components/LootCardModal';
import { SkillSelectModal } from './components/SkillSelectModal';
import { RewardedAdModal } from './components/RewardedAdModal';
import { SettingsModal } from './components/SettingsModal';
import { DailyLoginModal } from './components/DailyLoginModal';
import { OfflineRewardModal } from './components/OfflineRewardModal';
import { SkillReplaceModal } from './components/SkillReplaceModal';
import { TutorialHint } from './components/TutorialHint';
import { NextStepCard } from './components/NextStepCard';
import { BossBonusCard, BuffOfferCard, NotifyAskCard } from './components/OfferCards';
import { ToastStack } from './components/ToastStack';
import { getStageData } from './core/stageDatabase';
import { fightOdds } from './core/combat';
import { ui } from './i18n/ui';
import { Stage } from './types/game';

export function App() {
  const [state, setState] = useState<GameStateData>(gameManager.getState());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
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
    // pagehide fires while document.hidden is still false: it must only ever save, never start a new session
    const onPageHide = () => gameManager.onAppHidden();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);

    // Expire timed buffs without waiting for the next fight
    const buffTimer = setInterval(() => gameManager.refreshBuffs(), 5000);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      clearInterval(buffTimer);
    };
  }, []);

  const handleStageVictory = (stage: Stage) => {
    gameManager.onStageVictory(stage);
  };

  // The boss bonus offer keeps its time while a loot/skill card or another modal covers it
  const bonusCovered = Boolean(
    state.bossBonus && (state.pendingLootDrop || state.pendingSkillOffer || state.pendingSkillReplacement ||
      state.isDailyLoginOpen || state.isOfflineRewardOpen || state.activeAdModal || isSettingsOpen || state.isProfileOpen)
  );
  useEffect(() => {
    if (!bonusCovered) return;
    const timer = setInterval(() => gameManager.extendBossBonus(1000), 1000);
    return () => clearInterval(timer);
  }, [bonusCovered]);

  const isBattlePaused = Boolean(
    state.pendingLootDrop || state.pendingSkillOffer || state.pendingSkillReplacement ||
    state.isDailyLoginOpen || state.isOfflineRewardOpen ||
    state.activeAdModal || isSettingsOpen || state.isProfileOpen
  );

  const renderActiveTab = () => {
    switch (state.activeTab) {
      case 'gym':
        return <GymTab state={state} />;
      case 'shop':
        return <ShopTab state={state} />;
      case 'arena':
        return <ArenaTab state={state} />;
      default:
        return <FighterTab state={state} />;
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
          />

          {/* 2. Top Half: 2.5D Combat Canvas Viewport */}
          <BattleCanvas state={state} onVictory={handleStageVictory} reviveToken={reviveToken} paused={isBattlePaused} />

          {/* 3. Mid Section: Real-time Stats Strip */}
          <StatBar
            stats={state.playerFighter.stats}
            lang={state.lang}
            odds={(() => {
              const opp = getStageData(state.currentWorld, state.currentSubStage).opponent;
              return fightOdds(state.playerFighter.stats, opp.stats, opp.profile);
            })()}
          />
        </div>

        {/* Scrollable Center: Only Interactive Tab Views Scroll */}
        <main className="tab-content flex-1 overflow-y-auto overscroll-y-contain overscroll-x-none scroll-smooth min-h-0">
          {/* At most one prompt above the tab: boss bonus > notification ask > next step */}
          {state.bossBonus && Date.now() < state.bossBonus.expiresAt ? (
            <BossBonusCard state={state} />
          ) : state.buffOffer && Date.now() < state.buffOffer.expiresAt ? (
            <BuffOfferCard state={state} />
          ) : !state.notifAsked && state.totalFightsWon >= 8 ? (
            <NotifyAskCard state={state} />
          ) : (
            <NextStepCard state={state} />
          )}
          {renderActiveTab()}
        </main>

        {/* Pinned Bottom Navigation Bar */}
        <BottomNav state={state} />

        <ToastStack />

        <TutorialHint state={state} blocked={isBattlePaused} />

        {levelUpTo !== null && (
          <div className="level-up-banner pointer-events-none absolute left-1/2 -translate-x-1/2 z-40 animate-fadeIn">
            <div className="result-slam px-8 py-3 rounded-3xl game-btn-gold text-black text-center shadow-2xl border-2 border-amber-100">
              <div className="text-lg font-black tracking-wider leading-tight">⬆ {ui(state.lang, 'level_up')}</div>
              <div className="text-sm font-black">Lv. {levelUpTo}</div>
              <div className="text-[11px] font-black opacity-80 mt-0.5">+20 HP · +3 ATK · +2 DEF · +1 SPD</div>
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

        {/* 14. Profile sheet (tap the name in the header) */}
        {state.isProfileOpen && <ProfileTab state={state} onClose={() => gameManager.setProfileOpen(false)} />}
      </div>
    </div>
  );
}

export default App;
