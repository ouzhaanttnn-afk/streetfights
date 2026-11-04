// Combat numbers shared by the fight loop (BattleCanvas) and the difficulty estimate (guidance.ts)
import type { FighterStats, OpponentProfile } from '../types/game';

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

// Expected damage per second, including crits, combos and the target's dodge chance
function dps(atk: number, interval: number, critRate: number, critDmg: number, targetDef: number, targetDodge: number, combo = 0) {
  const crit = 1 + (Math.min(100, critRate) / 100) * Math.max(0, (critDmg || 1.5) - 1);
  const comboF = 1 + (Math.min(75, combo) / 100) * 0.35;
  const hit = 1 - Math.min(90, targetDodge) / 100;
  return (atk * damageMult(atk, targetDef) * crit * comboF * hit) / (interval / 1000);
}

/**
 * How many times faster the player wins than loses: > 1 means the player should win.
 * Uses time-to-kill instead of power scores, which over-count stats that stop mattering late in the game.
 */
export function fightOdds(p: FighterStats, o: FighterStats, profile: OpponentProfile): number {
  const pDps = dps(p.atk, playerInterval(p.spd, o.spd), p.critRate, p.critDmg, o.def, o.dodgeRate, p.comboRate);
  // Bosses throw a 1.5x heavy every 4th attack
  const heavy = profile === 'boss' ? 1.125 : 1;
  const oDps = dps(o.atk * DAMAGE_MULT[profile] * heavy, opponentInterval(o.spd, profile, p.spd), o.critRate, o.critDmg, p.def, p.dodgeRate);
  const netIncoming = Math.max(oDps * 0.05, oDps - pDps * (Math.min(60, p.lifesteal) / 100));
  const playerTtk = (o.maxHp || o.hp) / Math.max(0.001, pDps);
  const oppTtk = (p.maxHp || p.hp) / Math.max(0.001, netIncoming);
  return oppTtk / playerTtk;
}
