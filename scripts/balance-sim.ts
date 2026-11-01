// Headless balance simulation: plays the real stage/loot/skill data with a simple "sensible player" policy
// and reports how many fights each stage costs. Run: node scripts/run-balance-sim.mjs
import { getStageData } from '../src/core/stageDatabase';
import { calculateTotalStats, generateEquipment } from '../src/core/lootGenerator';
import { SKILL_DATABASE } from '../src/core/skillDatabase';
import type { EquipmentItem, EquipmentSlot, Skill, StatModifiers } from '../src/types/game';

type Profile = 'aggressive' | 'defensive' | 'counter' | 'fast' | 'heavy' | 'boss';
const IMULT: Record<Profile, number> = { aggressive: 0.8, defensive: 1.2, counter: 1.2, fast: 0.7, heavy: 1.5, boss: 0.95 };
const DMULT: Record<Profile, number> = { aggressive: 0.85, defensive: 1, counter: 1, fast: 0.7, heavy: 1.45, boss: 1 };

const ZERO: Required<StatModifiers> = { hp: 0, atk: 0, def: 0, spd: 0, critRate: 0, critDmg: 0, comboRate: 0, dodgeRate: 0, lifesteal: 0, stamina: 0 };
const GYM = [
  { stat: 'atk', gain: 3, cost: 30 }, { stat: 'hp', gain: 25, cost: 35 }, { stat: 'spd', gain: 2, cost: 40 },
  { stat: 'critRate', gain: 0.8, cost: 50 }, { stat: 'dodgeRate', gain: 0.7, cost: 45 },
] as const;

export interface SimOptions { seed: number; maxFights: number; gymWeight: number }

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function simulate(opts: SimOptions) {
  const rand = rng(opts.seed);
  const realRandom = Math.random;
  Math.random = rand; // loot + skill rolls use Math.random

  let level = 1, xp = 0, maxXp = 100, coins = 200;
  const base = { ...ZERO, hp: 220, atk: 22, def: 12, spd: 15, critRate: 8, critDmg: 1.5, comboRate: 8, dodgeRate: 6, stamina: 100 };
  const gym = GYM.map((g) => ({ ...g, level: 1, cost: g.cost, gain: g.gain }));
  const equipped: Record<EquipmentSlot, EquipmentItem | null> = {
    head: generateEquipment('head', 'common', 1), gloves: generateEquipment('gloves', 'common', 1), mouth: null,
    robe: generateEquipment('robe', 'common', 1), shorts: generateEquipment('shorts', 'common', 1), boots: generateEquipment('boots', 'common', 1),
    belt: null, weapon: null, partner: null,
  };
  const skills: Skill[] = [JSON.parse(JSON.stringify(SKILL_DATABASE[0]))];

  const stats = () => {
    const g = { ...ZERO } as Required<StatModifiers>;
    gym.forEach((t) => { (g as any)[t.stat] += (t.level - 1) * t.gain; });
    return calculateTotalStats(base, g, equipped, skills);
  };

  let world = 1, sub = 1, highest = 1, losses = 0, fights = 0;
  const perStage: Record<number, { fights: number; losses: number; firstClearFight: number }> = {};

  const fight = (stage: ReturnType<typeof getStageData>) => {
    const p = stats();
    const o = stage.opponent.stats;
    const prof = stage.opponent.profile as Profile;
    let pHp = p.hp, oHp = o.hp, rage = 0, streak = 0, t = 0;
    const pInt = Math.max(450, 1500 - Math.max(10, p.spd) * 18);
    const oInt = Math.max(500, 1600 - Math.max(10, o.spd) * 16) * IMULT[prof];
    let pNext = 300, oNext = 400;
    while (pHp > 0 && oHp > 0 && t < 90000) {
      t += 10;
      if (t >= pNext) {
        pNext = t + pInt;
        const special = rage >= 100;
        if (special) rage = 0;
        if (!special && rand() * 100 < o.dodgeRate) { streak = 0; }
        else {
          let d = Math.max(1, Math.round(p.atk * (0.85 + rand() * 0.3) * (100 / (100 + o.def * 0.45))));
          if (rand() * 100 < p.critRate) d = Math.round(d * p.critDmg);
          if (special) d = Math.round(d * 2.2);
          streak++;
          skills.forEach((s) => { if (s.specialProc && rand() * 100 < s.specialProc.chance) d = Math.round(d * s.specialProc.multiplier); });
          if (!special && rand() * 100 < Math.min(75, p.comboRate + Math.min(15, streak * 2))) d += Math.max(1, Math.round(d * 0.35));
          if (prof === 'defensive' && !special && rand() < 0.15) d = Math.max(1, Math.round(d * 0.4));
          oHp -= d; rage = Math.min(100, rage + 20);
          if (p.lifesteal > 0) pHp = Math.min(p.hp, pHp + Math.max(1, Math.round(d * p.lifesteal / 100)));
          if (prof === 'counter' && oHp > 0 && rand() < 0.2) oNext = Math.min(oNext, t + 220);
        }
      }
      if (t >= oNext && oHp > 0) {
        oNext = t + oInt;
        if (rand() * 100 < p.dodgeRate) { rage = Math.min(100, rage + 15); }
        else {
          const heavy = prof === 'boss' ? 1 : 1;
          let d = Math.max(1, Math.round(o.atk * (0.85 + rand() * 0.3) * DMULT[prof] * heavy * (100 / (100 + p.def * 0.45))));
          if (rand() * 100 < o.critRate) d = Math.round(d * o.critDmg);
          pHp -= d; streak = 0; rage = Math.min(100, rage + 8);
        }
      }
    }
    return { won: oHp <= 0 && pHp > 0, seconds: t / 1000 };
  };

  const rarityRank: Record<string, number> = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6 };
  let seconds = 0;
  const stageIdx = () => (world - 1) * 10 + sub;
  const trainGym = () => {
    // buy the cheapest upgrade while affordable (players mostly dump coins into gym)
    let guard = 0;
    while (guard++ < 50) {
      const t = gym.slice().sort((a, b) => a.cost - b.cost)[0];
      if (coins < t.cost * opts.gymWeight) break;
      coins -= t.cost; t.level++; t.cost = Math.round(t.cost * 1.35);
      if (t.level % 5 === 0) t.gain = Math.round(t.gain * 1.4 * 10) / 10;
    }
  };

  while (fights < opts.maxFights) {
    const stage = getStageData(world, sub);
    const idx = stageIdx();
    const rec = (perStage[idx] ||= { fights: 0, losses: 0, firstClearFight: -1 });
    const r = fight(stage);
    fights++; rec.fights++; seconds += r.seconds + 2;
    if (!r.won) {
      rec.losses++; losses++;
      if (losses >= (stage.isBoss ? 2 : 3) && idx > 1) { losses = 0; const prev = idx - 1; world = Math.floor((prev - 1) / 10) + 1; sub = ((prev - 1) % 10) + 1; }
      trainGym();
      continue;
    }
    losses = 0;
    if (rec.firstClearFight < 0) rec.firstClearFight = fights;
    coins += stage.coinReward; xp += stage.xpReward;
    while (xp >= maxXp) { xp -= maxXp; level++; maxXp = Math.round(maxXp * 1.35); base.hp += 20; base.atk += 3; base.def += 2; base.spd += 1; }
    // loot
    if (rand() <= (stage.isBoss ? 1 : 0.85)) {
      const drop = generateEquipment(undefined, undefined, idx);
      const cur = equipped[drop.slot];
      if (!cur || drop.powerScore > cur.powerScore) { if (cur) coins += cur.sellPrice; equipped[drop.slot] = drop; } else coins += drop.sellPrice;
    }
    // skills
    if ((stage.subStage % 3 === 0 || stage.isBoss) && rand() < 0.8) {
      const s = JSON.parse(JSON.stringify(SKILL_DATABASE[Math.floor(rand() * SKILL_DATABASE.length)])) as Skill;
      const ex = skills.find((k) => k.id === s.id);
      if (ex) { if (ex.level < ex.maxLevel) { ex.level++; (['atk', 'hp', 'def', 'spd'] as const).forEach((k) => { if (ex.statBonus[k]) ex.statBonus[k] = Math.round(ex.statBonus[k]! * 1.5); }); } }
      else if (skills.length < 6) skills.push(s);
    }
    trainGym();
    // advance
    let ns = sub + 1, nw = world;
    if (ns > 10) { ns = 1; nw++; }
    world = nw; sub = ns; highest = Math.max(highest, stageIdx());
  }
  Math.random = realRandom;
  return { perStage, level, highest, seconds, power: stats() };
}
