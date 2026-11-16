// Combat numbers shared by the fight loop (BattleCanvas), the difficulty estimate (guidance.ts) and the balance
// simulation (scripts/balance-sim.ts). Keep this file free of browser APIs.
import type { BossMechanicId, FighterStats, OpponentProfile, Stage } from '../types/game';

// Fighting styles tune tempo and weight of attacks; average damage per second stays close to equal.
export const INTERVAL_MULT: Record<OpponentProfile, number> = {
  aggressive: 0.8, defensive: 1.2, counter: 1.2, fast: 0.7, heavy: 1.5, boss: 0.95,
};
export const DAMAGE_MULT: Record<OpponentProfile, number> = {
  aggressive: 0.85, defensive: 1.0, counter: 1.0, fast: 0.7, heavy: 1.45, boss: 1.0,
};

// Tunables (scripts/balance-sim.ts sweeps these)
export const COMBAT = {
  // Defence is relative to the attacker's attack, so damage stays meaningful at every stage
  // (the old 100/(100+0.45*def) cut player damage by ~98% around stage 60: minute-long fights)
  defK: 0.5,
  playerBase: 1150,
  oppBase: 1250,
  spdExp: 0.5,
  spdMinFactor: 0.45,
  spdMaxFactor: 2.2,
  superMult: 2.2,
  comboShare: 0.35,
};

// Attack tempo depends on the speed ratio between the two fighters, so SPD matters at every stage
// (an absolute formula hit its floor around SPD 58 and made the stat useless afterwards)
const speedFactor = (self: number, other: number) =>
  Math.min(COMBAT.spdMaxFactor, Math.max(COMBAT.spdMinFactor, Math.pow(Math.max(1, other) / Math.max(1, self), COMBAT.spdExp)));
export const playerInterval = (spd: number, oppSpd: number) => COMBAT.playerBase * speedFactor(spd, oppSpd);
export const opponentInterval = (spd: number, profile: OpponentProfile, playerSpd: number) =>
  COMBAT.oppBase * speedFactor(spd, playerSpd) * INTERVAL_MULT[profile];
// Share of the attacker's damage that gets through the defender's defence
export const damageMult = (atk: number, def: number) => Math.max(0.05, atk / (atk + Math.max(0, def) * COMBAT.defK));

// ---------------------------------------------------------------------------------------------
// Boss signature mechanics (docs/PLAN_BUILD_19.md B2). One per world (1..5, repeating every league).
// `strength` is 1 for the world boss and BALANCE.subBossMech for the sub-boss (a weaker version).
// ---------------------------------------------------------------------------------------------
export type BossMechanic = NonNullable<Stage['bossMechanic']>;
export const WORLD_MECHANICS: BossMechanicId[] = ['enrage', 'leech', 'evade', 'shell', 'charged'];

export const MECH = {
  // Brick: below 30% HP the boss swings faster (interval x (1 - speedUp*s)). Counter: save SUPER for the finish.
  enrage: { hpBelow: 0.3, speedUp: 0.45 },
  // Razor: every 3rd swing is a bite that heals heal*s of the damage it dealt. Counter: burst / crit builds.
  leech: { every: 3, heal: 0.8 },
  // Viper: evasion stance for `duration` ms every `period` ms; normal hits miss with `chance`; SUPER and combo
  // follow-ups always land. Counter: hold SUPER for the stance.
  evade: { period: 12000, duration: 3000, chance: 0.85 },
  // Titan: a shell absorbs absorb*s of max HP, raised at the start and every `period` ms. Combo follow-ups do
  // `comboBreak`x damage to the shell. Counter: combo builds.
  shell: { period: 10000, absorb: 0.07, comboBreak: 3 },
  // Apex: every `every`-th swing is a charged strike (mult) with an extra wind-up. A manual Guard (or the auto
  // guard, which reacts with a fixed chance) lets only `guardPass` through. Counter: Guard it, or a dodge build.
  charged: { every: 5, everySub: 7, mult: 2.5, windupMs: 700, autoGuard: 0.4, guardPass: 0.15 },
};

export const mechOf = (stage: Pick<Stage, 'bossMechanic'>) => stage.bossMechanic;

export const enraged = (m: BossMechanic | undefined, hpFrac: number) => m?.id === 'enrage' && hpFrac < MECH.enrage.hpBelow;
/** Multiplier on the opponent's attack interval (< 1 = faster) */
export const mechIntervalMult = (m: BossMechanic | undefined, hpFrac: number) =>
  enraged(m, hpFrac) ? 1 - MECH.enrage.speedUp * m!.strength : 1;

/** oppSwing counts the boss's swings from 1 */
export const isLeechBite = (m: BossMechanic | undefined, oppSwing: number) => m?.id === 'leech' && oppSwing % MECH.leech.every === 0;
export const leechHeal = (m: BossMechanic, dmg: number, healMult = 1) => Math.round(dmg * MECH.leech.heal * m.strength * healMult);

const evadeDuration = (m: BossMechanic) => MECH.evade.duration * (0.5 + 0.5 * m.strength);
/** tMs is fight time (simulation ms since the fight started) */
export const evadeActive = (m: BossMechanic | undefined, tMs: number) =>
  m?.id === 'evade' && tMs % MECH.evade.period >= MECH.evade.period - evadeDuration(m);
export const evadeChance = () => MECH.evade.chance;

export const shellCapacity = (m: BossMechanic | undefined, maxHp: number) =>
  m?.id === 'shell' ? Math.round(maxHp * MECH.shell.absorb * m.strength) : 0;
/** Applies a hit to the shell. Combo follow-up damage counts `comboBreak` times against the shell. */
export function hitShell(shell: number, main: number, combo: number): { shell: number; main: number; combo: number; absorbed: number } {
  if (shell <= 0) return { shell: 0, main, combo, absorbed: 0 };
  const comboPower = combo * MECH.shell.comboBreak;
  const fromCombo = Math.min(shell, comboPower);
  shell -= fromCombo;
  const comboLeft = Math.round(combo * (1 - fromCombo / Math.max(1, comboPower)));
  const fromMain = Math.min(shell, main);
  shell -= fromMain;
  return { shell, main: main - fromMain, combo: comboLeft, absorbed: fromMain + (combo - comboLeft) };
}

export const isChargedSwing = (m: BossMechanic | undefined, oppSwing: number) =>
  m?.id === 'charged' && oppSwing % (m.strength >= 1 ? MECH.charged.every : MECH.charged.everySub) === 0;
export const chargedMult = (m: BossMechanic) => 1 + (MECH.charged.mult - 1) * m.strength;

// ---------------------------------------------------------------------------------------------
// Skill mechanics added in build 19 (one per family). Values come from the skill's specialProc.
// ---------------------------------------------------------------------------------------------
export const SKILL_RULES = {
  armorBreakMaxStacks: 8, // Armor Breaker: each landed hit removes `multiplier` of the target's DEF, up to 8 stacks
  chainMax: 2, // Chain Combo: a combo follow-up chains again with `chance`%, at most twice
  secondWindBelow: 0.25, // Second Wind: once per fight below 25% HP, heal `multiplier` of max HP
};

// ---------------------------------------------------------------------------------------------
// Fight estimate
// ---------------------------------------------------------------------------------------------

// Expected damage per second, including crits, combos and the target's dodge chance
function dps(atk: number, interval: number, critRate: number, critDmg: number, targetDef: number, targetDodge: number, combo = 0) {
  const crit = 1 + (Math.min(100, critRate) / 100) * Math.max(0, (critDmg || 1.5) - 1);
  const comboF = 1 + (Math.min(75, combo) / 100) * COMBAT.comboShare;
  const hit = 1 - Math.min(90, targetDodge) / 100;
  return (atk * damageMult(atk, targetDef) * crit * comboF * hit) / (interval / 1000);
}

/**
 * How many times faster the player wins than loses: > 1 means the player should win.
 * Uses time-to-kill instead of power scores, which over-count stats that stop mattering late in the game.
 * `mech` adds the boss's signature mechanic (auto-mode play: auto guard, SUPER fired when full).
 */
export function fightOdds(p: FighterStats, o: FighterStats, profile: OpponentProfile, mech?: BossMechanic): number {
  let pDps = dps(p.atk, playerInterval(p.spd, o.spd), p.critRate, p.critDmg, o.def, o.dodgeRate, p.comboRate);
  let oDps = dps(o.atk * DAMAGE_MULT[profile], opponentInterval(o.spd, profile, p.spd), o.critRate, o.critDmg, p.def, p.dodgeRate);
  const comboPart = (Math.min(75, p.comboRate) / 100) * COMBAT.comboShare;
  let oppHp = o.maxHp || o.hp;
  if (mech?.id === 'enrage') oDps *= 1 - MECH.enrage.hpBelow + MECH.enrage.hpBelow / (1 - MECH.enrage.speedUp * mech.strength);
  if (mech?.id === 'charged') {
    const every = mech.strength >= 1 ? MECH.charged.every : MECH.charged.everySub;
    const taken = 1 - MECH.charged.autoGuard * (1 - MECH.charged.guardPass);
    oDps *= 1 + ((chargedMult(mech) * taken - 1) / every);
  }
  if (mech?.id === 'evade') {
    const frac = evadeDuration(mech) / MECH.evade.period;
    pDps *= 1 - frac * MECH.evade.chance * (1 - comboPart / (1 + comboPart));
  }
  // Opponent healing (league lifesteal modifier, leech bites) slows the player's damage down
  let oppHeal = oDps * (Math.min(60, o.lifesteal || 0) / 100);
  if (mech?.id === 'leech') oppHeal += (oDps * MECH.leech.heal * mech.strength) / MECH.leech.every;
  pDps = Math.max(pDps * 0.05, pDps - oppHeal);
  if (mech?.id === 'shell') {
    const cap = shellCapacity(mech, oppHp) / (1 + (MECH.shell.comboBreak - 1) * (comboPart / (1 + comboPart)));
    const ttk0 = oppHp / Math.max(0.001, pDps);
    oppHp += cap * (1 + Math.floor((ttk0 * 1000) / MECH.shell.period));
  }
  const netIncoming = Math.max(oDps * 0.05, oDps - pDps * (Math.min(60, p.lifesteal) / 100));
  const playerTtk = oppHp / Math.max(0.001, pDps);
  const oppTtk = (p.maxHp || p.hp) / Math.max(0.001, netIncoming);
  return oppTtk / playerTtk;
}

/** fightOdds for a stage, including its boss mechanic */
export const stageOdds = (p: FighterStats, stage: Pick<Stage, 'opponent' | 'bossMechanic'>) =>
  fightOdds(p, stage.opponent.stats, stage.opponent.profile, stage.bossMechanic);
