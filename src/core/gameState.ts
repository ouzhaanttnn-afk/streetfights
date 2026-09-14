import { EquipmentItem, EquipmentSlot, Fighter, FighterStats, GymTraining, Rarity, Skill, Stage, TabType } from '../types/game';
import { calculateTotalStats, generateEquipment } from './lootGenerator';
import { getStageData } from './stageDatabase';
import { getRandomSkill, SKILL_DATABASE } from './skillDatabase';
import { COSMETICS_LIST, CosmeticItem } from './cosmeticsData';
import { Language } from '../i18n/translations';
import { soundFx } from './audio';

const STORAGE_KEY = 'street_striker_rpg_save_v2';

export interface AdOffer {
  type: 'free_gems' | 'double_damage' | 'mystery_chest' | 'revive';
  title: string;
  rewardDesc: string;
}

export interface GameStateData {
  lang: Language;
  coins: number;
  gems: number;
  trophies: number;
  playerLevel: number;
  playerXp: number;
  playerMaxXp: number;
  currentWorld: number;
  currentSubStage: number;
  highestWorld: number;
  highestSubStage: number;
  playerFighter: Fighter;
  gymTrainings: GymTraining[];
  inventory: EquipmentItem[];
  maxInventorySlots: number;
  pendingLootDrop: EquipmentItem | null;
  pendingSkillOffer: Skill | null;
  activeTab: TabType;
  autoBattle: boolean;
  battleSpeed: 1 | 2 | 4;
  soundEnabled: boolean;
  autoSellRarity: Rarity | 'none';
  totalFightsWon: number;
  totalDamageDealt: number;
  bossDefeatedCount: number;

  // Cosmetics
  unlockedCosmetics: string[];
  equippedOutfit: string;
  equippedHair: string;
  equippedAura: string;
  equippedBall: string;

  // Rewarded Ads & Timed Buffs
  doubleDamageUntil: number;
  doubleCoinsUntil: number;
  activeAdModal: AdOffer | null;
}

const INITIAL_GYM: GymTraining[] = [
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

const INITIAL_BASE_STATS: FighterStats = {
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

function createInitialPlayer(): Fighter {
  const equipped: Record<EquipmentSlot, EquipmentItem | null> = {
    head: generateEquipment('head', 'common', 1),
    gloves: generateEquipment('gloves', 'common', 1),
    mouth: null,
    robe: generateEquipment('robe', 'common', 1),
    shorts: generateEquipment('shorts', 'common', 1),
    boots: generateEquipment('boots', 'common', 1),
    belt: null,
    weapon: generateEquipment('weapon', 'common', 1),
    partner: null,
  };

  const starterSkill = { ...SKILL_DATABASE[0] }; // Flurry Master

  const stats = calculateTotalStats(
    INITIAL_BASE_STATS,
    { hp: 0, atk: 0, def: 0, spd: 0, critRate: 0, critDmg: 0, comboRate: 0, dodgeRate: 0, lifesteal: 0, stamina: 0 },
    equipped,
    [starterSkill]
  );

  const powerScore = Math.round(
    stats.hp * 0.4 +
    stats.atk * 3.5 +
    stats.def * 2.8 +
    stats.spd * 2.5 +
    stats.critRate * 8 +
    stats.critDmg * 80 +
    stats.comboRate * 7 +
    stats.dodgeRate * 7 +
    stats.lifesteal * 12
  );

  return {
    id: 'player_1',
    name: 'Leo "Thunder" Cruz',
    title: 'Street Contender',
    level: 1,
    xp: 0,
    maxXp: 100,
    baseStats: { ...INITIAL_BASE_STATS },
    stats: { ...stats, powerScore, maxHp: stats.hp },
    equipped,
    equippedSkills: [starterSkill],
    avatarStyle: {
      skinTone: '#e0ac69',
      hairColor: '#eab308',
      hairStyle: 'spiky',
      bodyColor: '#2563eb',
      gloveColor: '#ef4444',
      shoeColor: '#1e293b',
      auraEffect: undefined,
      ballColor: '#ffffff',
    },
  };
}

class GameManager {
  private state: GameStateData;
  private listeners: Set<(state: GameStateData) => void> = new Set();

  constructor() {
    this.state = this.loadState();
    this.applyCosmeticsToPlayer();
    this.recalculatePlayerStats();
  }

  private loadState(): GameStateData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          lang: parsed.lang || 'tr',
          unlockedCosmetics: parsed.unlockedCosmetics || ['outfit_street', 'hair_spiky_yellow', 'aura_none', 'ball_street'],
          equippedOutfit: parsed.equippedOutfit || 'outfit_street',
          equippedHair: parsed.equippedHair || 'hair_spiky_yellow',
          equippedAura: parsed.equippedAura || 'aura_none',
          equippedBall: parsed.equippedBall || 'ball_street',
          doubleDamageUntil: parsed.doubleDamageUntil || 0,
          doubleCoinsUntil: parsed.doubleCoinsUntil || 0,
          activeAdModal: null,
          pendingLootDrop: parsed.pendingLootDrop || null,
          pendingSkillOffer: parsed.pendingSkillOffer || null,
          activeTab: parsed.activeTab || 'gear',
        };
      }
    } catch {
      // Fallback
    }

    return {
      lang: 'tr',
      coins: 200,
      gems: 30,
      trophies: 0,
      playerLevel: 1,
      playerXp: 0,
      playerMaxXp: 100,
      currentWorld: 1,
      currentSubStage: 1,
      highestWorld: 1,
      highestSubStage: 1,
      playerFighter: createInitialPlayer(),
      gymTrainings: INITIAL_GYM,
      inventory: [],
      maxInventorySlots: 20,
      pendingLootDrop: null,
      pendingSkillOffer: null,
      activeTab: 'gear',
      autoBattle: true,
      battleSpeed: 1,
      soundEnabled: true,
      autoSellRarity: 'none',
      totalFightsWon: 0,
      totalDamageDealt: 0,
      bossDefeatedCount: 0,
      unlockedCosmetics: ['outfit_street', 'hair_spiky_yellow', 'aura_none', 'ball_street'],
      equippedOutfit: 'outfit_street',
      equippedHair: 'hair_spiky_yellow',
      equippedAura: 'aura_none',
      equippedBall: 'ball_street',
      doubleDamageUntil: 0,
      doubleCoinsUntil: 0,
      activeAdModal: null,
    };
  }

  public saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Storage error ignored
    }
  }

  public getState(): GameStateData {
    return this.state;
  }

  public subscribe(listener: (state: GameStateData) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.saveState();
    this.listeners.forEach((fn) => fn(this.state));
  }

  public setLanguage(lang: Language) {
    this.state.lang = lang;
    this.notify();
  }

  // COSMETICS SYSTEM
  public applyCosmeticsToPlayer() {
    const outfit = COSMETICS_LIST.find((c) => c.id === this.state.equippedOutfit);
    const hair = COSMETICS_LIST.find((c) => c.id === this.state.equippedHair);
    const aura = COSMETICS_LIST.find((c) => c.id === this.state.equippedAura);
    const ball = COSMETICS_LIST.find((c) => c.id === this.state.equippedBall);

    if (outfit?.visualData.color) {
      this.state.playerFighter.avatarStyle.bodyColor = outfit.visualData.color;
    }
    if (hair?.visualData.color) {
      this.state.playerFighter.avatarStyle.hairColor = hair.visualData.color;
      if (hair.visualData.style) {
        this.state.playerFighter.avatarStyle.hairStyle = hair.visualData.style as any;
      }
    }
    this.state.playerFighter.avatarStyle.auraEffect = aura?.visualData.auraEffect;
    this.state.playerFighter.avatarStyle.ballColor = ball?.visualData.ballColor || '#ffffff';
  }

  public buyCosmetic(cosmetic: CosmeticItem): boolean {
    if (this.state.unlockedCosmetics.includes(cosmetic.id)) return false;

    if (cosmetic.priceGems > 0) {
      if (this.state.gems < cosmetic.priceGems) return false;
      this.state.gems -= cosmetic.priceGems;
    } else if (cosmetic.priceCoins > 0) {
      if (this.state.coins < cosmetic.priceCoins) return false;
      this.state.coins -= cosmetic.priceCoins;
    }

    this.state.unlockedCosmetics.push(cosmetic.id);
    this.equipCosmetic(cosmetic);
    soundFx.playEquip();
    this.notify();
    return true;
  }

  public equipCosmetic(cosmetic: CosmeticItem) {
    if (!this.state.unlockedCosmetics.includes(cosmetic.id)) return;

    if (cosmetic.category === 'outfit') this.state.equippedOutfit = cosmetic.id;
    if (cosmetic.category === 'hair') this.state.equippedHair = cosmetic.id;
    if (cosmetic.category === 'aura') this.state.equippedAura = cosmetic.id;
    if (cosmetic.category === 'ball') this.state.equippedBall = cosmetic.id;

    this.applyCosmeticsToPlayer();
    soundFx.playEquip();
    this.notify();
  }

  // REWARDED ADS SYSTEM
  public openRewardedAd(offer: AdOffer) {
    this.state.activeAdModal = offer;
    this.notify();
  }

  public closeRewardedAd() {
    this.state.activeAdModal = null;
    this.notify();
  }

  public claimRewardedAdReward() {
    if (!this.state.activeAdModal) return;
    const type = this.state.activeAdModal.type;

    if (type === 'free_gems') {
      this.state.gems += 50;
      this.state.coins += 1000;
      soundFx.playVictoryFanfare();
    } else if (type === 'double_damage') {
      this.state.doubleDamageUntil = Date.now() + 10 * 60 * 1000; // 10 minutes
      soundFx.playVictoryFanfare();
    } else if (type === 'mystery_chest') {
      const stageLvl = (this.state.currentWorld - 1) * 10 + this.state.currentSubStage;
      const rarities: Rarity[] = ['rare', 'epic', 'legendary', 'mythic'];
      const pickedRarity = rarities[Math.floor(Math.random() * rarities.length)];
      this.state.pendingLootDrop = generateEquipment(undefined, pickedRarity, stageLvl);
      soundFx.playLootDrop();
    }

    this.state.activeAdModal = null;
    this.recalculatePlayerStats();
    this.notify();
  }

  public recalculatePlayerStats() {
    const gymBonus: Required<FighterStats> = {
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
      maxHp: 0,
      powerScore: 0,
    };

    this.state.gymTrainings.forEach((t) => {
      const bonusVal = (t.level - 1) * t.statGain;
      if (t.targetStat === 'hp') gymBonus.hp += bonusVal;
      if (t.targetStat === 'atk') gymBonus.atk += bonusVal;
      if (t.targetStat === 'def') gymBonus.def += bonusVal;
      if (t.targetStat === 'spd') gymBonus.spd += bonusVal;
      if (t.targetStat === 'critRate') gymBonus.critRate += bonusVal;
      if (t.targetStat === 'dodgeRate') gymBonus.dodgeRate += bonusVal;
    });

    const calculated = calculateTotalStats(
      this.state.playerFighter.baseStats,
      gymBonus,
      this.state.playerFighter.equipped,
      this.state.playerFighter.equippedSkills
    );

    // Apply timed active 2x damage buff from rewarded video
    const isDoubleDamageActive = Date.now() < this.state.doubleDamageUntil;
    if (isDoubleDamageActive) {
      calculated.atk = Math.round(calculated.atk * 2.0);
    }

    const powerScore = Math.round(
      calculated.hp * 0.4 +
      calculated.atk * 3.5 +
      calculated.def * 2.8 +
      calculated.spd * 2.5 +
      calculated.critRate * 8 +
      calculated.critDmg * 80 +
      calculated.comboRate * 7 +
      calculated.dodgeRate * 7 +
      calculated.lifesteal * 12 +
      calculated.stamina * 0.5
    );

    this.state.playerFighter.stats = {
      ...calculated,
      maxHp: calculated.hp,
      powerScore,
    };
  }

  // BATTLE REWARDS & PROGRESSION
  public onStageVictory(stage: Stage) {
    const isDoubleCoins = Date.now() < this.state.doubleCoinsUntil;
    const coinMult = isDoubleCoins ? 2.0 : 1.0;

    this.state.coins += Math.round(stage.coinReward * coinMult);
    this.state.gems += stage.gemReward;
    this.state.trophies += stage.isBoss ? 25 : 5;
    this.state.totalFightsWon += 1;
    if (stage.isBoss) this.state.bossDefeatedCount += 1;

    // Add XP
    this.addPlayerXp(stage.xpReward);

    // Progress Stage
    let nextSub = this.state.currentSubStage + 1;
    let nextWorld = this.state.currentWorld;

    if (nextSub > 10) {
      nextSub = 1;
      nextWorld += 1;
    }

    this.state.currentWorld = nextWorld;
    this.state.currentSubStage = nextSub;

    // Track highest unlocked
    const currentTotal = (nextWorld - 1) * 10 + nextSub;
    const highestTotal = (this.state.highestWorld - 1) * 10 + this.state.highestSubStage;
    if (currentTotal > highestTotal) {
      this.state.highestWorld = nextWorld;
      this.state.highestSubStage = nextSub;
    }

    // Roll Equipment Loot Drop (High chance)
    const stageLvl = (stage.world - 1) * 10 + stage.subStage;
    const dropChance = stage.isBoss ? 1.0 : 0.85;

    if (Math.random() <= dropChance && !this.state.pendingLootDrop) {
      const drop = generateEquipment(undefined, undefined, stageLvl);
      
      // Check auto-sell filter
      if (this.shouldAutoSell(drop.rarity)) {
        this.state.coins += drop.sellPrice;
      } else {
        this.state.pendingLootDrop = drop;
        soundFx.playLootDrop();
      }
    }

    // Roll Roguelite Skill every 3 stages or after boss
    if (stage.subStage % 3 === 0 || stage.isBoss) {
      if (!this.state.pendingSkillOffer && Math.random() < 0.8) {
        this.state.pendingSkillOffer = getRandomSkill();
      }
    }

    this.recalculatePlayerStats();
    this.notify();
  }

  private shouldAutoSell(rarity: Rarity): boolean {
    const ranks: Record<Rarity, number> = {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 5,
      mythic: 6,
    };
    if (this.state.autoSellRarity === 'none') return false;
    return ranks[rarity] <= ranks[this.state.autoSellRarity];
  }

  public addPlayerXp(amount: number) {
    this.state.playerXp += amount;
    while (this.state.playerXp >= this.state.playerMaxXp) {
      this.state.playerXp -= this.state.playerMaxXp;
      this.state.playerLevel += 1;
      this.state.playerMaxXp = Math.round(this.state.playerMaxXp * 1.35);

      this.state.playerFighter.baseStats.hp += 20;
      this.state.playerFighter.baseStats.atk += 3;
      this.state.playerFighter.baseStats.def += 2;
      this.state.playerFighter.baseStats.spd += 1;
      this.state.playerFighter.level = this.state.playerLevel;
      soundFx.playVictoryFanfare();
    }
  }

  // EQUIPMENT ACTIONS
  public equipItem(item: EquipmentItem) {
    const currentEquipped = this.state.playerFighter.equipped[item.slot];
    this.state.playerFighter.equipped[item.slot] = item;
    this.state.inventory = this.state.inventory.filter((i) => i.id !== item.id);

    if (currentEquipped) {
      if (this.state.inventory.length < this.state.maxInventorySlots) {
        this.state.inventory.push(currentEquipped);
      } else {
        this.state.coins += currentEquipped.sellPrice;
      }
    }

    if (this.state.pendingLootDrop?.id === item.id) {
      this.state.pendingLootDrop = null;
    }

    soundFx.playEquip();
    this.recalculatePlayerStats();
    this.notify();
  }

  public sellItem(item: EquipmentItem) {
    this.state.coins += item.sellPrice;
    this.state.inventory = this.state.inventory.filter((i) => i.id !== item.id);
    if (this.state.pendingLootDrop?.id === item.id) {
      this.state.pendingLootDrop = null;
    }
    soundFx.playCoin();
    this.notify();
  }

  public unequipItem(slot: EquipmentSlot) {
    const item = this.state.playerFighter.equipped[slot];
    if (!item) return;

    if (this.state.inventory.length < this.state.maxInventorySlots) {
      this.state.inventory.push(item);
      this.state.playerFighter.equipped[slot] = null;
    } else {
      this.state.coins += item.sellPrice;
      this.state.playerFighter.equipped[slot] = null;
    }

    this.recalculatePlayerStats();
    this.notify();
  }

  public dismissLootDrop() {
    this.state.pendingLootDrop = null;
    this.notify();
  }

  // SKILL ACTIONS
  public claimSkill(skill: Skill) {
    const existingIdx = this.state.playerFighter.equippedSkills.findIndex((s) => s.id === skill.id);
    if (existingIdx >= 0) {
      const existing = this.state.playerFighter.equippedSkills[existingIdx];
      if (existing.level < existing.maxLevel) {
        existing.level += 1;
        if (existing.statBonus.atk) existing.statBonus.atk = Math.round(existing.statBonus.atk * 1.5);
        if (existing.statBonus.hp) existing.statBonus.hp = Math.round(existing.statBonus.hp * 1.5);
        if (existing.statBonus.def) existing.statBonus.def = Math.round(existing.statBonus.def * 1.5);
        if (existing.statBonus.spd) existing.statBonus.spd = Math.round(existing.statBonus.spd * 1.5);
        if (existing.statBonus.critRate) existing.statBonus.critRate = Math.min(existing.statBonus.critRate + 3, 50);
        if (existing.statBonus.comboRate) existing.statBonus.comboRate = Math.min(existing.statBonus.comboRate + 3, 50);
        if (existing.statBonus.dodgeRate) existing.statBonus.dodgeRate = Math.min(existing.statBonus.dodgeRate + 3, 40);
        if (existing.statBonus.lifesteal) existing.statBonus.lifesteal = Math.min(existing.statBonus.lifesteal + 2.5, 30);
      }
    } else {
      if (this.state.playerFighter.equippedSkills.length < 6) {
        this.state.playerFighter.equippedSkills.push({ ...skill });
      } else {
        this.state.playerFighter.equippedSkills.shift();
        this.state.playerFighter.equippedSkills.push({ ...skill });
      }
    }

    this.state.pendingSkillOffer = null;
    soundFx.playEquip();
    this.recalculatePlayerStats();
    this.notify();
  }

  public rerollSkill(): boolean {
    const cost = 25;
    if (this.state.coins < cost) return false;

    this.state.coins -= cost;
    this.state.pendingSkillOffer = getRandomSkill();
    soundFx.playCoin();
    this.notify();
    return true;
  }

  public dismissSkillOffer() {
    this.state.pendingSkillOffer = null;
    this.notify();
  }

  // GYM WORKOUT UPGRADES
  public trainGym(trainingId: string): boolean {
    const training = this.state.gymTrainings.find((t) => t.id === trainingId);
    if (!training) return false;
    if (this.state.coins < training.cost) return false;

    this.state.coins -= training.cost;
    training.level += 1;
    training.cost = Math.round(training.cost * 1.35);

    soundFx.playGymTap();
    this.recalculatePlayerStats();
    this.notify();
    return true;
  }

  // STAGE SELECT
  public selectStage(world: number, subStage: number) {
    this.state.currentWorld = world;
    this.state.currentSubStage = subStage;
    this.notify();
  }

  public setActiveTab(tab: TabType) {
    this.state.activeTab = tab;
    this.notify();
  }

  public toggleAutoBattle() {
    this.state.autoBattle = !this.state.autoBattle;
    this.notify();
  }

  public cycleBattleSpeed() {
    if (this.state.battleSpeed === 1) this.state.battleSpeed = 2;
    else if (this.state.battleSpeed === 2) this.state.battleSpeed = 4;
    else this.state.battleSpeed = 1;
    this.notify();
  }

  public toggleSound() {
    this.state.soundEnabled = !this.state.soundEnabled;
    soundFx.soundEnabled = this.state.soundEnabled;
    this.notify();
  }

  public setAutoSellRarity(rarity: Rarity | 'none') {
    this.state.autoSellRarity = rarity;
    this.notify();
  }

  public cheatAddCoins(amount: number = 1000) {
    this.state.coins += amount;
    this.notify();
  }

  public cheatAddGems(amount: number = 100) {
    this.state.gems += amount;
    this.notify();
  }

  public cheatDropRandomGear(rarity?: Rarity) {
    const stageLvl = (this.state.currentWorld - 1) * 10 + this.state.currentSubStage;
    this.state.pendingLootDrop = generateEquipment(undefined, rarity, stageLvl);
    this.notify();
  }

  public cheatUnlockAllStages() {
    this.state.highestWorld = 5;
    this.state.highestSubStage = 10;
    this.notify();
  }

  public resetGame() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = {
      lang: 'tr',
      coins: 200,
      gems: 30,
      trophies: 0,
      playerLevel: 1,
      playerXp: 0,
      playerMaxXp: 100,
      currentWorld: 1,
      currentSubStage: 1,
      highestWorld: 1,
      highestSubStage: 1,
      playerFighter: createInitialPlayer(),
      gymTrainings: INITIAL_GYM,
      inventory: [],
      maxInventorySlots: 20,
      pendingLootDrop: null,
      pendingSkillOffer: null,
      activeTab: 'gear',
      autoBattle: true,
      battleSpeed: 1,
      soundEnabled: true,
      autoSellRarity: 'none',
      totalFightsWon: 0,
      totalDamageDealt: 0,
      bossDefeatedCount: 0,
      unlockedCosmetics: ['outfit_street', 'hair_spiky_yellow', 'aura_none', 'ball_street'],
      equippedOutfit: 'outfit_street',
      equippedHair: 'hair_spiky_yellow',
      equippedAura: 'aura_none',
      equippedBall: 'ball_street',
      doubleDamageUntil: 0,
      doubleCoinsUntil: 0,
      activeAdModal: null,
    };
    this.applyCosmeticsToPlayer();
    this.recalculatePlayerStats();
    this.notify();
  }

  public getCurrentStage(): Stage {
    return getStageData(this.state.currentWorld, this.state.currentSubStage);
  }
}

export const gameManager = new GameManager();
