import type { GameStateData } from './gameState';

export interface Achievement {
  id: string;
  key: string; // i18n key in src/i18n/ui.ts
  n?: number;
  target: number;
  gems: number;
  value: (s: GameStateData) => number;
}

const bestStage = (s: GameStateData) => (s.highestWorld - 1) * 10 + s.highestSubStage;
const gymLevels = (s: GameStateData) => s.gymTrainings.reduce((sum, g) => sum + (g.level - 1), 0);

// Lifetime goals: a steady stream of small gem rewards to pull players back in.
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'fights_10', key: 'a_win', n: 10, target: 10, gems: 10, value: (s) => s.totalFightsWon },
  { id: 'fights_100', key: 'a_win', n: 100, target: 100, gems: 40, value: (s) => s.totalFightsWon },
  { id: 'fights_500', key: 'a_win', n: 500, target: 500, gems: 120, value: (s) => s.totalFightsWon },
  { id: 'boss_1', key: 'a_boss1', target: 1, gems: 20, value: (s) => s.bossDefeatedCount },
  { id: 'boss_10', key: 'a_boss', n: 10, target: 10, gems: 80, value: (s) => s.bossDefeatedCount },
  { id: 'level_10', key: 'a_level', n: 10, target: 10, gems: 30, value: (s) => s.playerLevel },
  { id: 'level_25', key: 'a_level', n: 25, target: 25, gems: 90, value: (s) => s.playerLevel },
  { id: 'stage_10', key: 'a_stage', n: 10, target: 11, gems: 25, value: bestStage },
  { id: 'stage_50', key: 'a_stage', n: 50, target: 51, gems: 100, value: bestStage },
  { id: 'gym_25', key: 'a_gym', n: 25, target: 25, gems: 30, value: gymLevels },
  { id: 'skills_6', key: 'a_skills', target: 6, gems: 30, value: (s) => s.playerFighter.equippedSkills.length },
];
