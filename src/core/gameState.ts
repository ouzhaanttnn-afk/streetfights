import { EquipmentItem, EquipmentSlot, Fighter, FighterStats, GymTraining, Rarity, Skill, Stage, TabType } from '../types/game';
import { ACTIVE_SLOTS, calculateTotalStats, generateEquipment, normalizeItemRates, upgradeLegacyItem } from './lootGenerator';
import { pushToast } from './toast';
import { GYM_TEMPLATES, INITIAL_BASE_STATS, applyGymPercent, gymCostAt, gymGainAt, gymStatCapped } from './progression';
import { cancelReminders, OFFLINE_CAP_MINUTES, requestNotificationPermission, scheduleReminders } from './notifications';
import { ui } from '../i18n/ui';
import { fightOdds } from './combat';
import { skillName } from '../i18n/content-helpers';
import { getStageData } from './stageDatabase';
import { getRandomSkill, SKILL_DATABASE } from './skillDatabase';
import { COSMETICS_LIST, CosmeticItem } from './cosmeticsData';
import { Language } from '../i18n/translations';
import { soundFx } from './audio';
import { haptics } from './haptics';
import { adMobManager } from './admob';
import { battleRig, QualityLevel } from '../game/battleRig';
import { ACHIEVEMENTS } from './achievements';

const STORAGE_KEY = 'street_striker_rpg_save_v2';
const SAVE_VERSION = 5; // v4: 6 equipment slots, v5: rarity-based percentage stats on items
const BUFF_DURATION_MS = 10 * 60 * 1000;
const LOSSES_BEFORE_RETREAT = 3;
const BOSS_LOSSES_BEFORE_RETREAT = 2;

export type QuestId = 'win_fights' | 'beat_boss' | 'train_gym' | 'use_super';

export interface DailyQuest {
  id: QuestId;
  target: number;
  progress: number;
  claimed: boolean;
  gems: number;
  coins: number;
}

const QUEST_TEMPLATES: Omit<DailyQuest, 'progress' | 'claimed'>[] = [
  { id: 'win_fights', target: 8, gems: 10, coins: 400 },
  { id: 'beat_boss', target: 1, gems: 20, coins: 600 },
  { id: 'train_gym', target: 3, gems: 8, coins: 300 },
  { id: 'use_super', target: 5, gems: 12, coins: 500 },
];

const SUPPORTED_LANGS: Language[] = ['tr', 'en', 'es', 'de', 'fr', 'pt', 'it', 'ja'];

// First launch follows the device language (App Review and most players are not Turkish); saved games keep their choice.
function detectLanguage(): Language {
  const code = (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en').slice(0, 2).toLowerCase() as Language;
  return SUPPORTED_LANGS.includes(code) ? code : 'en';
}

function createDailyQuests(): DailyQuest[] {
  return QUEST_TEMPLATES.map((q) => ({ ...q, progress: 0, claimed: false }));
}

function dateKey(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function cloneSkill(skill: Skill): Skill {
  return {
    ...skill,
    statBonus: { ...skill.statBonus },
    specialProc: skill.specialProc ? { ...skill.specialProc } : undefined,
  };
}

export interface AdOffer {
  type: 'free_gems' | 'double_damage' | 'double_coins' | 'revive' | 'offline_double' | 'boss_double' | 'daily_double' | 'gym_free';
  title: string;
  rewardDesc: string;
  // daily_double: which login day; gym_free: which training
  day?: number;
  trainingId?: string;
}

// Quest coin rewards grow with progress so they stay worth claiming
export function questCoins(base: number, highestStage: number): number {
  return Math.round(base * (1 + Math.max(0, highestStage - 1) / 6));
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
  pendingSkillReplacement: Skill | null;
  activeTab: TabType;
  // Sub-pages of the merged tabs: Fighter = gear + skills, Arena = stages + quests/achievements
  fighterView: 'gear' | 'skills';
  arenaView: 'stages' | 'quests';
  isProfileOpen: boolean;
  autoBattle: boolean;
  battleSpeed: 1 | 2 | 4;
  soundEnabled: boolean;
  autoSellRarity: Rarity | 'none';
  totalFightsWon: number;
  totalDamageDealt: number;
  bossDefeatedCount: number;

  // Daily Login & Retention
  dailyLoginStreak: number;
  lastDailyLoginDate: string;
  claimedDailyDays: number[];
  isDailyLoginOpen: boolean;


  // AFK Offline Gold
  lastOfflineTimestamp: number;
  isOfflineRewardOpen: boolean;
  offlineGoldAccumulated: number;
  offlineMinutesAccumulated: number;

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

  // Mobile QoL & Progression
  saveVersion: number;
  quality: QualityLevel;
  reducedMotion: boolean;
  tutorialStep: number;
  claimedAchievements: string[];
  // Auto daily popup shown on this date (manual opening via the gift button is always possible)
  dailyPopupShownDate: string;
  hapticsEnabled: boolean;
  // Local reminders (vault full, daily reward). notifAsked: the in-game soft ask was answered
  notificationsEnabled: boolean;
  notifAsked: boolean;
  // Optional rewarded ad after a boss win: get the boss payout again
  bossBonus: { coins: number; gems: number; expiresAt: number } | null;
  // Rerolls used on the current skill offer (first one is free)
  offerRerolls: number;
  // After a loss on a hard stage: optional 2x damage ad offer (with a cooldown)
  buffOffer: { expiresAt: number } | null;
  lastBuffOfferAt: number;
  // Gym: one free level for an ad, with a cooldown
  gymFreeReadyAt: number;
  // Daily caps for shop ads: { date, counts per offer }
  adCaps: { date: string; counts: Record<string, number> };
  autoAdvance: boolean;
  lossStreak: number;
  battleNonce: number;
  dailyQuests: DailyQuest[];
  questDate: string;
}





function createInitialPlayer(): Fighter {
  const equipped: Record<EquipmentSlot, EquipmentItem | null> = {
    head: generateEquipment('head', 'common', 1),
    gloves: generateEquipment('gloves', 'common', 1),
    mouth: null,
    robe: generateEquipment('robe', 'common', 1),
    shorts: generateEquipment('shorts', 'common', 1),
    boots: generateEquipment('boots', 'common', 1),
    belt: null,
    weapon: null,
    partner: null,
  };

  const starterSkill = cloneSkill(SKILL_DATABASE[0]); // Flurry Master

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

function createDefaultState(): GameStateData {
  return {
    lang: detectLanguage(),
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
    gymTrainings: GYM_TEMPLATES.map((g) => ({ ...g })),
    inventory: [],
    maxInventorySlots: 20,
    pendingLootDrop: null,
    pendingSkillOffer: null,
    pendingSkillReplacement: null,
    activeTab: 'gear',
    fighterView: 'gear',
    arenaView: 'stages',
    isProfileOpen: false,
    autoBattle: true,
    battleSpeed: 1,
    soundEnabled: true,
    autoSellRarity: 'none',
    totalFightsWon: 0,
    totalDamageDealt: 0,
    bossDefeatedCount: 0,
    dailyLoginStreak: 0,
    lastDailyLoginDate: '',
    claimedDailyDays: [],
    isDailyLoginOpen: false,
    lastOfflineTimestamp: Date.now(),
    isOfflineRewardOpen: false,
    offlineGoldAccumulated: 0,
    offlineMinutesAccumulated: 0,
    unlockedCosmetics: ['outfit_street', 'hair_spiky_yellow', 'aura_none', 'ball_street'],
    equippedOutfit: 'outfit_street',
    equippedHair: 'hair_spiky_yellow',
    equippedAura: 'aura_none',
    equippedBall: 'ball_street',
    doubleDamageUntil: 0,
    doubleCoinsUntil: 0,
    activeAdModal: null,
    saveVersion: SAVE_VERSION,
    tutorialStep: 0,
    claimedAchievements: [],
    dailyPopupShownDate: '',
    quality: 'medium',
    reducedMotion: typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    hapticsEnabled: true,
    notificationsEnabled: false,
    notifAsked: false,
    bossBonus: null,
    offerRerolls: 0,
    buffOffer: null,
    lastBuffOfferAt: 0,
    gymFreeReadyAt: 0,
    adCaps: { date: '', counts: {} },
    autoAdvance: true,
    lossStreak: 0,
    battleNonce: 0,
    dailyQuests: createDailyQuests(),
    questDate: dateKey(),
  };
}

// Repairs saves with missing or wrong-typed parts so one bad field never bricks the game
function sanitizeSave(raw: unknown): Record<string, any> {
  const p: Record<string, any> = raw && typeof raw === 'object' ? { ...(raw as Record<string, any>) } : {};
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x) => x !== null && x !== undefined) : undefined);
  const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? v : undefined);
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
  for (const k of ['inventory', 'claimedDailyDays', 'unlockedCosmetics', 'claimedAchievements', 'gymTrainings']) {
    const a = arr(p[k]);
    if (a === undefined) delete p[k];
    else p[k] = a;
  }
  if (Array.isArray(p.inventory)) p.inventory = p.inventory.filter((i: any) => i && typeof i === 'object' && typeof i.slot === 'string' && i.stats);
  if (Array.isArray(p.dailyQuests)) p.dailyQuests = p.dailyQuests.filter((q: any) => q && typeof q === 'object' && typeof q.id === 'string');
  else delete p.dailyQuests;
  for (const k of ['coins', 'gems', 'playerLevel', 'playerXp', 'playerMaxXp', 'currentWorld', 'currentSubStage', 'highestWorld', 'highestSubStage', 'totalFightsWon']) {
    if (p[k] !== undefined && num(p[k]) === undefined) delete p[k];
  }
  if (typeof p.coins === 'number' && p.coins < 0) p.coins = 0;
  if (typeof p.gems === 'number' && p.gems < 0) p.gems = 0;
  const f = obj(p.playerFighter);
  if (!f) delete p.playerFighter;
  else {
    const fighter: Record<string, any> = { ...f };
    if (!obj(fighter.equipped)) delete fighter.equipped;
    else fighter.equipped = Object.fromEntries(Object.entries(fighter.equipped).map(([k, v]) => [k, obj(v) && (v as any).stats ? v : null]));
    if (!Array.isArray(fighter.equippedSkills)) delete fighter.equippedSkills;
    else fighter.equippedSkills = fighter.equippedSkills.filter((s: any) => s && typeof s === 'object' && s.id);
    if (!obj(fighter.baseStats)) delete fighter.baseStats;
    p.playerFighter = fighter;
  }
  if (p.pendingLootDrop && !(obj(p.pendingLootDrop) && p.pendingLootDrop.stats)) p.pendingLootDrop = null;
  if (p.pendingSkillOffer && !obj(p.pendingSkillOffer)) p.pendingSkillOffer = null;
  if (p.pendingSkillReplacement && !obj(p.pendingSkillReplacement)) p.pendingSkillReplacement = null;
  return p;
}

function clampSpeed(speed: unknown, p: Record<string, any>): 1 | 2 | 4 {
  const max = (p.highestWorld || 1) >= 3 ? 4 : (p.bossDefeatedCount || 0) >= 1 || (p.highestWorld || 1) >= 2 ? 2 : 1;
  const s = speed === 4 ? 4 : speed === 2 ? 2 : 1;
  return (s > max ? max : s) as 1 | 2 | 4;
}

class GameManager {
  private state: GameStateData;
  private listeners: Set<(state: GameStateData) => void> = new Set();

  constructor() {
    this.state = this.loadState();
    this.applyEngineSettings();
    try {
      this.migrateRemovedSlots();
      this.applyCosmeticsToPlayer();
      this.recalculatePlayerStats();
    } catch {
      // A save we could not repair: start fresh instead of a white screen (the old save stays in its backup key)
      try { localStorage.setItem(STORAGE_KEY + '_backup', localStorage.getItem(STORAGE_KEY) || ''); } catch { /* ignore */ }
      this.state = createDefaultState();
      this.applyCosmeticsToPlayer();
      this.recalculatePlayerStats();
    }
    this.refreshSession();
  }

  // Engine-side settings that live outside React (also needed after a reset)
  private applyEngineSettings() {
    soundFx.soundEnabled = this.state.soundEnabled;
    haptics.enabled = this.state.hapticsEnabled;
    battleRig.quality = this.state.quality;
    battleRig.reducedMotion = this.state.reducedMotion;
    document.documentElement.classList.toggle('reduce-motion', !!this.state.reducedMotion);
  }

  // Blocks saving while an imported save is being applied by a reload
  private savingBlocked = false;

  public importSave(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || typeof parsed.playerLevel !== 'number') return false;
      if (parsed.playerFighter !== undefined && (typeof parsed.playerFighter !== 'object' || parsed.playerFighter === null)) return false;
      this.savingBlocked = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      window.location.reload();
      return true;
    } catch {
      this.savingBlocked = false;
      return false;
    }
  }

  // Loot that arrives while another loot card is open goes to the bag instead of replacing it
  private setPendingLoot(item: EquipmentItem) {
    if (this.state.pendingLootDrop) this.stashOrSell(this.state.pendingLootDrop);
    this.state.pendingLootDrop = item;
  }

  // Bosses: optional bonus offer keeps its time while a modal covers it
  public extendBossBonus(ms: number) {
    if (this.state.bossBonus) this.state.bossBonus.expiresAt += ms;
  }

  // Shop ads: limited per day so they stay worth something
  public static AD_DAILY_CAP: Record<string, number> = { free_gems: 5, double_damage: 6, gym_free: 6 };
  public freeGemsCoins(): number {
    return Math.max(1000, this.getCurrentStage().coinReward * 3);
  }

  public adsLeftToday(type: string): number {
    const today = dateKey();
    const used = this.state.adCaps?.date === today ? this.state.adCaps.counts[type] || 0 : 0;
    return Math.max(0, (GameManager.AD_DAILY_CAP[type] ?? 99) - used);
  }
  private countAd(type: string) {
    const today = dateKey();
    if (!this.state.adCaps || this.state.adCaps.date !== today) this.state.adCaps = { date: today, counts: {} };
    this.state.adCaps.counts[type] = (this.state.adCaps.counts[type] || 0) + 1;
  }

  // Battle speed unlocks with progress: 2x after the first boss, 4x after world 2
  public maxBattleSpeed(): 1 | 2 | 4 {
    if (this.state.highestWorld >= 3) return 4;
    if (this.state.bossDefeatedCount >= 1 || this.state.highestWorld >= 2) return 2;
    return 1;
  }

  private lastBuffActive = false;

  // Runs on launch and every time the app returns from the background
  public refreshSession() {
    adMobManager.preload();
    void cancelReminders(); // the player is back
    this.checkOfflineEarnings();
    this.checkDailyLogin();
    this.ensureDailyQuests();
    this.notify();
  }

  public onAppHidden() {
    this.saveState();
    if (this.state.notificationsEnabled) void scheduleReminders(this.state.lang);
  }

  // In-game soft ask first; the iOS permission prompt only appears after the player says yes
  public async answerNotificationAsk(yes: boolean) {
    this.state.notifAsked = true;
    this.state.notificationsEnabled = yes ? await requestNotificationPermission() : false;
    this.notify();
  }

  public async toggleNotifications() {
    if (this.state.notificationsEnabled) {
      this.state.notificationsEnabled = false;
      void cancelReminders();
    } else {
      this.state.notifAsked = true;
      this.state.notificationsEnabled = await requestNotificationPermission();
      if (!this.state.notificationsEnabled) pushToast(ui(this.state.lang, 'notif_denied'), 'info', 4000);
    }
    this.notify();
  }

  public claimBossBonusOffer() {
    const b = this.state.bossBonus;
    if (!b || Date.now() > b.expiresAt) {
      this.state.bossBonus = null;
      this.notify();
      return;
    }
    this.openRewardedAd({ type: 'boss_double', title: ui(this.state.lang, 'boss_bonus'), rewardDesc: `+${b.coins.toLocaleString()} 🪙  +${b.gems} 💎` });
  }

  public dismissBuffOffer() {
    this.state.buffOffer = null;
    this.notify();
  }

  public gymFreeAvailable(): boolean {
    return Date.now() >= (this.state.gymFreeReadyAt || 0) && this.adsLeftToday('gym_free') > 0;
  }

  public dismissBossBonus() {
    this.state.bossBonus = null;
    this.notify();
  }

  // Called periodically: expires timed buffs without waiting for the next fight
  public refreshBuffs() {
    const active = Date.now() < this.state.doubleDamageUntil;
    if (active !== this.lastBuffActive) {
      this.recalculatePlayerStats();
      this.notify();
    }
  }

  private checkDailyLogin() {
    const today = dateKey();
    if (this.state.lastDailyLoginDate === today) return;

    const consecutive = this.state.lastDailyLoginDate === dateKey(-1);
    let streak = consecutive ? this.state.dailyLoginStreak + 1 : 1;
    if (!consecutive || streak > 7) {
      this.state.claimedDailyDays = [];
      if (streak > 7) streak = 1;
    }
    this.state.dailyLoginStreak = streak;
    this.state.lastDailyLoginDate = today;
    this.maybeOpenDailyLogin();
  }

  // One popup at a time: the daily card waits for the tutorial, the first win and the offline card
  private maybeOpenDailyLogin() {
    const unclaimed = !this.state.claimedDailyDays.includes(this.state.dailyLoginStreak);
    if (!unclaimed || this.state.lastDailyLoginDate !== dateKey()) return;
    if (this.state.tutorialStep < 4 || this.state.totalFightsWon < 1 || this.state.isOfflineRewardOpen) return;
    if (this.state.pendingLootDrop || this.state.pendingSkillOffer || this.state.pendingSkillReplacement || this.state.activeAdModal) return;
    if (this.state.dailyPopupShownDate === dateKey()) return;
    this.state.dailyPopupShownDate = dateKey();
    this.state.isDailyLoginOpen = true;
  }

  private ensureDailyQuests() {
    const today = dateKey();
    if (this.state.questDate !== today || !this.state.dailyQuests?.length) {
      this.state.dailyQuests = createDailyQuests();
      this.state.questDate = today;
    }
  }

  // `silent` is for callers that notify right after (victory, gym) to avoid a duplicate render
  public recordQuest(id: QuestId, amount = 1, silent = false) {
    this.ensureDailyQuests();
    const quest = this.state.dailyQuests.find((q) => q.id === id);
    if (!quest || quest.claimed || quest.progress >= quest.target) return;
    quest.progress = Math.min(quest.target, quest.progress + amount);
    if (!silent) this.notify();
  }

  public claimQuest(id: QuestId) {
    const quest = this.state.dailyQuests.find((q) => q.id === id);
    if (!quest || quest.claimed || quest.progress < quest.target) return;
    quest.claimed = true;
    this.state.gems += quest.gems;
    this.state.coins += questCoins(quest.coins, (this.state.highestWorld - 1) * 10 + this.state.highestSubStage);
    soundFx.playCoin();
    haptics.trigger('success');
    this.notify();
  }

  private checkOfflineEarnings() {
    const now = Date.now();
    const lastTime = this.state.lastOfflineTimestamp || now;
    this.state.lastOfflineTimestamp = now;

    const elapsedMs = now - lastTime;
    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));

    // If away for more than 5 minutes
    if (elapsedMinutes >= 5) {
      // Time away while the reward card is still unanswered adds up (still capped at 8 hours)
      const prevMins = this.state.isOfflineRewardOpen ? this.state.offlineMinutesAccumulated || 0 : 0;
      const cappedMins = Math.min(OFFLINE_CAP_MINUTES, prevMins + elapsedMinutes);
      const gymLevelSum = this.state.gymTrainings.reduce((sum, g) => sum + g.level, 0);
      const bestStage = (this.state.highestWorld - 1) * 10 + this.state.highestSubStage;
      // About a fifth of what active play earns at the best stage (it used to be ~1%)
      const coinsPerMin = Math.max(5, Math.round(getStageData(this.state.highestWorld, this.state.highestSubStage).coinReward * 0.5 + gymLevelSum * 0.5 + bestStage));
      const totalOfflineCoins = cappedMins * coinsPerMin;

      this.state.offlineGoldAccumulated = totalOfflineCoins;
      this.state.offlineMinutesAccumulated = cappedMins;
      this.state.isOfflineRewardOpen = true;
    }
  }

  private loadState(): GameStateData {
    const defaults = createDefaultState();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = sanitizeSave(JSON.parse(saved));
        const fighter = parsed.playerFighter || defaults.playerFighter;
        if ((parsed.saveVersion || 0) < 5) {
          // v5: percentage stats on items depend on rarity only
          const norm = (i: EquipmentItem | null) => (i && i.stats ? normalizeItemRates(i) : i);
          if (fighter.equipped) Object.keys(fighter.equipped).forEach((k) => (fighter.equipped[k] = norm(fighter.equipped[k])));
          if (Array.isArray(parsed.inventory)) parsed.inventory = parsed.inventory.map(norm);
        }
        if ((parsed.saveVersion || 0) < 4) {
          // Saves from the 9-slot layout: lift existing gear to the new per-slot stat budget (removed slots are cashed out later)
          const up = (i: EquipmentItem | null) => (i && ACTIVE_SLOTS.includes(i.slot) ? upgradeLegacyItem(i) : i);
          if (fighter.equipped) Object.keys(fighter.equipped).forEach((k) => (fighter.equipped[k] = up(fighter.equipped[k])));
          if (Array.isArray(parsed.inventory)) parsed.inventory = parsed.inventory.map(up);
        }
        return {
          ...defaults,
          ...parsed,
          playerFighter: {
            ...defaults.playerFighter,
            ...fighter,
            // Skill families were rebalanced: saved skills take their family from the database
            equippedSkills: (fighter.equippedSkills || defaults.playerFighter.equippedSkills).map((sk: Skill) => {
              const db = SKILL_DATABASE.find((d) => d.id === sk.id);
              return cloneSkill(db ? { ...sk, category: db.category } : sk);
            }),
          },
          // Gym prices follow the current cost curve (older saves stored prices from a steeper curve)
          gymTrainings: (parsed.gymTrainings?.length ? parsed.gymTrainings : defaults.gymTrainings).map((g: GymTraining) => ({ ...g, cost: gymCostAt(g.id, g.level), statGain: gymGainAt(g.id, g.level) })),
          // Transient UI state is never restored
          activeAdModal: null,
          buffOffer: null,
          isDailyLoginOpen: false,
          isProfileOpen: false,
          bossBonus: null,
          // Old saves may point at tabs that were merged away
          activeTab: (['gear', 'gym', 'arena', 'shop'] as TabType[]).includes(parsed.activeTab) ? parsed.activeTab : 'gear',
          fighterView: parsed.activeTab === 'skills' ? 'skills' : parsed.fighterView || 'gear',
          // An unanswered offline reward survives a relaunch
          isOfflineRewardOpen: (parsed.offlineGoldAccumulated || 0) > 0,
          offlineGoldAccumulated: parsed.offlineGoldAccumulated || 0,
          offlineMinutesAccumulated: parsed.offlineMinutesAccumulated || 0,
          // Speed unlocks with progress
          battleSpeed: clampSpeed(parsed.battleSpeed, parsed),
          lastOfflineTimestamp: parsed.lastOfflineTimestamp || Date.now(),
          // Legacy saves started the streak at 1 without a login date
          dailyLoginStreak: parsed.lastDailyLoginDate ? parsed.dailyLoginStreak || 0 : 0,
          // Existing players have already played: skip the tutorial for them
          tutorialStep: parsed.tutorialStep ?? (parsed.totalFightsWon > 0 ? 99 : 0),
          claimedAchievements: parsed.claimedAchievements || [],
          saveVersion: SAVE_VERSION,
        };
      }
    } catch {
      // Corrupt save falls back to defaults
    }
    return defaults;
  }

  public saveState() {
    if (this.savingBlocked) return;
    this.state.lastOfflineTimestamp = Date.now();
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
    const offer = this.state.activeAdModal;
    const type = offer.type;
    if (type === 'double_damage') this.state.buffOffer = null;

    if (type === 'free_gems') {
      this.state.gems += 50;
      this.state.coins += this.freeGemsCoins();
      this.countAd('free_gems');
      soundFx.playVictoryFanfare();
    } else if (type === 'double_damage') {
      this.state.doubleDamageUntil = Date.now() + BUFF_DURATION_MS;
      this.countAd('double_damage');
      soundFx.playVictoryFanfare();
    } else if (type === 'double_coins') {
      this.state.doubleCoinsUntil = Date.now() + BUFF_DURATION_MS;
      soundFx.playVictoryFanfare();
    } else if (type === 'offline_double') {
      this.state.coins += this.state.offlineGoldAccumulated * 2;
      this.state.offlineGoldAccumulated = 0;
      this.state.isOfflineRewardOpen = false;
      soundFx.playVictoryFanfare();
    } else if (type === 'daily_double') {
      if (offer.day) this.claimDailyLoginReward(offer.day, true);
    } else if (type === 'gym_free') {
      const g = this.state.gymTrainings.find((x) => x.id === offer.trainingId);
      if (g && !gymStatCapped(g.targetStat, this.state.playerFighter.stats)) {
        g.level += 1;
        g.cost = gymCostAt(g.id, g.level);
        g.statGain = gymGainAt(g.id, g.level);
        this.recordQuest('train_gym', 1, true);
      }
      this.countAd('gym_free');
      this.state.gymFreeReadyAt = Date.now() + 20 * 60000;
      soundFx.playGymTap();
    } else if (type === 'boss_double') {
      if (this.state.bossBonus) {
        this.state.coins += this.state.bossBonus.coins;
        this.state.gems += this.state.bossBonus.gems;
      }
      this.state.bossBonus = null;
      soundFx.playVictoryFanfare();
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

    const calculated = applyGymPercent(
      calculateTotalStats(
        this.state.playerFighter.baseStats,
        gymBonus,
        this.state.playerFighter.equipped,
        this.state.playerFighter.equippedSkills
      ),
      this.state.gymTrainings
    );

    // Apply timed active 2x damage buff from rewarded video
    const isDoubleDamageActive = Date.now() < this.state.doubleDamageUntil;
    this.lastBuffActive = isDoubleDamageActive;
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

    const r1 = (v: number) => Math.round(v * 10) / 10;
    this.state.playerFighter.stats = {
      ...calculated,
      hp: Math.round(calculated.hp),
      atk: Math.round(calculated.atk),
      def: Math.round(calculated.def),
      spd: Math.round(calculated.spd),
      critRate: r1(calculated.critRate),
      comboRate: r1(calculated.comboRate),
      dodgeRate: r1(calculated.dodgeRate),
      lifesteal: r1(calculated.lifesteal),
      critDmg: Math.round(calculated.critDmg * 100) / 100,
      maxHp: Math.round(calculated.hp),
      powerScore,
    };
  }

  // BATTLE REWARDS & PROGRESSION
  public onStageVictory(stage: Stage) {
    const isDoubleCoins = Date.now() < this.state.doubleCoinsUntil;
    // Manual fights run at 1x and pay 25% more
    const coinMult = (isDoubleCoins ? 2.0 : 1.0) * (this.state.autoBattle ? 1 : 1.25);

    this.state.coins += Math.round(stage.coinReward * coinMult);
    this.state.gems += stage.gemReward;
    this.state.trophies += stage.isBoss ? 25 : 5;
    this.state.totalFightsWon += 1;
    if (stage.isBoss) {
      this.state.bossDefeatedCount += 1;
      // Optional: watch an ad to get the boss payout once more (offer expires on its own)
      this.state.bossBonus = { coins: Math.round(stage.coinReward * coinMult), gems: stage.gemReward, expiresAt: Date.now() + 45000 };
    }
    this.state.lossStreak = 0;
    this.state.battleNonce += 1;
    this.recordQuest('win_fights', 1, true);
    if (stage.isBoss) this.recordQuest('beat_boss', 1, true);

    // Add XP
    this.addPlayerXp(stage.xpReward);

    // Progress Stage
    let nextSub = this.state.currentSubStage + 1;
    let nextWorld = this.state.currentWorld;

    if (nextSub > 10) {
      nextSub = 1;
      nextWorld += 1;
    }

    // In farm mode the fighter keeps replaying the same stage
    if (this.state.autoAdvance) {
      this.state.currentWorld = nextWorld;
      this.state.currentSubStage = nextSub;
    }

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
      this.handleLootDrop(generateEquipment(undefined, undefined, stageLvl));
    }

    // Roll Roguelite Skill every 3 stages or after boss
    if (stage.subStage % 3 === 0 || stage.isBoss) {
      if (!this.state.pendingSkillOffer && Math.random() < 0.8) {
        const offer = getRandomSkill();
        const deck = this.state.playerFighter.equippedSkills;
        const owned = deck.find((sk) => sk.id === offer.id);
        if (this.state.autoBattle && owned) {
          // Idle play: duplicates level up without stopping the fight
          if (owned.level < owned.maxLevel) {
            this.levelUpSkill(owned);
            pushToast(ui(this.state.lang, 'toast_skill_up', { name: skillName(owned.id, owned.name, this.state.lang), n: owned.level }), 'good');
          }
        } else if (this.state.autoBattle && deck.length < 6) {
          deck.push(cloneSkill(offer));
          pushToast(ui(this.state.lang, 'toast_skill_new', { name: skillName(offer.id, offer.name, this.state.lang) }), 'good');
        } else if (!this.state.autoBattle) {
          // Manual players choose (and may ask for another skill)
          this.state.pendingSkillOffer = offer;
          this.state.offerRerolls = 0;
        }
        // auto mode with a full deck: the offer is skipped instead of pausing the fight
      }
    }

    this.maybeOpenDailyLogin();
    this.recalculatePlayerStats();
    this.notify();
  }

  // Returns true when the fighter was moved back a stage to farm up
  public onStageDefeat(stage: Stage): boolean {
    this.state.lossStreak += 1;
    // Struggling on a normal stage: offer the 2x damage ad (optional, with a cooldown and the daily cap)
    const now = Date.now();
    if (!stage.isBoss && now >= this.state.doubleDamageUntil && now - (this.state.lastBuffOfferAt || 0) > 10 * 60000 &&
        this.adsLeftToday('double_damage') > 0 && fightOdds(this.state.playerFighter.stats, stage.opponent.stats, stage.opponent.profile) < 1.1) {
      this.state.buffOffer = { expiresAt: now + 30000 };
      this.state.lastBuffOfferAt = now;
    }
    let retreated = false;
    if (this.state.lossStreak >= (stage.isBoss ? BOSS_LOSSES_BEFORE_RETREAT : LOSSES_BEFORE_RETREAT)) {
      const total = (this.state.currentWorld - 1) * 10 + this.state.currentSubStage;
      if (total > 1) {
        const prev = total - 1;
        this.state.currentWorld = Math.floor((prev - 1) / 10) + 1;
        this.state.currentSubStage = ((prev - 1) % 10) + 1;
        retreated = true;
      }
      this.state.lossStreak = 0;
    }
    this.notify();
    return retreated;
  }

  public toggleAutoAdvance() {
    this.state.autoAdvance = !this.state.autoAdvance;
    this.notify();
  }

  public advanceTutorial() {
    this.state.tutorialStep += 1;
    this.maybeOpenDailyLogin();
    this.notify();
  }

  public skipTutorial() {
    this.state.tutorialStep = 99;
    this.maybeOpenDailyLogin();
    this.notify();
  }

  public claimAchievement(id: string) {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a || this.state.claimedAchievements.includes(id) || a.value(this.state) < a.target) return;
    this.state.claimedAchievements.push(id);
    this.state.gems += a.gems;
    soundFx.playCoin();
    haptics.trigger('success');
    this.notify();
  }

  public setQuality(q: QualityLevel) {
    this.state.quality = q;
    battleRig.quality = q;
    this.notify();
  }

  public toggleReducedMotion() {
    this.state.reducedMotion = !this.state.reducedMotion;
    this.applyEngineSettings();
    this.notify();
  }

  public toggleHaptics() {
    this.state.hapticsEnabled = !this.state.hapticsEnabled;
    haptics.enabled = this.state.hapticsEnabled;
    haptics.trigger('medium');
    this.notify();
  }

  // Most drops are handled without interrupting the fight: better gear is equipped automatically, the rest goes to
  // the bag (or is sold). Only epic and better drops open the big reveal card.
  private handleLootDrop(drop: EquipmentItem) {
    const rank: Record<Rarity, number> = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6 };
    const lang = this.state.lang;
    const slotName = ui(lang, 'slot_' + drop.slot);
    if (rank[drop.rarity] >= rank.epic) {
      this.state.pendingLootDrop = drop;
      soundFx.playLootDrop();
      return;
    }
    const current = this.state.playerFighter.equipped[drop.slot];
    if (!current || drop.powerScore > current.powerScore) {
      this.state.playerFighter.equipped[drop.slot] = drop;
      if (current) this.stashOrSell(current);
      soundFx.playEquip();
      pushToast(ui(lang, 'toast_equip', { slot: slotName, n: drop.powerScore - (current?.powerScore || 0) }), 'good');
      return;
    }
    if (this.shouldAutoSell(drop.rarity) || this.state.inventory.length >= this.state.maxInventorySlots) {
      this.state.coins += drop.sellPrice;
      pushToast(ui(lang, 'toast_sold', { slot: slotName, n: drop.sellPrice }), 'gold');
    } else {
      this.state.inventory.push(drop);
      pushToast(ui(lang, 'toast_bag', { slot: slotName }), 'info');
    }
  }

  private stashOrSell(item: EquipmentItem) {
    if (this.state.inventory.length < this.state.maxInventorySlots) this.state.inventory.push(item);
    else this.state.coins += item.sellPrice;
  }

  // Saves from before the 6-slot layout: turn gear in removed slots into coins
  private migrateRemovedSlots() {
    let coins = 0;
    const eq = this.state.playerFighter.equipped;
    (Object.keys(eq) as EquipmentSlot[]).forEach((slot) => {
      if (!ACTIVE_SLOTS.includes(slot) && eq[slot]) {
        coins += eq[slot]!.sellPrice;
        eq[slot] = null;
      }
    });
    const keep = this.state.inventory.filter((i) => ACTIVE_SLOTS.includes(i.slot));
    this.state.inventory.filter((i) => !ACTIVE_SLOTS.includes(i.slot)).forEach((i) => (coins += i.sellPrice));
    this.state.inventory = keep;
    if (this.state.pendingLootDrop && !ACTIVE_SLOTS.includes(this.state.pendingLootDrop.slot)) {
      coins += this.state.pendingLootDrop.sellPrice;
      this.state.pendingLootDrop = null;
    }
    if (coins > 0) {
      this.state.coins += coins;
      setTimeout(() => pushToast(ui(this.state.lang, 'toast_migrated', { n: coins }), 'gold', 4500), 1500);
    }
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
    const inBag = this.state.inventory.some((i) => i.id === item.id);
    const isPending = this.state.pendingLootDrop?.id === item.id;
    if (!inBag && !isPending) return; // equipped or already gone: nothing to sell
    this.state.coins += item.sellPrice;
    this.state.inventory = this.state.inventory.filter((i) => i.id !== item.id);
    if (isPending) {
      this.state.pendingLootDrop = null;
    }
    soundFx.playCoin();
    this.notify();
  }

  public unequipItem(slot: EquipmentSlot) {
    const item = this.state.playerFighter.equipped[slot];
    if (!item) return;

    if (this.state.inventory.length >= this.state.maxInventorySlots) {
      // Never destroy gear silently
      pushToast(ui(this.state.lang, 'bag_full'), 'info', 3000);
      return;
    }
    this.state.inventory.push(item);
    this.state.playerFighter.equipped[slot] = null;

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
      if (existing.level < existing.maxLevel) this.levelUpSkill(existing);
      this.state.pendingSkillOffer = null;
    } else {
      if (this.state.playerFighter.equippedSkills.length < 6) {
        this.state.playerFighter.equippedSkills.push(cloneSkill(skill));
        this.state.pendingSkillOffer = null;
      } else {
        // Deck full! Open safe replacement modal instead of silent purge
        this.state.pendingSkillReplacement = skill;
        this.state.pendingSkillOffer = null;
      }
    }

    soundFx.playEquip();
    this.recalculatePlayerStats();
    this.saveState();
    this.notify();
  }

  private levelUpSkill(existing: Skill) {
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

  public replaceSkillInDeck(oldSkillId: string, newSkill: Skill) {
    const idx = this.state.playerFighter.equippedSkills.findIndex((s) => s.id === oldSkillId);
    if (idx >= 0) {
      this.state.playerFighter.equippedSkills[idx] = cloneSkill(newSkill);
    }
    this.state.pendingSkillReplacement = null;
    this.state.pendingSkillOffer = null;
    soundFx.playEquip();
    this.recalculatePlayerStats();
    this.saveState();
    this.notify();
  }

  public dismissSkillReplacement() {
    this.state.pendingSkillReplacement = null;
    this.notify();
  }

  public rerollCost(): number {
    const n = this.state.offerRerolls || 0;
    return n === 0 ? 0 : 25 * 2 ** (n - 1);
  }

  // "Show another skill": only for an open offer; the first one is free, then the price doubles
  public rerollSkill(): boolean {
    if (!this.state.pendingSkillOffer) return false;
    const cost = this.rerollCost();
    if (this.state.coins < cost) return false;
    this.state.coins -= cost;
    this.state.offerRerolls = (this.state.offerRerolls || 0) + 1;
    this.state.pendingSkillOffer = getRandomSkill();
    soundFx.playCoin();
    this.notify();
    return true;
  }

  public dismissSkillOffer() {
    this.state.pendingSkillOffer = null;
    this.notify();
  }

  // EQUIPMENT FUSION / FORGE (3-in-1 MERGE)
  public fuseEquipment(itemIds: [string, string, string]): boolean {
    if (itemIds.length !== 3) return false;
    const items = itemIds
      .map((id) => this.state.inventory.find((i) => i.id === id))
      .filter(Boolean) as EquipmentItem[];
    if (items.length !== 3) return false;

    const rarity = items[0].rarity;
    const allSameRarity = items.every((i) => i.rarity === rarity);
    if (!allSameRarity) return false;

    const nextRarityMap: Record<Rarity, Rarity | null> = {
      common: 'uncommon',
      uncommon: 'rare',
      rare: 'epic',
      epic: 'legendary',
      legendary: 'mythic',
      mythic: null,
    };

    const nextRarity = nextRarityMap[rarity];
    if (!nextRarity) return false;

    // Remove consumed items
    this.state.inventory = this.state.inventory.filter((i) => !itemIds.includes(i.id));

    // Generate forged item
    // The forged item keeps the highest item level of the three (averaging made forging feel like a loss)
    const bestLevel = Math.max(items[0].level, items[1].level, items[2].level);
    const forgedItem = generateEquipment(items[0].slot, nextRarity, bestLevel);
    this.state.inventory.push(forgedItem);

    soundFx.playLootDrop();
    this.saveState();
    this.notify();
    return true;
  }

  // RETENTION: 7-DAY LOGIN REWARDS
  public openDailyLogin() {
    this.state.isDailyLoginOpen = true;
    this.notify();
  }

  public closeDailyLogin() {
    this.state.isDailyLoginOpen = false;
    this.notify();
  }

  // doubled: the player watched an ad to double the coins/gems of the day
  public claimDailyLoginReward(day: number, doubled = false) {
    if (this.state.claimedDailyDays.includes(day) || day !== this.state.dailyLoginStreak) return;
    this.state.claimedDailyDays.push(day);
    const x = doubled ? 2 : 1;

    if (day === 1) this.state.coins += 500 * x;
    else if (day === 2) this.state.gems += 50 * x;
    else if (day === 3) this.state.doubleDamageUntil = Date.now() + BUFF_DURATION_MS * x;
    else if (day === 4) this.state.coins += 1500 * x;
    else if (day === 5) this.state.gems += 100 * x;
    else if (day === 6) {
      const stageLvl = (this.state.currentWorld - 1) * 10 + this.state.currentSubStage;
      this.setPendingLoot(generateEquipment(undefined, 'legendary', stageLvl));
    } else if (day === 7) {
      this.state.gems += 250 * x;
      const stageLvl = (this.state.currentWorld - 1) * 10 + this.state.currentSubStage;
      this.setPendingLoot(generateEquipment('head', 'mythic', stageLvl));
    }

    this.recalculatePlayerStats();
    this.saveState();
    this.notify();
  }

  // RETENTION: AFK OFFLINE EARNINGS
  public openOfflineReward() {
    this.state.isOfflineRewardOpen = true;
    this.notify();
  }

  public closeOfflineReward() {
    this.state.isOfflineRewardOpen = false;
    this.state.offlineGoldAccumulated = 0;
    this.state.offlineMinutesAccumulated = 0;
    this.maybeOpenDailyLogin();
    this.notify();
  }

  public claimOfflineGold(amount: number) {
    this.state.coins += amount;
    this.state.offlineGoldAccumulated = 0;
    this.state.offlineMinutesAccumulated = 0;
    this.state.isOfflineRewardOpen = false;
    this.maybeOpenDailyLogin();
    this.saveState();
    this.notify();
  }

  // GYM WORKOUT UPGRADES (Tiered Scaling)
  public trainGym(trainingId: string): boolean {
    const training = this.state.gymTrainings.find((t) => t.id === trainingId);
    if (!training) return false;
    if (this.state.coins < training.cost) return false;
    // Capped stats (crit, dodge) cannot be trained further
    if (gymStatCapped(training.targetStat, this.state.playerFighter.stats)) return false;

    this.state.coins -= training.cost;
    training.level += 1;
    training.cost = gymCostAt(training.id, training.level);

    training.statGain = gymGainAt(training.id, training.level);

    soundFx.playGymTap();
    this.recordQuest('train_gym', 1, true);
    this.recalculatePlayerStats();
    this.saveState();
    this.notify();
    return true;
  }

  // STAGE SELECT
  public selectStage(world: number, subStage: number) {
    this.state.currentWorld = world;
    this.state.currentSubStage = subStage;
    this.state.lossStreak = 0;
    this.state.battleNonce += 1;
    this.notify();
  }

  public setActiveTab(tab: TabType, view?: 'gear' | 'skills' | 'stages' | 'quests') {
    // 'skills' and 'profile' are no longer bottom tabs: route them to their new homes
    if (tab === 'profile') {
      this.state.isProfileOpen = true;
      this.notify();
      return;
    }
    if (tab === 'skills') {
      tab = 'gear';
      view = 'skills';
    }
    this.state.activeTab = tab;
    if (tab === 'gear' && (view === 'gear' || view === 'skills')) this.state.fighterView = view;
    if (tab === 'arena' && (view === 'stages' || view === 'quests')) this.state.arenaView = view;
    this.notify();
  }

  public setProfileOpen(open: boolean) {
    this.state.isProfileOpen = open;
    this.notify();
  }

  public toggleAutoBattle() {
    this.state.autoBattle = !this.state.autoBattle;
    if (!this.state.autoBattle) {
      // Manual fights need real reaction time: 1x speed, +25% coins
      this.state.battleSpeed = 1;
      pushToast(ui(this.state.lang, 'manual_info'), 'info', 3200);
    }
    this.notify();
  }

  public cycleBattleSpeed() {
    if (!this.state.autoBattle) {
      this.state.battleSpeed = 1;
      pushToast(ui(this.state.lang, 'manual_info'), 'info', 3200);
      this.notify();
      return;
    }
    const max = this.maxBattleSpeed();
    const next = this.state.battleSpeed === 1 ? 2 : this.state.battleSpeed === 2 ? 4 : 1;
    if (next > max) {
      this.state.battleSpeed = 1;
      pushToast(ui(this.state.lang, max === 1 ? 'speed_locked_boss' : 'speed_locked_world'), 'info', 2600);
    } else {
      this.state.battleSpeed = next;
    }
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

  public updateFighterName(newName: string) {
    const trimmed = newName.trim();
    if (trimmed.length > 0 && trimmed.length <= 24) {
      this.state.playerFighter.name = trimmed;
      this.saveState();
      this.notify();
    }
  }

  public setFighterAvatar(avatarId: string) {
    this.state.playerFighter.avatarId = avatarId;
    this.saveState();
    this.notify();
  }

  public setFighterTitle(titleId: string, titleName: string) {
    this.state.playerFighter.titleId = titleId;
    this.state.playerFighter.title = titleName;
    this.saveState();
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
    this.state = createDefaultState();
    this.lastBuffActive = false;
    this.applyEngineSettings();
    this.applyCosmeticsToPlayer();
    this.recalculatePlayerStats();
    this.refreshSession();
  }

  public getCurrentStage(): Stage {
    return getStageData(this.state.currentWorld, this.state.currentSubStage);
  }
}

export const gameManager = new GameManager();

// Browser tests drive the game logic directly in dev builds only
if (import.meta.env.DEV) {
  (window as unknown as { __game: GameManager }).__game = gameManager;
}
