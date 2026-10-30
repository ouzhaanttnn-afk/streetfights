import type { GameStateData } from './gameState';

export interface Achievement {
  id: string;
  tr: string;
  en: string;
  target: number;
  gems: number;
  value: (s: GameStateData) => number;
}

const bestStage = (s: GameStateData) => (s.highestWorld - 1) * 10 + s.highestSubStage;
const gymLevels = (s: GameStateData) => s.gymTrainings.reduce((sum, g) => sum + (g.level - 1), 0);

// Lifetime goals: a steady stream of small gem rewards to pull players back in.
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'fights_10', tr: '10 dövüş kazan', en: 'Win 10 fights', target: 10, gems: 10, value: (s) => s.totalFightsWon },
  { id: 'fights_100', tr: '100 dövüş kazan', en: 'Win 100 fights', target: 100, gems: 40, value: (s) => s.totalFightsWon },
  { id: 'fights_500', tr: '500 dövüş kazan', en: 'Win 500 fights', target: 500, gems: 120, value: (s) => s.totalFightsWon },
  { id: 'boss_1', tr: 'İlk boss\'u yen', en: 'Defeat your first boss', target: 1, gems: 20, value: (s) => s.bossDefeatedCount },
  { id: 'boss_10', tr: '10 boss yen', en: 'Defeat 10 bosses', target: 10, gems: 80, value: (s) => s.bossDefeatedCount },
  { id: 'level_10', tr: 'Seviye 10\'a ulaş', en: 'Reach level 10', target: 10, gems: 30, value: (s) => s.playerLevel },
  { id: 'level_25', tr: 'Seviye 25\'e ulaş', en: 'Reach level 25', target: 25, gems: 90, value: (s) => s.playerLevel },
  { id: 'stage_10', tr: '10. bölümü geç', en: 'Clear stage 10', target: 11, gems: 25, value: bestStage },
  { id: 'stage_50', tr: '50. bölümü geç', en: 'Clear stage 50', target: 51, gems: 100, value: bestStage },
  { id: 'gym_25', tr: 'Salonda toplam 25 seviye', en: '25 total gym levels', target: 25, gems: 30, value: gymLevels },
  { id: 'skills_6', tr: '6 beceri slotunu doldur', en: 'Fill all 6 skill slots', target: 6, gems: 30, value: (s) => s.playerFighter.equippedSkills.length },
];
