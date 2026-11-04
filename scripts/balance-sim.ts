// Headless balance simulation: plays the real stage/loot/skill data with the real combat formulas
// (src/core/combat.ts) and progression rules (src/core/progression.ts) using a sensible auto-play policy.
// Run: node scripts/run-balance-sim.mjs   (see docs/BALANCE.md)
import { BALANCE, getStageData } from '../src/core/stageDatabase';
import { calculateTotalStats, generateEquipment } from '../src/core/lootGenerator';
import { SKILL_DATABASE } from '../src/core/skillDatabase';
import { COMBAT, DAMAGE_MULT, damageMult, opponentInterval, playerInterval } from '../src/core/combat';
import { GYM_TEMPLATES, INITIAL_BASE_STATS, applyGymPercent, gymCostAt, gymFlatBonus, gymGainAt, STAT_CAPS } from '../src/core/progression';
import type { EquipmentItem, EquipmentSlot, FighterStats, OpponentProfile, Skill } from '../src/types/game';

export interface SimOptions {
  seed: number;
  maxFights: number;
  balance?: Partial<typeof BALANCE>;
  combat?: Partial<typeof COMBAT>;
}

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

interface FightResult { won: boolean; seconds: number; swings: number }

function fight(p: FighterStats, skills: Skill[], stage: ReturnType<typeof getStageData>, R: () => number): FightResult {
  const o = stage.opponent.stats;
  const prof = stage.opponent.profile as OpponentProfile;
  const proc = (type: string) => skills.find((s) => s.specialProc?.type === type);
  const pInt = playerInterval(p.spd, o.spd);
  const oInt = opponentInterval(o.spd, prof, p.spd);
  let pHp = p.hp, oHp = o.maxHp, rage = 0, streak = 0, t = 0, oCount = 0, swings = 0;
  let pNext = stage.isBoss ? 1900 : 300, oNext = stage.isBoss ? 2100 : 400;
  const hitOpp = (dmg: number) => { oHp -= dmg; };
  while (pHp > 0 && oHp > 0 && t < 180000) {
    t = Math.min(pNext, oNext);
    if (t === pNext) {
      pNext = t + pInt;
      swings++;
      const special = rage >= 100;
      if (special) rage = 0;
      if (!special && R() * 100 < o.dodgeRate) { streak = 0; }
      else {
        let d = Math.max(1, Math.round(p.atk * (0.85 + R() * 0.3) * damageMult(p.atk, o.def)));
        if (R() * 100 < p.critRate) d = Math.round(d * (p.critDmg || 1.5));
        if (special) d = Math.round(d * 2.2);
        streak++;
        let vamp = false;
        for (const s of skills) {
          const sp = s.specialProc;
          if (!sp || R() * 100 >= sp.chance) continue;
          if (sp.type === 'double_strike' || sp.type === 'bicycle_kick') d = Math.round(d * sp.multiplier);
          else if (sp.type === 'execute' && oHp < o.maxHp * 0.35) d = Math.round(d * sp.multiplier);
          else if (sp.type === 'vampire') vamp = true;
        }
        if (!special && R() * 100 < Math.min(75, p.comboRate + Math.min(15, streak * 2))) d += Math.max(1, Math.round(d * 0.35));
        if (!special && prof === 'defensive' && R() < 0.15) d = Math.max(1, Math.round(d * 0.4));
        hitOpp(d);
        rage = Math.min(100, rage + 20);
        const ls = p.lifesteal + (vamp ? 30 : 0);
        if (ls > 0) pHp = Math.min(p.hp, pHp + Math.max(1, Math.round((d * ls) / 100)));
        if (prof === 'counter' && oHp > 0 && R() < 0.2) oNext = Math.min(oNext, t + 220);
      }
    } else {
      oNext = t + oInt;
      oCount++;
      const shadow = proc('shadow_dodge');
      if ((shadow && R() * 100 < shadow.specialProc!.chance) || R() * 100 < p.dodgeRate) {
        rage = Math.min(100, rage + 15);
        const counter = proc('counter_strike');
        if (counter && R() * 100 < counter.specialProc!.chance) hitOpp(Math.max(1, Math.round(p.atk * counter.specialProc!.multiplier * damageMult(p.atk, o.def))));
        continue;
      }
      const heavy = prof === 'boss' && oCount % 4 === 0 ? 1.5 : 1;
      let d = Math.max(1, Math.round(o.atk * (0.85 + R() * 0.3) * DAMAGE_MULT[prof] * heavy * damageMult(o.atk, p.def)));
      if (R() * 100 < o.critRate) d = Math.round(d * (o.critDmg || 1.5));
      const chin = proc('iron_chin');
      if (chin && R() * 100 < chin.specialProc!.chance) d = Math.max(1, Math.round(d * chin.specialProc!.multiplier));
      if (o.lifesteal > 0) oHp = Math.min(o.maxHp, oHp + Math.round((d * o.lifesteal) / 100));
      pHp -= d;
      streak = 0;
      rage = Math.min(100, rage + 8);
    }
  }
  return { won: oHp <= 0 && pHp > 0, seconds: t / 1000, swings };
}

export function simulate(opts: SimOptions) {
  Object.assign(BALANCE, opts.balance || {});
  Object.assign(COMBAT, opts.combat || {});
  const R = rng(opts.seed);
  const realRandom = Math.random;
  Math.random = R; // loot + skill rolls use Math.random

  let level = 1, xp = 0, maxXp = 100, coins = 200 + 500; // start + day-1 login reward
  const base = { ...INITIAL_BASE_STATS };
  const gym = GYM_TEMPLATES.map((g) => ({ ...g }));
  const equipped: Record<EquipmentSlot, EquipmentItem | null> = {
    head: generateEquipment('head', 'common', 1), gloves: generateEquipment('gloves', 'common', 1), mouth: null,
    robe: generateEquipment('robe', 'common', 1), shorts: generateEquipment('shorts', 'common', 1), boots: generateEquipment('boots', 'common', 1),
    belt: null, weapon: null, partner: null,
  };
  const skills: Skill[] = [JSON.parse(JSON.stringify(SKILL_DATABASE[0]))];

  const stats = (): FighterStats => {
    const s = applyGymPercent(calculateTotalStats(base, gymFlatBonus(gym), equipped, skills), gym);
    return { ...s, maxHp: s.hp };
  };
  const trainGym = () => {
    // players mostly dump coins into the gym: buy the cheapest useful upgrade while affordable
    for (let guard = 0; guard < 80; guard++) {
      const cur = stats() as unknown as Record<string, number>;
      const options = gym.filter((g) => STAT_CAPS[g.targetStat] === undefined || cur[g.targetStat] < STAT_CAPS[g.targetStat]!);
      const t = options.sort((a, b) => a.cost - b.cost)[0];
      if (!t || coins < t.cost) break;
      coins -= t.cost; t.level++; t.cost = gymCostAt(t.id, t.level); t.statGain = gymGainAt(t.id, t.level);
    }
  };

  let world = 1, sub = 1, highest = 1, losses = 0, fights = 0, seconds = 0;
  const perStage: Record<number, { fights: number; losses: number; firstClearFight: number; winSecs: number[]; boss: boolean }> = {};
  const reachedAt: Record<number, number> = {};
  const stageIdx = () => (world - 1) * 10 + sub;

  while (fights < opts.maxFights) {
    const stage = getStageData(world, sub);
    const idx = stageIdx();
    const rec = (perStage[idx] ||= { fights: 0, losses: 0, firstClearFight: -1, winSecs: [], boss: stage.isBoss });
    const r = fight(stats(), skills, stage, R);
    fights++; rec.fights++; seconds += r.seconds + 2;
    if (!r.won) {
      rec.losses++; losses++;
      if (losses >= (stage.isBoss ? 2 : 3) && idx > 1) { losses = 0; const prev = idx - 1; world = Math.floor((prev - 1) / 10) + 1; sub = ((prev - 1) % 10) + 1; }
      trainGym();
      continue;
    }
    rec.winSecs.push(r.seconds);
    losses = 0;
    if (rec.firstClearFight < 0) rec.firstClearFight = fights;
    coins += stage.coinReward; xp += stage.xpReward;
    while (xp >= maxXp) { xp -= maxXp; level++; maxXp = Math.round(maxXp * 1.35); base.hp += 20; base.maxHp += 20; base.atk += 3; base.def += 2; base.spd += 1; }
    if (R() <= (stage.isBoss ? 1 : 0.85)) {
      const drop = generateEquipment(undefined, undefined, idx);
      const cur = equipped[drop.slot];
      if (!cur || drop.powerScore > cur.powerScore) { if (cur) coins += cur.sellPrice; equipped[drop.slot] = drop; } else coins += drop.sellPrice;
    }
    if ((stage.subStage % 3 === 0 || stage.isBoss) && R() < 0.8) {
      const s = JSON.parse(JSON.stringify(SKILL_DATABASE[Math.floor(R() * SKILL_DATABASE.length)])) as Skill;
      const ex = skills.find((k) => k.id === s.id);
      if (ex) { if (ex.level < ex.maxLevel) { ex.level++; (['atk', 'hp', 'def', 'spd'] as const).forEach((k) => { if (ex.statBonus[k]) ex.statBonus[k] = Math.round(ex.statBonus[k]! * 1.5); }); } }
      else if (skills.length < 6) skills.push(s);
    }
    trainGym();
    let ns = sub + 1, nw = world;
    if (ns > 10) { ns = 1; nw++; }
    world = nw; sub = ns;
    if (stageIdx() > highest) { highest = stageIdx(); reachedAt[highest] = seconds; }
  }
  Math.random = realRandom;
  return { perStage, level, highest, seconds, reachedAt, power: stats() };
}
