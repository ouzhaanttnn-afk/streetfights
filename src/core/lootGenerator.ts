import { EquipmentItem, EquipmentSlot, Rarity, StatModifiers } from '../types/game';

export const RARITY_CONFIG: Record<Rarity, {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  statMultiplier: number;
  sellMultiplier: number;
  weight: number;
}> = {
  common: {
    name: 'Common',
    color: 'text-zinc-300',
    bgColor: 'bg-zinc-800/80',
    borderColor: 'border-zinc-600',
    glowColor: 'shadow-zinc-700/30',
    statMultiplier: 1.0,
    sellMultiplier: 1.0,
    weight: 55,
  },
  uncommon: {
    name: 'Uncommon',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950/70',
    borderColor: 'border-emerald-500',
    glowColor: 'shadow-emerald-500/30',
    statMultiplier: 1.4,
    sellMultiplier: 1.8,
    weight: 25,
  },
  rare: {
    name: 'Rare',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-950/70',
    borderColor: 'border-cyan-500',
    glowColor: 'shadow-cyan-500/40',
    statMultiplier: 2.0,
    sellMultiplier: 3.5,
    weight: 12,
  },
  epic: {
    name: 'Epic',
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/70',
    borderColor: 'border-purple-500',
    glowColor: 'shadow-purple-500/50',
    statMultiplier: 3.2,
    sellMultiplier: 7.0,
    weight: 6,
  },
  legendary: {
    name: 'Legendary',
    color: 'text-amber-400',
    bgColor: 'bg-amber-950/80',
    borderColor: 'border-amber-500',
    glowColor: 'shadow-amber-500/60',
    statMultiplier: 5.0,
    sellMultiplier: 15.0,
    weight: 1.8,
  },
  mythic: {
    name: 'Mythic',
    color: 'text-rose-400',
    bgColor: 'bg-rose-950/80',
    borderColor: 'border-rose-500',
    glowColor: 'shadow-rose-500/70',
    statMultiplier: 8.5,
    sellMultiplier: 35.0,
    weight: 0.2,
  },
};

export const SLOT_INFO: Record<EquipmentSlot, {
  label: string;
  icon: string;
  primaryStat: keyof StatModifiers;
  secondaryStat: keyof StatModifiers;
  templates: { name: string; flavor: string }[];
}> = {
  head: {
    label: 'Head',
    icon: 'Crown',
    primaryStat: 'def',
    secondaryStat: 'hp',
    templates: [
      { name: 'Street Bandana', flavor: 'Tied tight for street duels.' },
      { name: 'Snapback Cap', flavor: 'Turned backwards for maximum swagger.' },
      { name: 'Sparring Headgear', flavor: 'Cushioned leather padding.' },
      { name: 'Glitch VR Visor', flavor: 'Analyzes enemy weak points in real-time.' },
      { name: 'Golden Champion Crown', flavor: 'Forged from championship medals.' },
    ],
  },
  gloves: {
    label: 'Gloves',
    icon: 'Flame',
    primaryStat: 'atk',
    secondaryStat: 'critRate',
    templates: [
      { name: 'Hand Wraps', flavor: 'Rough tape soaked in sweat and grit.' },
      { name: 'MMA Fingerless Gloves', flavor: 'Quick grip, explosive knuckles.' },
      { name: 'Heavy Bag Mitts', flavor: 'Dense padding that rattles skulls.' },
      { name: 'Iron Spiked Gauntlets', flavor: 'Devastating underground punchers.' },
      { name: 'Dragon Fist Gloves', flavor: 'Emits a fiery burst on impact.' },
    ],
  },
  mouth: {
    label: 'Mouth',
    icon: 'Smile',
    primaryStat: 'stamina',
    secondaryStat: 'def',
    templates: [
      { name: 'Rubber Mouthguard', flavor: 'Prevents losing teeth in a brawl.' },
      { name: 'Oxygen Altitude Mask', flavor: 'Boosts lung capacity & stamina.' },
      { name: 'Golden Grillz', flavor: 'Intimidates foes with a flashing smile.' },
      { name: 'Cyber Breath Filter', flavor: 'Purifies city smog into pure adrenaline.' },
    ],
  },
  robe: {
    label: 'Robe',
    icon: 'Shirt',
    primaryStat: 'hp',
    secondaryStat: 'def',
    templates: [
      { name: 'Torn Street Hoodie', flavor: 'Worn out but keeps muscles warm.' },
      { name: 'Sleeveless Fighter Tank', flavor: 'Maximum arm mobility.' },
      { name: 'Pro Club Striker Jersey', flavor: 'Lightweight, sweat-wicking champion kit.' },
      { name: 'Silk Boxer Robe', flavor: 'Gold trim embroidered with undefeated records.' },
      { name: 'Emperor Dragon Robe', flavor: 'Aura of an untouchable apex fighter.' },
    ],
  },
  shorts: {
    label: 'Shorts',
    icon: 'Scissors',
    primaryStat: 'spd',
    secondaryStat: 'comboRate',
    templates: [
      { name: 'Camo Cargo Shorts', flavor: 'Rough and ready for pavement tussles.' },
      { name: 'Muay Thai Kick Trunks', flavor: 'High cut allows ruthless head kicks.' },
      { name: 'Pro Striker Shorts', flavor: 'Aerodynamic fabric engineered for speed.' },
      { name: 'Gladiator Battle Trunks', flavor: 'Woven with ultra-durable carbon fibers.' },
    ],
  },
  boots: {
    label: 'Boots',
    icon: 'Footprints',
    primaryStat: 'spd',
    secondaryStat: 'dodgeRate',
    templates: [
      { name: 'Worn Sneakers', flavor: 'Grippy rubber soles for concrete.' },
      { name: 'High-Top Boxing Boots', flavor: 'Ankle support for lightning pivots.' },
      { name: 'Golden Striker Cleats', flavor: 'Precision studs for lethal bicycle kicks.' },
      { name: 'Cyber Jet Boots', flavor: 'Micro-boosters that accelerate dashes.' },
    ],
  },
  belt: {
    label: 'Belt',
    icon: 'Shield',
    primaryStat: 'def',
    secondaryStat: 'critDmg',
    templates: [
      { name: 'Leather Utility Belt', flavor: 'Keeps gear in check.' },
      { name: 'Silver Contender Belt', flavor: 'Proof of winning regional qualifiers.' },
      { name: 'Heavyweight Champion Belt', flavor: 'Solid gold plate with diamond inlays.' },
      { name: 'Immortal Brawler Belt', flavor: 'Imbued with the spirit of all past champions.' },
    ],
  },
  weapon: {
    label: 'Ball',
    icon: 'Crosshair',
    primaryStat: 'atk',
    secondaryStat: 'comboRate',
    templates: [
      { name: 'Worn Street Soccer Ball', flavor: 'Heavy rubber ball used for lethal volleys.' },
      { name: 'Iron-Core Street Ball', flavor: 'Smashes ribs when kicked at mach speed.' },
      { name: 'Thunder Curve Ball', flavor: 'Unpredictable spin confuses defenders.' },
      { name: 'Blazing Meteor Ball', flavor: 'Leaves a trail of sparks on bicycle strikes.' },
      { name: 'Plasma Golden Orb', flavor: 'Weaponized striker artifact.' },
    ],
  },
  partner: {
    label: 'Coach',
    icon: 'Heart',
    primaryStat: 'lifesteal',
    secondaryStat: 'comboRate',
    templates: [
      { name: 'Street Corner Hype-Man', flavor: '"Show \'em what the streets made of!"' },
      { name: 'Gym Coach Mick', flavor: '"Get in there and eat lightning!"' },
      { name: 'Popstar Girlfriend Mia', flavor: 'Cheering in the VIP front row.' },
      { name: 'Legendary Striker Sensei', flavor: 'Teaches the secret one-breath technique.' },
    ],
  },
};

// Slots that can drop and be equipped. Mouth, ball and coach were removed to keep the gear screen readable.
export const ACTIVE_SLOTS: EquipmentSlot[] = ['head', 'gloves', 'robe', 'shorts', 'boots', 'belt'];
// Six slots carry the stat budget nine used to; keeps the progression curve (tuned with scripts/run-balance-sim.mjs)
export const SLOT_COMPENSATION = 1.3;

// Secondary percentage stats of an item, from its rarity multiplier (1 common ... 8.5 mythic)
export function rateStat(stat: 'critRate' | 'critDmg' | 'comboRate' | 'dodgeRate', rarityMult: number): number {
  if (stat === 'critRate') return Math.round((2 + rarityMult * 1.2) * 10) / 10;
  if (stat === 'comboRate') return Math.round((3 + rarityMult * 1.5) * 10) / 10;
  if (stat === 'dodgeRate') return Math.round((2 + rarityMult * 1.1) * 10) / 10;
  return Math.round((0.1 + rarityMult * 0.06) * 100) / 100;
}

// Saves before v5: bring level-scaled percentage stats of old items down to the rarity-based values
export function normalizeItemRates(item: EquipmentItem): EquipmentItem {
  const info = SLOT_INFO[item.slot];
  const rarityMult = RARITY_CONFIG[item.rarity]?.statMultiplier ?? 1;
  const stats = { ...item.stats };
  const sec = info?.secondaryStat;
  if (sec === 'critRate' || sec === 'critDmg' || sec === 'comboRate' || sec === 'dodgeRate') {
    const target = rateStat(sec, rarityMult);
    const bonus = sec === 'critRate' && (item.rarity === 'legendary' || item.rarity === 'mythic') ? 4
      : sec === 'comboRate' && (item.rarity === 'legendary' || item.rarity === 'mythic') ? 5
      : sec === 'dodgeRate' && item.rarity === 'mythic' ? 5 : 0;
    stats[sec] = Math.min(stats[sec] || 0, target + bonus);
  }
  return { ...item, stats, powerScore: computePowerScore(stats) };
}

export function computePowerScore(s: StatModifiers): number {
  return Math.round(
    (s.hp || 0) * 0.4 +
    (s.atk || 0) * 3.5 +
    (s.def || 0) * 2.8 +
    (s.spd || 0) * 2.5 +
    (s.critRate || 0) * 8 +
    (s.critDmg || 0) * 80 +
    (s.comboRate || 0) * 7 +
    (s.dodgeRate || 0) * 7 +
    (s.lifesteal || 0) * 12 +
    (s.stamina || 0) * 0.5
  );
}

// Items generated before the 6-slot layout get the same flat-stat boost new drops have, so old saves keep their power
export function upgradeLegacyItem(item: EquipmentItem): EquipmentItem {
  const stats = { ...item.stats };
  (['hp', 'atk', 'def', 'spd', 'stamina'] as const).forEach((k) => {
    if (stats[k]) stats[k] = Math.round(stats[k]! * SLOT_COMPENSATION);
  });
  return { ...item, stats, powerScore: computePowerScore(stats) };
}

export function rollRarity(stageLevel: number = 1): Rarity {
  // Higher stages slightly boost rare drop chances
  const bonus = Math.min(stageLevel * 0.5, 25);
  const rand = Math.random() * 100;

  if (rand < (0.2 + bonus * 0.05)) return 'mythic';
  if (rand < (2.0 + bonus * 0.15)) return 'legendary';
  if (rand < (8.0 + bonus * 0.35)) return 'epic';
  if (rand < (20.0 + bonus * 0.6)) return 'rare';
  if (rand < (45.0 + bonus * 0.8)) return 'uncommon';
  return 'common';
}

export function generateEquipment(
  forcedSlot?: EquipmentSlot,
  forcedRarity?: Rarity,
  itemLevel: number = 1
): EquipmentItem {
  const slot = forcedSlot || ACTIVE_SLOTS[Math.floor(Math.random() * ACTIVE_SLOTS.length)];
  const rarity = forcedRarity || rollRarity(itemLevel);
  const info = SLOT_INFO[slot];
  const rarityConf = RARITY_CONFIG[rarity];

  const template = info.templates[Math.floor(Math.random() * info.templates.length)];
  const lvlScale = 1 + (itemLevel - 1) * 0.25;
  const mult = rarityConf.statMultiplier * lvlScale * SLOT_COMPENSATION;

  // Base raw stat pools
  const stats: Required<StatModifiers> = {
    hp: 0,
    atk: 0,
    def: 0,
    spd: 0,
    critRate: 0,
    critDmg: 0,
    comboRate: 0,
    dodgeRate: 0,
    lifesteal: 0,
    stamina: 0,
  };

  // Primary Stat calculation
  switch (info.primaryStat) {
    case 'hp':
      stats.hp = Math.round((30 + itemLevel * 10) * mult);
      break;
    case 'atk':
      stats.atk = Math.round((6 + itemLevel * 2.5) * mult);
      break;
    case 'def':
      stats.def = Math.round((4 + itemLevel * 1.8) * mult);
      break;
    case 'spd':
      stats.spd = Math.round((3 + itemLevel * 1.2) * mult);
      break;
    case 'stamina':
      stats.stamina = Math.round((20 + itemLevel * 6) * mult);
      break;
    case 'lifesteal':
      stats.lifesteal = Math.min(Math.round((2 + mult * 0.8) * 10) / 10, 25);
      break;
    default:
      stats.atk = Math.round((5 + itemLevel * 2) * mult);
  }

  // Secondary Stat calculation
  switch (info.secondaryStat) {
    case 'hp':
      stats.hp += Math.round((15 + itemLevel * 5) * mult);
      break;
    // Percentage stats grow with rarity only: scaling them with item level hit the caps by stage ~20
    case 'critRate':
      stats.critRate = rateStat('critRate', rarityConf.statMultiplier);
      break;
    case 'critDmg':
      stats.critDmg = rateStat('critDmg', rarityConf.statMultiplier);
      break;
    case 'comboRate':
      stats.comboRate = rateStat('comboRate', rarityConf.statMultiplier);
      break;
    case 'dodgeRate':
      stats.dodgeRate = rateStat('dodgeRate', rarityConf.statMultiplier);
      break;
    case 'def':
      stats.def += Math.round((2 + itemLevel * 1.2) * mult);
      break;
  }

  // Bonus affixes for Epic/Legendary/Mythic
  if (rarity === 'epic' || rarity === 'legendary' || rarity === 'mythic') {
    stats.hp += Math.round(20 * mult);
    stats.atk += Math.round(3 * mult);
  }
  if (rarity === 'legendary' || rarity === 'mythic') {
    stats.critRate = Math.min(stats.critRate + 4, 60);
    stats.comboRate = Math.min(stats.comboRate + 5, 70);
  }
  if (rarity === 'mythic') {
    stats.lifesteal = Math.min(stats.lifesteal + 3, 30);
    stats.dodgeRate = Math.min(stats.dodgeRate + 5, 50);
  }

  const powerScore = computePowerScore(stats);

  const baseSell = 15 + itemLevel * 10;
  const sellPrice = Math.round(baseSell * rarityConf.sellMultiplier);

  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: `${rarity === 'common' ? '' : rarity.toUpperCase() + ' '}${template.name}`,
    slot,
    rarity,
    level: itemLevel,
    stats,
    powerScore,
    sellPrice,
    iconName: info.icon,
    flavorText: template.flavor,
  };
}

export type SkillCategory = 'strike' | 'combo' | 'defense' | 'speed' | 'lifesteal' | 'rage';

export interface Synergy {
  category: SkillCategory;
  count: number;
  tier: 2 | 3;
  bonus: string;
}

// Equipping 2 or 3+ skills of the same family grants a set bonus.
// Two skills of one family give the set bonus; levelling them (levels adding up to 6+) upgrades it
export function skillSynergies(skills: { category?: string; level?: number }[]): Synergy[] {
  const counts: Partial<Record<SkillCategory, number>> = {};
  const levels: Partial<Record<SkillCategory, number>> = {};
  skills.forEach((s) => {
    if (!s.category) return;
    const c = s.category as SkillCategory;
    counts[c] = (counts[c] || 0) + 1;
    levels[c] = (levels[c] || 0) + (s.level || 1);
  });
  const out: Synergy[] = [];
  (Object.keys(counts) as SkillCategory[]).forEach((category) => {
    const count = counts[category] || 0;
    if (count < 2) return;
    const tier = count >= 3 || (levels[category] || 0) >= 6 ? 3 : 2;
    const bonus = category === 'combo' ? (tier === 3 ? '+9%' : '+4%')
      : category === 'lifesteal' ? (tier === 3 ? '+3.5%' : '+1.5%')
      : category === 'rage' ? (tier === 3 ? '+0.25x' : '+0.10x')
      : tier === 3 ? '+14%' : category === 'speed' ? '+8%' : '+6%';
    out.push({ category, count, tier, bonus });
  });
  return out;
}

export function calculateTotalStats(
  base: Required<StatModifiers>,
  gymBonus: Required<StatModifiers>,
  equipped: Record<EquipmentSlot, EquipmentItem | null>,
  skills: { statBonus: Partial<StatModifiers>; category?: string; level?: number }[]
): Required<StatModifiers> {
  const result: Required<StatModifiers> = {
    hp: base.hp + gymBonus.hp,
    atk: base.atk + gymBonus.atk,
    def: base.def + gymBonus.def,
    spd: base.spd + gymBonus.spd,
    critRate: base.critRate + gymBonus.critRate,
    critDmg: base.critDmg + gymBonus.critDmg,
    comboRate: base.comboRate + gymBonus.comboRate,
    dodgeRate: base.dodgeRate + gymBonus.dodgeRate,
    lifesteal: base.lifesteal + gymBonus.lifesteal,
    stamina: base.stamina + gymBonus.stamina,
  };

  // Add equipment stats
  Object.values(equipped).forEach((item) => {
    if (item) {
      result.hp += item.stats.hp;
      result.atk += item.stats.atk;
      result.def += item.stats.def;
      result.spd += item.stats.spd;
      result.critRate += item.stats.critRate;
      result.critDmg += item.stats.critDmg;
      result.comboRate += item.stats.comboRate;
      result.dodgeRate += item.stats.dodgeRate;
      result.lifesteal += item.stats.lifesteal;
      result.stamina += item.stats.stamina;
    }
  });

  // Add skill passive stat bonuses
  skills.forEach((skill) => {
    if (skill.statBonus) {
      if (skill.statBonus.hp) result.hp += skill.statBonus.hp;
      if (skill.statBonus.atk) result.atk += skill.statBonus.atk;
      if (skill.statBonus.def) result.def += skill.statBonus.def;
      if (skill.statBonus.spd) result.spd += skill.statBonus.spd;
      if (skill.statBonus.critRate) result.critRate += skill.statBonus.critRate;
      if (skill.statBonus.critDmg) result.critDmg += skill.statBonus.critDmg;
      if (skill.statBonus.comboRate) result.comboRate += skill.statBonus.comboRate;
      if (skill.statBonus.dodgeRate) result.dodgeRate += skill.statBonus.dodgeRate;
      if (skill.statBonus.lifesteal) result.lifesteal += skill.statBonus.lifesteal;
      if (skill.statBonus.stamina) result.stamina += skill.statBonus.stamina;
    }
  });

  // Skill-family set bonuses
  skillSynergies(skills).forEach(({ category, tier }) => {
    const t3 = tier === 3;
    if (category === 'strike') result.atk = Math.round(result.atk * (t3 ? 1.14 : 1.06));
    else if (category === 'combo') result.comboRate += t3 ? 9 : 4;
    else if (category === 'defense') { const m = t3 ? 1.14 : 1.06; result.hp = Math.round(result.hp * m); result.def = Math.round(result.def * m); }
    else if (category === 'speed') result.spd = Math.round(result.spd * (t3 ? 1.18 : 1.08));
    else if (category === 'lifesteal') result.lifesteal += t3 ? 3.5 : 1.5;
    else if (category === 'rage') result.critDmg += t3 ? 0.25 : 0.1;
  });

  // Clamp percentages to realistic caps
  result.critRate = Math.min(Math.round(result.critRate * 10) / 10, 85);
  result.comboRate = Math.min(Math.round(result.comboRate * 10) / 10, 80);
  result.dodgeRate = Math.min(Math.round(result.dodgeRate * 10) / 10, 75);
  result.lifesteal = Math.min(Math.round(result.lifesteal * 10) / 10, 50);

  return result;
}
