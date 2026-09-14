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
    label: 'Headgear',
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
    label: 'Mouth / Mask',
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
    label: 'Robe / Jersey',
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
    label: 'Boots / Cleats',
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
    label: 'Ball / Weapon',
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
    label: 'Coach / Hype-Girl',
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
  const slots = Object.keys(SLOT_INFO) as EquipmentSlot[];
  const slot = forcedSlot || slots[Math.floor(Math.random() * slots.length)];
  const rarity = forcedRarity || rollRarity(itemLevel);
  const info = SLOT_INFO[slot];
  const rarityConf = RARITY_CONFIG[rarity];

  const template = info.templates[Math.floor(Math.random() * info.templates.length)];
  const lvlScale = 1 + (itemLevel - 1) * 0.25;
  const mult = rarityConf.statMultiplier * lvlScale;

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
    case 'critRate':
      stats.critRate = Math.min(Math.round((2 + mult * 1.2) * 10) / 10, 50);
      break;
    case 'critDmg':
      stats.critDmg = Math.round((0.15 * mult) * 100) / 100;
      break;
    case 'comboRate':
      stats.comboRate = Math.min(Math.round((3 + mult * 1.5) * 10) / 10, 60);
      break;
    case 'dodgeRate':
      stats.dodgeRate = Math.min(Math.round((2 + mult * 1.1) * 10) / 10, 45);
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

  // Calculate Power Score
  const powerScore = Math.round(
    stats.hp * 0.4 +
    stats.atk * 3.5 +
    stats.def * 2.8 +
    stats.spd * 2.5 +
    stats.critRate * 8 +
    stats.critDmg * 80 +
    stats.comboRate * 7 +
    stats.dodgeRate * 7 +
    stats.lifesteal * 12 +
    stats.stamina * 0.5
  );

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

export function calculateTotalStats(
  base: Required<StatModifiers>,
  gymBonus: Required<StatModifiers>,
  equipped: Record<EquipmentSlot, EquipmentItem | null>,
  skills: { statBonus: Partial<StatModifiers> }[]
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

  // Clamp percentages to realistic caps
  result.critRate = Math.min(Math.round(result.critRate * 10) / 10, 85);
  result.comboRate = Math.min(Math.round(result.comboRate * 10) / 10, 80);
  result.dodgeRate = Math.min(Math.round(result.dodgeRate * 10) / 10, 75);
  result.lifesteal = Math.min(Math.round(result.lifesteal * 10) / 10, 50);

  return result;
}
