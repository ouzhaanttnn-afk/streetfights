import React from 'react';
import { GameStateData, gameManager } from '../core/gameState';
import { nextStep } from '../core/guidance';
import { ui } from '../i18n/ui';
import { ChevronRight, Lightbulb } from 'lucide-react';

// One line that always answers "what should I do now?" — hidden when the answer is "keep fighting"
export const NextStepCard: React.FC<{ state: GameStateData }> = ({ state }) => {
  if (state.tutorialStep < 4) return null;
  const step = nextStep(state);
  if (!step) return null;
  const here = state.activeTab === step.tab &&
    (step.tab === 'gear' ? state.fighterView === step.view : step.tab === 'arena' ? state.arenaView === step.view : true);
  if (here) return null;
  return (
    <button
      data-next-step={step.key}
      onClick={() => gameManager.setActiveTab(step.tab, step.view)}
      className="mx-3 mt-3 w-[calc(100%-1.5rem)] min-h-11 flex items-center gap-2.5 rounded-2xl px-3 py-2 bg-gradient-to-r from-amber-500/15 via-black/60 to-black/60 border border-amber-400/40 text-left active:scale-[0.98] animate-fadeIn"
    >
      <Lightbulb className="w-4 h-4 text-amber-300 shrink-0" />
      <span className="flex-1 text-[11px] font-black text-zinc-100 leading-snug">{ui(state.lang, step.key)}</span>
      <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-black text-black game-btn-gold rounded-xl px-2.5 py-1.5">
        {ui(state.lang, 'go')} <ChevronRight className="w-3 h-3" />
      </span>
    </button>
  );
};
