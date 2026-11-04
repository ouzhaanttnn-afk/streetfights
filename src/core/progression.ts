// Progression rules shared by the game (gameState) and the balance simulation (scripts/balance-sim.ts).
// Keep this file free of browser APIs so the simulation can import it in Node.
import type { FighterStats, GymTraining, StatModifiers } from '../types/game';

export const INITIAL_BASE_STATS: FighterStats = {
  hp: 220,
  maxHp: 220,
  atk: 22,
  def: 12,
  spd: 15,
  critRate: 8,
  critDmg: 1.5,
  comboRate: 8,
  dodgeRate: 6,
  lifesteal: 0,
  stamina: 100,
  powerScore: 280,
};

export const GYM_TEMPLATES: GymTraining[] = [
  {
    id: 'gym_punching_bag',
    name: 'Heavy Boxing Bag',
    description: 'Pound dense leather to increase raw striking power.',
    targetStat: 'atk',
    statGain: 3,
    level: 1,
    cost: 30,
    iconName: 'Flame',
  },
  {
    id: 'gym_bench_press',
    name: 'Heavy Iron Weights',
    description: 'Build core mass to increase maximum health & defense.',
    targetStat: 'hp',
    statGain: 25,
    level: 1,
    cost: 35,
    iconName: 'Shield',
  },
  {
    id: 'gym_agility_ladder',
    name: 'Agility Ladder & Cones',
    description: 'Fast footwork drill to boost movement speed & evasion.',
    targetStat: 'spd',
    statGain: 2,
    level: 1,
    cost: 40,
    iconName: 'Footprints',
  },
  {
    id: 'gym_reflex_ball',
    name: 'Speed Bag & Reflex Ball',
    description: 'Sharpen timing for deadly critical hits & combos.',
    targetStat: 'critRate',
    statGain: 0.8,
    level: 1,
    cost: 50,
    iconName: 'Zap',
  },
  {
    id: 'gym_jump_rope',
    name: 'Speed Rope Drills',
    description: 'Cardio workout to increase endurance & dodge instincts.',
    targetStat: 'dodgeRate',
    statGain: 0.7,
    level: 1,
    cost: 45,
    iconName: 'Wind',
  },
];

// Each gym level costs this much more than the previous one (was 1.35: the gym stopped mattering after world 2)
export const GYM_COST_GROWTH = 1.22;
// ATK and HP stations also give a percentage of the total stat per level, so they stay useful late in the game
export const GYM_PERCENT_PER_LEVEL: Partial<Record<keyof StatModifiers, number>> = { atk: 0.015, hp: 0.015 };
// Stats with a hard cap in calculateTotalStats
export const STAT_CAPS: Partial<Record<keyof StatModifiers, number>> = { critRate: 85, dodgeRate: 75, comboRate: 80 };

const BASE_COST: Record<string, number> = Object.fromEntries(GYM_TEMPLATES.map((g) => [g.id, g.cost]));

// Flat stations (ATK, HP, SPD) gain 40% more per level every 5 levels; percentage stations stay linear
const BASE_GAIN: Record<string, number> = Object.fromEntries(GYM_TEMPLATES.map((g) => [g.id, g.statGain]));
const RATE_STATS = new Set(['critRate', 'dodgeRate', 'comboRate', 'lifesteal']);
export function gymGainAt(id: string, level: number): number {
  const t = GYM_TEMPLATES.find((g) => g.id === id);
  const base = BASE_GAIN[id] ?? 1;
  if (!t || RATE_STATS.has(t.targetStat)) return base;
  return Math.round(base * Math.pow(1.4, Math.floor(level / 5)) * 10) / 10;
}

export function gymCostAt(id: string, level: number): number {
  return Math.round((BASE_COST[id] ?? 30) * Math.pow(GYM_COST_GROWTH, Math.max(0, level - 1)));
}

// Flat bonus: every level above 1 adds the station's current gain
export function gymFlatBonus(trainings: GymTraining[]): StatModifiers {
  const out: Record<string, number> = { hp: 0, atk: 0, def: 0, spd: 0, critRate: 0, critDmg: 0, comboRate: 0, dodgeRate: 0, lifesteal: 0, stamina: 0 };
  trainings.forEach((t) => {
    out[t.targetStat] = (out[t.targetStat] || 0) + (t.level - 1) * t.statGain;
  });
  return out as StatModifiers;
}

// Percentage bonus applied on top of the finished stats (gear, skills, level, flat gym)
export function applyGymPercent<T extends { atk: number; hp: number }>(stats: T, trainings: GymTraining[]): T {
  const pct = (stat: keyof StatModifiers) => {
    const t = trainings.find((x) => x.targetStat === stat);
    return t ? (t.level - 1) * (GYM_PERCENT_PER_LEVEL[stat] || 0) : 0;
  };
  return { ...stats, atk: stats.atk * (1 + pct('atk')), hp: stats.hp * (1 + pct('hp')) };
}

export function gymStatCapped(stat: keyof StatModifiers, current: FighterStats): boolean {
  const cap = STAT_CAPS[stat];
  return cap !== undefined && (current as unknown as Record<string, number>)[stat] >= cap;
}
