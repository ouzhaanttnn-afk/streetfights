import { Skill } from '../types/game';

export const SKILL_DATABASE: Skill[] = [
  // STRIKE & CRIT BUILDS
  {
    id: 'skill_flurry_master',
    name: 'Flurry Master',
    description: 'Rapid punches executed in a single continuous breath.',
    quote: '"Five punches, one breath."',
    rarity: 'epic',
    category: 'combo',
    level: 1,
    maxLevel: 5,
    iconName: 'Zap',
    bonusText: '+6% Combo Rate, +12 ATK',
    statBonus: { comboRate: 6, atk: 12 },
    specialProc: { type: 'double_strike', chance: 25, multiplier: 1.5 },
  },
  {
    id: 'skill_bicycle_thunder',
    name: 'Thunder Bicycle Kick',
    description: 'Leap into the air and deliver a devastating overhead thunder kick.',
    quote: '"Gravity is optional in this ring."',
    rarity: 'legendary',
    category: 'strike',
    level: 1,
    maxLevel: 5,
    iconName: 'Sparkles',
    bonusText: '+8% Crit Rate, +35% Crit DMG',
    statBonus: { critRate: 8, critDmg: 0.35, atk: 20 },
    specialProc: { type: 'bicycle_kick', chance: 20, multiplier: 2.2 },
  },
  {
    id: 'skill_heavy_haymaker',
    name: 'Heavy Haymaker',
    description: 'A crushing overhand hook that fractures enemy guard.',
    quote: '"One clean connection is all it takes."',
    rarity: 'rare',
    category: 'strike',
    level: 1,
    maxLevel: 5,
    iconName: 'Flame',
    bonusText: '+18 ATK, +5% Crit Rate',
    statBonus: { atk: 18, critRate: 5 },
  },

  // DEFENSE & TANK BUILDS
  {
    id: 'skill_iron_chin',
    name: 'Iron Chin',
    description: 'Hardened jaw absorbs heavy impacts without flinching.',
    quote: '"Hit me with your best shot."',
    rarity: 'rare',
    category: 'defense',
    level: 1,
    maxLevel: 5,
    iconName: 'Shield',
    bonusText: '+120 HP, +15 DEF',
    statBonus: { hp: 120, def: 15 },
    specialProc: { type: 'iron_chin', chance: 20, multiplier: 0.5 },
  },
  {
    id: 'skill_golden_guard',
    name: 'Golden Fortress',
    description: 'Impenetrable blocking stance backed by titanium spirit.',
    quote: '"Unshakable as concrete."',
    rarity: 'epic',
    category: 'defense',
    level: 1,
    maxLevel: 5,
    iconName: 'ShieldAlert',
    bonusText: '+200 HP, +25 DEF, +40 Stamina',
    statBonus: { hp: 200, def: 25, stamina: 40 },
  },

  // SPEED & DODGE BUILDS
  {
    id: 'skill_shadow_slip',
    name: 'Shadow Slip',
    description: 'Fluid head movement makes attacks graze uselessly past.',
    quote: '"Float like a feather, strike like lightning."',
    rarity: 'rare',
    category: 'speed',
    level: 1,
    maxLevel: 5,
    iconName: 'Wind',
    bonusText: '+7% Dodge Rate, +8 SPD',
    statBonus: { dodgeRate: 7, spd: 8 },
    specialProc: { type: 'shadow_dodge', chance: 20, multiplier: 1.0 },
  },
  {
    id: 'skill_counter_sniper',
    name: 'Counter Striker',
    description: 'Immediately retaliate with a punishing cross right after dodging.',
    quote: '"Miss me? Pay the toll."',
    rarity: 'legendary',
    category: 'rage',
    level: 1,
    maxLevel: 5,
    iconName: 'Crosshair',
    bonusText: '+6% Dodge Rate, +15 ATK, Counter Strike',
    statBonus: { dodgeRate: 6, atk: 15 },
    specialProc: { type: 'counter_strike', chance: 35, multiplier: 1.8 },
  },

  // LIFESTEAL & VAMPIRE BUILDS
  {
    id: 'skill_vampiric_bite',
    name: 'Vampiric Strikes',
    description: 'Absorb the opponent\'s stamina and health with every landed blow.',
    quote: '"Your pain feeds my vitality."',
    rarity: 'epic',
    category: 'lifesteal',
    level: 1,
    maxLevel: 5,
    iconName: 'HeartPulse',
    bonusText: '+5.5% Lifesteal, +60 HP',
    statBonus: { lifesteal: 5.5, hp: 60 },
    specialProc: { type: 'vampire', chance: 30, multiplier: 1.0 },
  },
  {
    id: 'skill_adrenaline_rush',
    name: 'Adrenaline Surge',
    description: 'When near low health, surge with explosive attack and speed.',
    quote: '"I can do this all day."',
    rarity: 'rare',
    category: 'lifesteal',
    level: 1,
    maxLevel: 5,
    iconName: 'Activity',
    bonusText: '+15 ATK, +10 SPD, +50 Stamina',
    statBonus: { atk: 15, spd: 6, lifesteal: 3 },
  },

  // SPECIAL SOCCER / STRIKER BUILDS
  {
    id: 'skill_golden_curve',
    name: 'Curveball Volley',
    description: 'Kick with extreme spin that curves right around enemy guards.',
    quote: '"Bend physics to your will."',
    rarity: 'epic',
    category: 'combo',
    level: 1,
    maxLevel: 5,
    iconName: 'CircleDot',
    bonusText: '+6% Crit Rate, +5% Combo Rate, +14 ATK',
    statBonus: { critRate: 6, comboRate: 5, atk: 14 },
  },
  {
    id: 'skill_berserk_trance',
    name: 'Street Berserker',
    description: 'Sacrifice defense for immense raw punching and kicking destruction.',
    quote: '"All gas, no brakes."',
    rarity: 'mythic',
    category: 'rage',
    level: 1,
    maxLevel: 5,
    iconName: 'Skull',
    bonusText: '+45 ATK, +10% Crit, +10% Combo, -10 DEF',
    statBonus: { atk: 45, critRate: 10, comboRate: 10, def: -10 },
    specialProc: { type: 'execute', chance: 15, multiplier: 2.5 },
  },
  {
    id: 'skill_mach_speed',
    name: 'Mach Footwork',
    description: 'Hypersonic pivots and foot taps overwhelm slower heavyweights.',
    quote: '"Too slow to even see me."',
    rarity: 'uncommon',
    category: 'speed',
    level: 1,
    maxLevel: 5,
    iconName: 'Footprints',
    bonusText: '+12 SPD, +4% Dodge Rate',
    statBonus: { spd: 12, dodgeRate: 4 },
  },
  // BUILD 19: one new skill per family, each with its own mechanic (rules in src/core/combat.ts SKILL_RULES)
  {
    id: 'skill_armor_breaker',
    name: 'Armor Breaker',
    description: 'Every landed blow cracks the guard a little more.',
    quote: '"Walls are just doors you have not hit yet."',
    rarity: 'rare',
    category: 'strike',
    level: 1,
    maxLevel: 5,
    iconName: 'Hammer',
    bonusText: '+16 ATK, +3% Crit Rate, Armor Break',
    statBonus: { atk: 16, critRate: 3 },
    // each landed hit removes 5% of the target's DEF for the rest of the fight (max 8 stacks)
    specialProc: { type: 'armor_break', chance: 100, multiplier: 0.05 },
  },
  {
    id: 'skill_chain_lightning',
    name: 'Chain Lightning',
    description: 'A combo that keeps finding another opening.',
    quote: '"One more. Always one more."',
    rarity: 'legendary',
    category: 'combo',
    level: 1,
    maxLevel: 5,
    iconName: 'Zap',
    bonusText: '+7% Combo Rate, +4 SPD, Chain Combo',
    statBonus: { comboRate: 7, spd: 4 },
    // a combo follow-up chains into another one with 45% (at most two extra hits)
    specialProc: { type: 'chain_combo', chance: 45, multiplier: 0.35 },
  },
  {
    id: 'skill_second_wind',
    name: 'Second Wind',
    description: 'Once per fight, refuse to go down and catch your breath.',
    quote: '"Not yet."',
    rarity: 'epic',
    category: 'defense',
    level: 1,
    maxLevel: 5,
    iconName: 'LifeBuoy',
    bonusText: '+150 HP, +10 DEF, Second Wind',
    statBonus: { hp: 150, def: 10 },
    // once per fight below 25% HP: heal 35% of max HP
    specialProc: { type: 'second_wind', chance: 100, multiplier: 0.35 },
  },
  {
    id: 'skill_sixth_sense',
    name: 'Sixth Sense',
    description: 'Feel the big punch coming and slip it.',
    quote: '"I saw that one yesterday."',
    rarity: 'epic',
    category: 'speed',
    level: 1,
    maxLevel: 5,
    iconName: 'Eye',
    bonusText: '+5% Dodge Rate, +6 SPD, Sixth Sense',
    statBonus: { dodgeRate: 5, spd: 6 },
    // 50% to slip heavy, critical and charged strikes completely
    specialProc: { type: 'sixth_sense', chance: 50, multiplier: 1 },
  },
  {
    id: 'skill_grievous_bite',
    name: 'Grievous Strikes',
    description: 'Wounds that do not close: the opponent heals only half as much.',
    quote: '"Patch that up. I dare you."',
    rarity: 'rare',
    category: 'lifesteal',
    level: 1,
    maxLevel: 5,
    iconName: 'Droplet',
    bonusText: '+4% Lifesteal, +8 ATK, Grievous Wounds',
    statBonus: { lifesteal: 4, atk: 8 },
    // halves the opponent's healing (lifesteal, leech bites)
    specialProc: { type: 'wound', chance: 100, multiplier: 0.5 },
  },
  {
    id: 'skill_fury_engine',
    name: 'Fury Engine',
    description: 'Anger burns hotter: the SUPER bar fills much faster.',
    quote: '"Keep poking. See what happens."',
    rarity: 'epic',
    category: 'rage',
    level: 1,
    maxLevel: 5,
    iconName: 'Gauge',
    bonusText: '+12 ATK, +15% Crit DMG, Fury',
    statBonus: { atk: 12, critDmg: 0.15 },
    // rage builds 50% faster
    specialProc: { type: 'rage_boost', chance: 100, multiplier: 1.5 },
  },
];

export const DECK_SIZE = 6;

const RARITY_RANK: Record<string, number> = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6 };
const fresh = (base: Skill): Skill => ({ ...base, statBonus: { ...base.statBonus }, specialProc: base.specialProc ? { ...base.specialProc } : undefined });

/**
 * Skill draft (docs/PLAN_BUILD_19.md B1): three different skills to choose from. An owned skill appears as a
 * level-up; maxed skills never appear. With a full deck at least one option is a level-up when one is possible.
 * Returns fresh level-1 copies from the database; `levelUp` is true when the deck already has that skill.
 */
export function makeDraft(deck: Skill[], rand: () => number = Math.random, size = 3): { skill: Skill; levelUp: boolean }[] {
  const owned = new Map(deck.map((s) => [s.id, s]));
  const pool = SKILL_DATABASE.filter((s) => { const o = owned.get(s.id); return !o || o.level < o.maxLevel; });
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
  let pick = shuffled.slice(0, size);
  if (deck.length >= DECK_SIZE && !pick.some((s) => owned.has(s.id))) {
    const up = shuffled.find((s) => owned.has(s.id));
    if (up && pick.length) pick = [...pick.slice(0, pick.length - 1), up];
  }
  return pick.map((s) => ({ skill: fresh(s), levelUp: owned.has(s.id) }));
}

/** How good a draft option is for this deck (used for the highlighted pick and the auto-pick) */
export function draftScore(skill: Skill, deck: Skill[]): number {
  const owned = deck.find((s) => s.id === skill.id);
  const sameFamily = deck.filter((s) => s.category === skill.category && s.id !== skill.id).length;
  const rank = RARITY_RANK[skill.rarity] || 1;
  if (owned) return 3 + (sameFamily >= 1 ? 1.5 : 0) + rank * 0.3 - owned.level * 0.2;
  if (deck.length >= DECK_SIZE) return 0.5 + rank * 0.1; // would need a replacement
  return 3.5 + rank * 0.4 + (sameFamily === 1 ? 1.5 : 0);
}

export function recommendedDraftIndex(options: { skill: Skill }[], deck: Skill[]): number {
  let best = 0;
  options.forEach((o, i) => { if (draftScore(o.skill, deck) > draftScore(options[best].skill, deck)) best = i; });
  return best;
}
