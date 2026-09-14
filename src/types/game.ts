export type EquipmentSlot = 
  | 'head'       // Bandana, Cap, Helmet, Headband
  | 'gloves'     // Tape, Boxing Gloves, MMA Gloves, Dragon Gauntlets
  | 'mouth'      // Mouthguard, Vapor Mask, Gold Teeth, Cyber Visor
  | 'robe'       // Street Hoodie, Boxer Robe, Fighter Jersey, Champion Cape
  | 'shorts'     // Street Shorts, Muay Thai Shorts, Golden Trunks
  | 'boots'      // Street Kicks, Boxing Boots, Golden Cleats, Cyber Striders
  | 'belt'       // Leather Strap, Silver Belt, Heavyweight Gold Belt
  | 'weapon'     // Street Soccer Ball, Iron Knuckles, Flaming Ball, Trophy
  | 'partner';   // Street Buddy, Coach Rocky, Hype-Girl Mia, Master Sensei

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface StatModifiers {
  hp?: number;
  atk?: number;
  def?: number;
  spd?: number;
  critRate?: number;    // percentage 0 - 100
  critDmg?: number;     // multiplier, default 1.5
  comboRate?: number;   // percentage 0 - 100
  dodgeRate?: number;   // percentage 0 - 100
  lifesteal?: number;   // percentage 0 - 100
  stamina?: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: Rarity;
  level: number;
  stats: Required<StatModifiers>;
  powerScore: number;
  sellPrice: number;
  iconName: string;
  flavorText?: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  quote?: string;
  rarity: Rarity;
  category: 'strike' | 'combo' | 'defense' | 'speed' | 'lifesteal' | 'rage';
  level: number;
  maxLevel: number;
  iconName: string;
  bonusText: string;
  statBonus: Partial<StatModifiers>;
  specialProc?: {
    type: 'double_strike' | 'bicycle_kick' | 'iron_chin' | 'shadow_dodge' | 'vampire' | 'execute' | 'counter_strike';
    chance: number;
    multiplier: number;
  };
}

export interface FighterStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  critRate: number;
  critDmg: number;
  comboRate: number;
  dodgeRate: number;
  lifesteal: number;
  stamina: number;
  powerScore: number;
}

export interface Fighter {
  id: string;
  name: string;
  title: string;
  avatarId?: string;
  titleId?: string;
  level: number;
  xp: number;
  maxXp: number;
  baseStats: FighterStats;
  stats: FighterStats;
  equipped: Record<EquipmentSlot, EquipmentItem | null>;
  equippedSkills: Skill[];
  avatarStyle: {
    skinTone: string;
    hairColor: string;
    hairStyle: 'short' | 'dreads' | 'spiky' | 'bald' | 'cap';
    bodyColor: string;
    gloveColor: string;
    shoeColor: string;
    auraEffect?: 'lightning' | 'flame' | 'neon' | 'divine';
    ballColor?: string;
  };
}

export type ArenaEnvironment = 'alley' | 'cage' | 'subway' | 'neon_club' | 'pro_ring' | 'mega_stadium';

export interface Stage {
  id: string;
  world: number;
  subStage: number;
  displayStage: string; // e.g. "Stage 1-4"
  name: string;
  environment: ArenaEnvironment;
  isBoss: boolean;
  opponent: {
    name: string;
    title: string;
    level: number;
    stats: FighterStats;
    avatarStyle: Fighter['avatarStyle'];
    dialogue: string;
  };
  coinReward: number;
  gemReward: number;
  xpReward: number;
}

export interface GymTraining {
  id: string;
  name: string;
  description: string;
  targetStat: keyof StatModifiers;
  statGain: number;
  level: number;
  cost: number;
  iconName: string;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  type: 'damage' | 'crit' | 'dodge' | 'combo' | 'heal' | 'skill';
  createdAt: number;
  duration: number;
}

export interface BattleAction {
  attacker: 'player' | 'opponent';
  type: 'attack' | 'crit' | 'combo' | 'dodge' | 'skill' | 'rage_strike';
  damage: number;
  isCrit: boolean;
  isDodge: boolean;
  isCombo: boolean;
  lifestealHeal: number;
  skillName?: string;
  timestamp: number;
}

export type TabType = 'gear' | 'skills' | 'gym' | 'shop' | 'arena' | 'profile';

