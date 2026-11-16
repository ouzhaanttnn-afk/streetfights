// Headless balance simulation: plays the real stage/loot/skill data with the real combat rules (src/core/combat.ts,
// including the boss mechanics and the build-19 skill mechanics), the real progression rules (src/core/progression.ts)
// and leagues (src/core/leagues.ts) using the auto-play policy of the game:
//   equip better gear, spend coins in the gym, take the draft's recommended skill, farm until ready after a wall
//   (src/core/gameState.ts FARM_RELIABLE_ODDS / READY_ODDS), battle speed as unlocked.
// Play is split into sessions; offline income (the game's formula, 8 h cap), daily quests and login rewards are paid
// between sessions. Time is wall-clock play time at the unlocked battle speed.
// Run: node scripts/run-balance-sim.mjs   (see docs/BALANCE.md)
import { BALANCE, getStageData } from '../src/core/stageDatabase';
import { calculateTotalStats, generateEquipment } from '../src/core/lootGenerator';
import { DECK_SIZE, SKILL_DATABASE, isDraftStage, makeDraft, recommendedDraftIndex } from '../src/core/skillDatabase';
import {
  COMBAT, DAMAGE_MULT, MECH, SKILL_RULES, chargedMult, damageMult, evadeActive, evadeChance, hitShell, isChargedSwing,
  isLeechBite, leechHeal, mechIntervalMult, opponentInterval, playerInterval, shellCapacity, stageOdds,
} from '../src/core/combat';
import {
  GYM, GYM_TEMPLATES, INITIAL_BASE_STATS, OFFLINE, applyGymPercent, gymCostAt, gymFlatBonus, gymGainAt, offlineCoinsPerMin, STAT_CAPS,
} from '../src/core/progression';
import { LEAGUE_REWARD_STEP, leagueOfWorld, promotionReward } from '../src/core/leagues';
import type { EquipmentItem, EquipmentSlot, FighterStats, OpponentProfile, Skill, Stage } from '../src/types/game';

// Mirrors src/core/gameState.ts (kept here so the sim does not import browser code)
let FARM_RELIABLE_ODDS = 1.6;
const READY_ODDS = 1.1;
const LOSSES_BEFORE_RETREAT = 3;
const OFFLINE_CAP_MINUTES = 480;
const QUEST_COINS = 400 + 600 + 300 + 500; // the four daily quests
const questCoins = (base: number, highest: number) => Math.round(base * (1 + Math.max(0, highest - 1) / 6));

export interface SimOptions {
  seed: number;
  maxFights?: number;
  maxHours?: number; // play time (wall clock)
  balance?: Partial<typeof BALANCE>;
  combat?: Partial<typeof COMBAT>;
  offline?: Partial<typeof OFFLINE>;
  gym?: Partial<typeof GYM>;
  leagueStep?: number;
  sessionMin?: number; // play minutes per session
  sessionsPerDay?: number;
  manualGuard?: boolean; // the player guards charged strikes by hand (90%)
  /** Wall-clock overheads (seconds) */
  draftSecs?: number;
  farmOdds?: number;
  maxSpeed?: 1 | 2 | 4; // cap the battle speed (what-if: no 2x/4x)
}

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

interface FightResult { won: boolean; seconds: number }

export function fight(p: FighterStats, skills: Skill[], stage: Stage, R: () => number, manualGuard = false): FightResult {
  const o = stage.opponent.stats;
  const prof = stage.opponent.profile as OpponentProfile;
  const mech = stage.bossMechanic;
  const proc = (type: string) => skills.find((s) => s.specialProc?.type === type);
  const rolled = (type: string) => { const s = proc(type); return s && R() * 100 < s.specialProc!.chance ? s : undefined; };
  const fury = proc('rage_boost')?.specialProc?.multiplier || 1;
  const breaker = proc('armor_break');
  const chain = proc('chain_combo');
  const wound = proc('wound')?.specialProc?.multiplier ?? 1;
  const wind = proc('second_wind');
  const pInt = playerInterval(p.spd, o.spd);
  const oIntBase = opponentInterval(o.spd, prof, p.spd);
  let pHp = p.hp, oHp = o.maxHp, rage = 0, streak = 0, t = 0, oCount = 0, stacks = 0, windUsed = false;
  let shell = shellCapacity(mech, o.maxHp), shellNext = MECH.shell.period;
  let pNext = stage.isBoss ? 1900 : 300, oNext = stage.isBoss ? 2100 : 400;
  const deal = (main: number, combo: number) => { const r = hitShell(shell, main, combo); shell = r.shell; oHp -= r.main + r.combo; return r.main + r.combo; };
  const addRage = (n: number) => { rage = Math.min(100, rage + n * fury); };
  const healOpp = (n: number) => { oHp = Math.min(o.maxHp, oHp + Math.round(n * wound)); };
  while (pHp > 0 && oHp > 0 && t < 180000) {
    t = Math.min(pNext, oNext);
    if (mech?.id === 'shell' && t >= shellNext) { shellNext += MECH.shell.period; shell = shellCapacity(mech, o.maxHp); }
    if (t === pNext) {
      pNext = t + pInt;
      const special = rage >= 100;
      if (special) rage = 0;
      if (!special && R() * 100 < o.dodgeRate) { streak = 0; continue; }
      const def = o.def * (1 - stacks * (breaker?.specialProc?.multiplier || 0));
      let d = Math.max(1, Math.round(p.atk * (0.85 + R() * 0.3) * damageMult(p.atk, def)));
      const comboChance = Math.min(75, p.comboRate + Math.min(15, streak * 2));
      if (!special && evadeActive(mech, t) && R() < evadeChance()) {
        if (R() * 100 < comboChance) deal(0, Math.max(1, Math.round(d * COMBAT.comboShare)));
        continue;
      }
      if (R() * 100 < p.critRate) d = Math.round(d * (p.critDmg || 1.5));
      if (special) d = Math.round(d * COMBAT.superMult);
      streak++;
      let vamp = false;
      for (const s of skills) {
        const sp = s.specialProc;
        if (!sp || !['double_strike', 'bicycle_kick', 'execute', 'vampire'].includes(sp.type) || R() * 100 >= sp.chance) continue;
        if (sp.type === 'double_strike' || sp.type === 'bicycle_kick') d = Math.round(d * sp.multiplier);
        else if (sp.type === 'execute' && oHp < o.maxHp * 0.35) d = Math.round(d * sp.multiplier);
        else if (sp.type === 'vampire') vamp = true;
      }
      let combo = 0;
      if (!special && R() * 100 < comboChance) {
        combo = Math.max(1, Math.round(d * COMBAT.comboShare));
        for (let c = 0; chain && c < SKILL_RULES.chainMax && R() * 100 < chain.specialProc!.chance; c++) combo += Math.max(1, Math.round(d * chain.specialProc!.multiplier));
      }
      if (!special && prof === 'defensive' && R() < 0.15) d = Math.max(1, Math.round(d * 0.4));
      const dealt = deal(d, combo);
      if (breaker) stacks = Math.min(SKILL_RULES.armorBreakMaxStacks, stacks + 1);
      addRage(20);
      const ls = p.lifesteal + (vamp ? 30 : 0);
      if (ls > 0 && dealt > 0) pHp = Math.min(p.hp, pHp + Math.max(1, Math.round((dealt * ls) / 100)));
      if (prof === 'counter' && oHp > 0 && R() < 0.2) oNext = Math.min(oNext, t + 220);
    } else {
      oCount++;
      const charged = isChargedSwing(mech, oCount);
      oNext = t + oIntBase * mechIntervalMult(mech, oHp / o.maxHp) + (charged ? MECH.charged.windupMs : 0);
      const isCrit = R() * 100 < o.critRate;
      const heavyMove = charged || prof === 'heavy' || isCrit || R() < 0.2;
      const slip = rolled('shadow_dodge') || (heavyMove ? rolled('sixth_sense') : undefined);
      if (slip || R() * 100 < p.dodgeRate) {
        addRage(15);
        const counter = rolled('counter_strike');
        if (counter) deal(Math.max(1, Math.round(p.atk * counter.specialProc!.multiplier * damageMult(p.atk, o.def))), 0);
        continue;
      }
      let d = Math.max(1, Math.round(o.atk * (0.85 + R() * 0.3) * DAMAGE_MULT[prof] * (charged ? chargedMult(mech!) : 1) * damageMult(o.atk, p.def)));
      if (isCrit) d = Math.round(d * (o.critDmg || 1.5));
      const chin = rolled('iron_chin');
      if (chin) d = Math.max(1, Math.round(d * chin.specialProc!.multiplier));
      if (charged && R() < (manualGuard ? 0.9 : MECH.charged.autoGuard)) d = Math.max(1, Math.round(d * MECH.charged.guardPass));
      pHp -= d;
      streak = 0;
      addRage(8);
      if (o.lifesteal > 0) healOpp((d * o.lifesteal) / 100);
      if (isLeechBite(mech, oCount)) healOpp(leechHeal(mech!, d));
      if (wind && !windUsed && pHp > 0 && pHp < p.hp * SKILL_RULES.secondWindBelow) { windUsed = true; pHp = Math.min(p.hp, pHp + Math.round(p.hp * wind.specialProc!.multiplier)); }
    }
  }
  return { won: oHp <= 0 && pHp > 0, seconds: t / 1000 };
}

const cloneSkill = (s: Skill): Skill => JSON.parse(JSON.stringify(s));
function levelUp(ex: Skill) {
  ex.level++;
  (['atk', 'hp', 'def', 'spd'] as const).forEach((k) => { if (ex.statBonus[k]) ex.statBonus[k] = Math.round(ex.statBonus[k]! * 1.5); });
  if (ex.statBonus.critRate) ex.statBonus.critRate = Math.min(ex.statBonus.critRate + 3, 50);
  if (ex.statBonus.comboRate) ex.statBonus.comboRate = Math.min(ex.statBonus.comboRate + 3, 50);
  if (ex.statBonus.dodgeRate) ex.statBonus.dodgeRate = Math.min(ex.statBonus.dodgeRate + 3, 40);
  if (ex.statBonus.lifesteal) ex.statBonus.lifesteal = Math.min(ex.statBonus.lifesteal + 2.5, 30);
}

export function simulate(opts: SimOptions) {
  Object.assign(BALANCE, opts.balance || {});
  Object.assign(COMBAT, opts.combat || {});
  Object.assign(OFFLINE, opts.offline || {});
  Object.assign(GYM, opts.gym || {});
  void LEAGUE_REWARD_STEP;
  const R = rng(opts.seed);
  const realRandom = Math.random;
  Math.random = R; // loot + draft rolls use Math.random
  const maxFights = opts.maxFights ?? 1e9;
  const maxWall = (opts.maxHours ?? 14) * 3600;
  const sessionSecs = (opts.sessionMin ?? 20) * 60;
  const sessionsPerDay = opts.sessionsPerDay ?? 3;
  const breakMin = Math.max(0, (24 * 60 - sessionsPerDay * (sessionSecs / 60)) / sessionsPerDay);
  const draftSecs = opts.draftSecs ?? 4;
  FARM_RELIABLE_ODDS = opts.farmOdds ?? 1.6;

  let level = 1, xp = 0, maxXp = 100, coins = 200 + 500; // start + day-1 login reward
  const base = { ...INITIAL_BASE_STATS };
  const gym = GYM_TEMPLATES.map((g) => ({ ...g, cost: gymCostAt(g.id, 1) }));
  const equipped: Record<EquipmentSlot, EquipmentItem | null> = {
    head: generateEquipment('head', 'common', 1), gloves: generateEquipment('gloves', 'common', 1), mouth: null,
    robe: generateEquipment('robe', 'common', 1), shorts: generateEquipment('shorts', 'common', 1), boots: generateEquipment('boots', 'common', 1),
    belt: null, weapon: null, partner: null,
  };
  const skills: Skill[] = [cloneSkill(SKILL_DATABASE[0])];

  const stats = (): FighterStats => {
    const s = applyGymPercent(calculateTotalStats(base, gymFlatBonus(gym), equipped, skills), gym);
    return { ...s, maxHp: s.hp, powerScore: 0 };
  };
  const trainGym = () => {
    // players mostly dump coins into the gym: buy the cheapest useful upgrade while affordable
    for (let guard = 0; guard < 400; guard++) {
      const cur = stats() as unknown as Record<string, number>;
      const options = gym.filter((g) => STAT_CAPS[g.targetStat] === undefined || cur[g.targetStat] < STAT_CAPS[g.targetStat]!);
      const t = options.sort((a, b) => a.cost - b.cost)[0];
      if (!t || coins < t.cost) break;
      coins -= t.cost; t.level++; t.cost = gymCostAt(t.id, t.level); t.statGain = gymGainAt(t.id, t.level);
    }
  };
  const draft = () => {
    const opts3 = makeDraft(skills, R);
    if (!opts3.length) return;
    const pick = opts3[recommendedDraftIndex(opts3, skills)];
    const ex = skills.find((k) => k.id === pick.skill.id);
    if (ex) { if (ex.level < ex.maxLevel) levelUp(ex); }
    else if (skills.length < DECK_SIZE) skills.push(cloneSkill(pick.skill));
    // full deck + new skill: the auto player keeps the deck (the swap card is a manual choice)
  };

  let world = 1, sub = 1, highest = 1, losses = 0, fights = 0, wall = 0, bosses = 0, league = 0;
  let farm: { idx: number; fights: number; ready?: number } | null = null;
  const farmToReady: number[] = [];
  const calib: Record<number, [number, number]> = {};
  let dbg = 0;
  const farmByStage: [number, number][] = [];
  let sessionLeft = sessionSecs, sessions = 1, day = 1, sessionInDay = 1;
  const farmEpisodes: number[] = [];
  const idxOf = (w: number, s: number) => (w - 1) * 10 + s;
  const setStage = (idx: number) => { world = Math.floor((idx - 1) / 10) + 1; sub = ((idx - 1) % 10) + 1; };
  const stageAt = (idx: number) => getStageData(Math.floor((idx - 1) / 10) + 1, ((idx - 1) % 10) + 1);
  const farmSpot = (target: number) => {
    const p = stats();
    for (let i = target - 1; i >= 1; i--) if (stageOdds(p, stageAt(i), skills) >= FARM_RELIABLE_ODDS) return i;
    return 1;
  };
  const speed = () => Math.min(opts.maxSpeed ?? 4, highest > 20 ? 4 : bosses >= 1 || highest > 10 ? 2 : 1);
  const frontier = { normal: [0, 0], sub: [0, 0], boss: [0, 0] };
  const frontier100 = { normal: [0, 0], sub: [0, 0], boss: [0, 0] };
  const firstTry100: Record<'sub' | 'boss', [number, number]> = { sub: [0, 0], boss: [0, 0] };
  const firstTry: Record<'sub' | 'boss', [number, number]> = { sub: [0, 0], boss: [0, 0] };
  const tried = new Set<number>();
  const perStage: Record<number, { fights: number; losses: number; winSecs: number[]; boss: boolean }> = {};
  const reachedAt: Record<number, { wall: number; day: number; fights: number }> = {};
  const spend = (secs: number) => {
    wall += secs; sessionLeft -= secs;
    if (sessionLeft <= 0) {
      // break between sessions: offline income, and once per day quests + login rewards
      const mins = Math.min(OFFLINE_CAP_MINUTES, sessionInDay === sessionsPerDay ? breakMin * 2 : breakMin);
      const best = stageAt(highest);
      coins += mins * offlineCoinsPerMin(best.coinReward, gym.reduce((a, g) => a + g.level, 0), highest);
      sessions++; sessionInDay++;
      if (sessionInDay > sessionsPerDay) {
        sessionInDay = 1; day++;
        coins += questCoins(QUEST_COINS, highest) + (day % 7 === 4 ? 1500 : day % 7 === 1 ? 500 : 0);
      }
      sessionLeft = sessionSecs;
      trainGym();
    }
  };

  while (fights < maxFights && wall < maxWall) {
    const idx = idxOf(world, sub);
    const stage = getStageData(world, sub);
    const kind = stage.subStage === 10 ? 'boss' : stage.subStage === 5 ? 'sub' : 'normal';
    const rec = (perStage[idx] ||= { fights: 0, losses: 0, winSecs: [], boss: stage.isBoss });
    const spd = speed();
    const pNow = stats();
    const r = fight(pNow, skills, stage, R, opts.manualGuard);
    { const o = stageOdds(pNow, stage, skills); const b = Math.min(12, Math.floor(o * 5)); (calib[b] ||= [0, 0]); calib[b][1]++; if (r.won) calib[b][0]++;
      if (process.env.DEBUG_LOSS && !r.won && o > 2 && dbg++ < 15) console.log('loss at odds', o.toFixed(2), 'stage', idx, stage.opponent.profile, stage.bossMechanic?.id, 'secs', r.seconds.toFixed(1), 'pHp', Math.round(pNow.hp), 'oHp', stage.opponent.stats.maxHp, 'ls', pNow.lifesteal, 'oLs', stage.opponent.stats.lifesteal); }
    fights++; rec.fights++;
    if (farm) farm.fights++;
    const atFrontier = idx === highest;
    if (atFrontier) { frontier[kind][1]++; if (!r.won) frontier[kind][0]++; }
    if (atFrontier && idx <= 100) { frontier100[kind][1]++; if (!r.won) frontier100[kind][0]++; }
    if (atFrontier && idx <= 100 && kind !== 'normal' && !tried.has(idx)) { firstTry100[kind][1]++; if (!r.won) firstTry100[kind][0]++; }
    if (atFrontier && kind !== 'normal' && !tried.has(idx)) { tried.add(idx); firstTry[kind][1]++; if (!r.won) firstTry[kind][0]++; }
    if (!r.won) {
      rec.losses++; losses++;
      if (stage.isBoss) {
        // defeat panel countdown, then farm until ready
        spend(r.seconds / spd + 5);
        losses = 0;
        farm = farm && farm.idx === idx ? farm : { idx, fights: 0 };
        setStage(farmSpot(idx));
      } else {
        spend((r.seconds + 1.5) / spd);
        if (losses >= LOSSES_BEFORE_RETREAT) {
          losses = 0;
          if (!farm) farm = { idx, fights: 0 };
          setStage(farmSpot(idx));
        }
      }
      trainGym();
      continue;
    }
    spend((r.seconds + 0.7) / spd);
    rec.winSecs.push(r.seconds);
    losses = 0;
    coins += stage.coinReward; xp += stage.xpReward;
    if (stage.isBoss) bosses++;
    while (xp >= maxXp) { xp -= maxXp; level++; maxXp = Math.round(maxXp * 1.35); base.hp += 20; base.maxHp += 20; base.atk += 3; base.def += 2; base.spd += 1; }
    if (R() <= (stage.isBoss ? 1 : 0.85)) {
      const drop = generateEquipment(undefined, undefined, idx);
      const cur = equipped[drop.slot];
      if (!cur || drop.powerScore > cur.powerScore) { if (cur) coins += cur.sellPrice; equipped[drop.slot] = drop; } else coins += drop.sellPrice;
    }
    const firstClear = idx + 1 > highest;
    if (firstClear && isDraftStage(stage.subStage)) { draft(); spend(draftSecs); }
    trainGym();
    if (farm && farm.idx === idx) { farmEpisodes.push(farm.fights); farm = null; }
    if (farm) {
      if (stageOdds(stats(), stageAt(farm.idx), skills) >= READY_ODDS) {
        if (farm.ready === undefined) { farm.ready = farm.fights; farmToReady.push(farm.fights); farmByStage.push([farm.idx, farm.fights]); }
        setStage(farm.idx);
      }
      else setStage(farmSpot(farm.idx));
    } else setStage(idx + 1);
    if (idxOf(world, sub) > highest) {
      highest = idxOf(world, sub);
      reachedAt[highest] = { wall, day, fights };
      const lg = leagueOfWorld(world);
      if (lg > league) { league = lg; coins += promotionReward(lg, getStageData(lg * 5 + 1, 1).coinReward).coins; spend(3); }
    }
  }
  Math.random = realRandom;
  return { perStage, level, highest, wall, reachedAt, power: stats(), frontier, firstTry, farmEpisodes, farmToReady, farmByStage, calib, frontier100, firstTry100, sessions, days: day, fights };
}
