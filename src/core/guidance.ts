// What should the player do next? Drives the red dots on the bottom tabs and the one-line "next step" card.
import type { GameStateData } from './gameState';
import { ACHIEVEMENTS } from './achievements';
import type { TabType } from '../types/game';

export interface NextStep {
  key: string; // ui() string key
  tab: TabType;
  view?: 'gear' | 'skills' | 'stages' | 'quests';
}

export function betterGearInBag(state: GameStateData): number {
  const eq = state.playerFighter.equipped;
  return state.inventory.filter((i) => i.powerScore > (eq[i.slot]?.powerScore || 0)).length;
}

export function claimableRewards(state: GameStateData): number {
  const quests = (state.dailyQuests || []).filter((q) => !q.claimed && q.progress >= q.target).length;
  const claimed = state.claimedAchievements || [];
  const ach = ACHIEVEMENTS.filter((a) => !claimed.includes(a.id) && a.value(state) >= a.target).length;
  return quests + ach;
}

export function cheapestGymCost(state: GameStateData): number {
  return state.gymTrainings.reduce((min, g) => Math.min(min, g.cost), Infinity);
}

export function canTrain(state: GameStateData): boolean {
  return state.coins >= cheapestGymCost(state);
}

export function tabBadges(state: GameStateData): Partial<Record<TabType, boolean>> {
  return {
    gear: betterGearInBag(state) > 0,
    gym: state.coins >= cheapestGymCost(state) * 3,
    arena: claimableRewards(state) > 0,
  };
}

// Highest-value action first. Returns null when the best move is simply to keep fighting.
export function nextStep(state: GameStateData): NextStep | null {
  if (claimableRewards(state) > 0) return { key: 'next_claim', tab: 'arena', view: 'quests' };
  if (betterGearInBag(state) > 0) return { key: 'next_gear', tab: 'gear', view: 'gear' };
  if ((state.lossStreak || 0) > 0 && canTrain(state)) return { key: 'next_gym_loss', tab: 'gym' };
  // Coins piling up: suggest the gym once they cover a few upgrades
  if (state.coins >= cheapestGymCost(state) * 3) return { key: 'next_gym', tab: 'gym' };
  return null;
}

// How the current fight should go, from the expected time-to-kill on both sides
export function difficultyOf(odds: number): [string, string] {
  if (odds >= 1.8) return ['diff_easy', 'text-emerald-300 border-emerald-500/50'];
  if (odds >= 1.1) return ['diff_even', 'text-amber-300 border-amber-500/50'];
  if (odds >= 0.75) return ['diff_hard', 'text-orange-300 border-orange-500/60'];
  return ['diff_deadly', 'text-rose-300 border-rose-500/70'];
}
