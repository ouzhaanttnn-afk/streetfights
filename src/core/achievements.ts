import type { GameStateData } from './gameState';
import type { BossMechanicId } from '../types/game';
import { WORLD_MECHANICS } from './combat';
import { LEAGUE_IDS } from './leagues';

export type AchievementTier = 'bronze' | 'silver' | 'gold';

export interface Achievement {
  id: string;
  key: string; // i18n key in src/i18n/ui.ts
  n?: number;
  // Extra placeholder values for the string (e.g. {league}, {mech}); resolved by the card
  vars?: { league?: number; mech?: BossMechanicId };
  target: number;
  gems: number;
  tier: AchievementTier;
  value: (s: GameStateData) => number;
}

const bestStage = (s: GameStateData) => (s.highestWorld - 1) * 10 + s.highestSubStage;
const gymLevels = (s: GameStateData) => s.gymTrainings.reduce((sum, g) => sum + (g.level - 1), 0);
const maxSkillLevel = (s: GameStateData) => s.playerFighter.equippedSkills.reduce((m, k) => Math.max(m, k.level || 1), 0);
const families = (s: GameStateData) => new Set(s.playerFighter.equippedSkills.map((k) => k.category)).size;

// Bronze / silver / gold steps of one counter. Ids of the original 11 achievements are kept so claims stay valid.
function ladder(prefix: string, key: string, steps: [number, number][], value: Achievement['value'], targetOf = (n: number) => n): Achievement[] {
  const tiers: AchievementTier[] = ['bronze', 'silver', 'gold'];
  return steps.map(([n, gems], i) => ({ id: `${prefix}_${n}`, key, n, target: targetOf(n), gems, tier: tiers[Math.min(2, Math.floor((i * 3) / steps.length))], value }));
}

// Lifetime goals: a steady stream of small gem rewards to pull players back in.
export const ACHIEVEMENTS: Achievement[] = [
  ...ladder('fights', 'a_win', [[10, 10], [100, 40], [500, 120], [2000, 250], [5000, 400]], (s) => s.totalFightsWon),
  { id: 'boss_1', key: 'a_boss1', target: 1, gems: 20, tier: 'bronze', value: (s) => s.bossDefeatedCount },
  ...ladder('boss', 'a_boss', [[10, 80], [25, 120], [50, 200], [100, 350]], (s) => s.bossDefeatedCount),
  ...ladder('level', 'a_level', [[10, 30], [25, 90], [50, 200], [75, 350]], (s) => s.playerLevel),
  // "Clear stage n": highest stage reached is n + 1
  ...ladder('stage', 'a_stage', [[10, 25], [50, 100], [100, 200], [150, 300], [250, 500]], bestStage, (n) => n + 1),
  ...ladder('gym', 'a_gym', [[25, 30], [100, 100], [250, 250]], gymLevels),
  { id: 'skills_6', key: 'a_skills', target: 6, gems: 30, tier: 'bronze', value: (s) => s.playerFighter.equippedSkills.length },
  { id: 'skill_max', key: 'a_skill_max', target: 5, gems: 60, tier: 'silver', value: maxSkillLevel },
  { id: 'families_5', key: 'a_families', n: 5, target: 5, gems: 80, tier: 'gold', value: families },
  ...ladder('drafts', 'a_drafts', [[10, 25], [50, 80], [150, 200]], (s) => s.draftsPicked || 0),
  // One per signature boss mechanic (world bosses only)
  ...WORLD_MECHANICS.map((mech, i): Achievement => ({
    id: `mech_${mech}`, key: 'a_mech', vars: { mech }, target: 1, gems: 40 + 10 * i, tier: i < 2 ? 'bronze' : i < 4 ? 'silver' : 'gold',
    value: (s) => s.mechWins?.[mech] || 0,
  })),
  { id: 'charged_block_10', key: 'a_block_charged', n: 10, target: 10, gems: 60, tier: 'silver', value: (s) => s.chargedBlocked || 0 },
  // Leagues after Bronze
  ...LEAGUE_IDS.slice(1).map((_, i): Achievement => ({
    id: `league_${i + 1}`, key: 'a_league', vars: { league: i + 1 }, target: i + 1, gems: 150 + 100 * i, tier: i < 1 ? 'bronze' : i < 3 ? 'silver' : 'gold',
    value: (s) => s.league || 0,
  })),
];
