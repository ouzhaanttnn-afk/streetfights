import React, { useEffect } from 'react';
import { GameStateData, gameManager } from '../core/gameState';
import { ui } from '../i18n/ui';

const STEPS = ['tut1', 'tut2', 'tut3', 'tut4'];

export const TutorialHint: React.FC<{ state: GameStateData; blocked: boolean }> = ({ state, blocked }) => {
  const step = state.tutorialStep;
  // Point at what the card talks about: AUTO, the rage bar's SUPER spot, the Gym tab, the Arena tab
  useEffect(() => {
    const selector = [
      '[data-auto-toggle]',
      '',
      'nav [data-tab=gym]',
      'nav [data-tab=arena]',
    ][step];
    if (!selector || blocked) return;
    const el = document.querySelector(selector);
    el?.classList.add('tutorial-target');
    return () => el?.classList.remove('tutorial-target');
  }, [step, blocked]);
  if (step >= STEPS.length || blocked) return null;
  return (
    <div
      className="absolute left-3 right-3 z-30 game-card rounded-2xl border border-amber-400/60 p-3 shadow-2xl animate-fadeIn"
      style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-6 h-6 shrink-0 rounded-full game-btn-gold text-black text-[11px] font-black flex items-center justify-center">{step + 1}</div>
        <p className="text-[11px] leading-snug font-bold text-zinc-100">{ui(state.lang, STEPS[step])}</p>
      </div>
      <div className="flex justify-between items-center mt-2.5">
        <button onClick={() => gameManager.skipTutorial()} className="min-h-9 px-2 text-[10px] font-black text-zinc-500">
          {ui(state.lang, 'tut_skip')}
        </button>
        <button onClick={() => gameManager.advanceTutorial()} className="min-h-9 px-5 rounded-xl game-btn-gold text-black text-[11px] font-black active:scale-95">
          {ui(state.lang, step === STEPS.length - 1 ? 'tut_go' : 'tut_next')}
        </button>
      </div>
    </div>
  );
};
