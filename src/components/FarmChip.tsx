import React from 'react';
import { GameStateData, READY_ODDS, gameManager } from '../core/gameState';
import { getStageData } from '../core/stageDatabase';
import { ui } from '../i18n/ui';
import { stageLabel } from '../i18n/content-helpers';

// Farm until ready (docs/PLAN_BUILD_19.md B3): while the fighter farms below a wall this chip shows the progress,
// and turns into a gold "Boss ready" button once the fight odds reach READY_ODDS. One tap goes back.
// Progress from where farming started to READY_ODDS (absolute odds read as "0%" against a far-away wall)
export function farmProgress(odds: number, startOdds = 0): number {
  const start = Math.min(startOdds, READY_ODDS - 0.05);
  return Math.max(0, Math.min(99, Math.round(((odds - start) / (READY_ODDS - start)) * 100)));
}

export const FarmChip: React.FC<{ state: GameStateData; className?: string }> = ({ state, className = '' }) => {
  const farm = state.farm;
  if (!farm) return null;
  const odds = gameManager.farmOdds() ?? 0;
  const ready = odds >= READY_ODDS;
  const target = getStageData(farm.world, farm.sub);
  const label = ready
    ? target.isBoss ? ui(state.lang, 'farm_ready_boss') : ui(state.lang, 'farm_ready_stage', { stage: stageLabel(farm.world, farm.sub, state.lang) })
    : ui(state.lang, 'farm_chip', { n: farmProgress(odds, farm.startOdds) });
  return (
    <button
      type="button"
      data-farm-chip={ready ? 'ready' : 'farming'}
      onClick={() => (ready ? gameManager.returnToFarmTarget() : undefined)}
      aria-disabled={!ready}
      className={`min-h-8 px-3 rounded-full text-[10px] font-black tracking-wide shadow-lg backdrop-blur-md active:scale-95 ${
        ready ? 'game-btn-gold text-black border border-amber-200 animate-pulse' : 'bg-black/75 text-zinc-200 border border-white/20'
      } ${className}`}
    >
      {label}
    </button>
  );
};
