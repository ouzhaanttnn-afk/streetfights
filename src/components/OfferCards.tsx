import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { GameStateData, gameManager } from '../core/gameState';
import { ui } from '../i18n/ui';
import { Bell, Tv, X } from 'lucide-react';

// After a boss win: optional rewarded ad that pays the boss reward once more. Disappears by itself.
export const BossBonusCard: React.FC<{ state: GameStateData }> = ({ state }) => {
  const bonus = state.bossBonus;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!bonus) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [bonus]);
  if (!bonus || now > bonus.expiresAt || state.activeAdModal) return null;
  const secs = Math.max(0, Math.ceil((bonus.expiresAt - now) / 1000));
  return (
    <div data-boss-bonus className="mx-3 mt-3 flex items-center gap-2 rounded-2xl px-3 py-2 bg-gradient-to-r from-amber-500/25 via-black/70 to-black/60 border border-amber-400/60 animate-fadeIn">
      <button onClick={() => gameManager.claimBossBonusOffer()} className="flex-1 min-h-10 flex items-center gap-2.5 text-left active:scale-[0.98]">
        <span className="w-8 h-8 shrink-0 rounded-xl game-btn-gold text-black flex items-center justify-center"><Tv className="w-4 h-4" /></span>
        <span className="flex-1 min-w-0">
          <span className="block text-[11px] font-black text-amber-200">{ui(state.lang, 'boss_bonus')}</span>
          <span className="block text-[10px] font-mono font-bold text-zinc-300">+{bonus.coins.toLocaleString()} 🪙 +{bonus.gems} 💎 · {secs}s</span>
        </span>
      </button>
      <button onClick={() => gameManager.dismissBossBonus()} aria-label="Close" className="w-8 h-8 shrink-0 rounded-xl bg-black/50 border border-white/10 text-zinc-400 flex items-center justify-center active:scale-95">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// Soft ask before the iOS notification prompt, shown once after the player has some wins
export const NotifyAskCard: React.FC<{ state: GameStateData }> = ({ state }) => {
  const supported = Capacitor.isNativePlatform() || import.meta.env.DEV;
  if (!supported || state.notifAsked || state.totalFightsWon < 8 || state.tutorialStep < 4) return null;
  return (
    <div data-notif-ask className="mx-3 mt-3 rounded-2xl px-3 py-2.5 bg-gradient-to-r from-sky-500/15 via-black/70 to-black/60 border border-sky-400/40 animate-fadeIn">
      <div className="flex items-start gap-2.5">
        <Bell className="w-4 h-4 text-sky-300 shrink-0 mt-0.5" />
        <p className="flex-1 text-[11px] font-bold text-zinc-100 leading-snug">{ui(state.lang, 'notif_ask')}</p>
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button onClick={() => gameManager.answerNotificationAsk(false)} className="min-h-9 px-3 rounded-xl text-[10px] font-black text-zinc-400 active:scale-95">
          {ui(state.lang, 'notif_no')}
        </button>
        <button onClick={() => gameManager.answerNotificationAsk(true)} className="min-h-9 px-4 rounded-xl bg-sky-400 text-black text-[11px] font-black active:scale-95">
          {ui(state.lang, 'notif_yes')}
        </button>
      </div>
    </div>
  );
};
