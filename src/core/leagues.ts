// Leagues (docs/PLAN_BUILD_19.md C1): the five worlds repeat once per league with tougher opponents, a per-world
// opponent modifier and bigger rewards. World numbers keep counting up (world 6 = Silver world 1), so stage ids,
// `highestWorld` and every saved counter stay valid. Pure module: also used by scripts/balance-sim.ts.

export const WORLDS_PER_LEAGUE = 5;
export const LEAGUE_IDS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'] as const;
export type LeagueId = (typeof LEAGUE_IDS)[number];
export const LEGEND = LEAGUE_IDS.length - 1;

/** League index of a world number: 0 = Bronze (worlds 1-5), 1 = Silver (6-10) ... 5+ = Legend, Legend 2 ... */
export const leagueOfWorld = (world: number) => Math.floor((Math.max(1, world) - 1) / WORLDS_PER_LEAGUE);
/** World 1..5 inside its league */
export const worldInLeague = (world: number) => ((Math.max(1, world) - 1) % WORLDS_PER_LEAGUE) + 1;
export const leagueId = (league: number): LeagueId => LEAGUE_IDS[Math.min(LEGEND, Math.max(0, league))];
/** 0 below Legend; 1 for the first Legend league, 2 for "Legend 2", ... */
export const legendRank = (league: number) => (league >= LEGEND ? league - LEGEND + 1 : 0);
export const LEAGUE_COLORS: Record<LeagueId, string> = {
  bronze: '#cd7f32', silver: '#cbd5e1', gold: '#fbbf24', platinum: '#5eead4', diamond: '#7dd3fc', legend: '#f472b6',
};

// Coins and XP grow per league so rewards keep pace with the tougher opponents
export const LEAGUE_REWARD_STEP = 0.25;
export const leagueRewardMult = (league: number) => 1 + LEAGUE_REWARD_STEP * Math.max(0, league);

/**
 * One opponent modifier per world in every league after Bronze. The world each modifier lands on rotates with the
 * league, so Silver world 1 and Gold world 1 do not feel the same. Values grow with the league (capped at Legend).
 */
export type LeagueModifierId = 'dodge' | 'lifesteal' | 'crit' | 'armor' | 'haste';
export const LEAGUE_MODIFIERS: LeagueModifierId[] = ['dodge', 'lifesteal', 'crit', 'armor', 'haste'];
export function leagueModifier(world: number): { id: LeagueModifierId; value: number } | undefined {
  const league = leagueOfWorld(world);
  if (league === 0) return undefined;
  const id = LEAGUE_MODIFIERS[(worldInLeague(world) - 1 + league - 1) % LEAGUE_MODIFIERS.length];
  const k = Math.min(LEGEND, league);
  // dodge/lifesteal/crit: percentage points; armor/haste: fraction of DEF/SPD added
  const value = id === 'dodge' ? 4 * k : id === 'lifesteal' ? 3 * k : id === 'crit' ? 6 * k : id === 'armor' ? 0.08 * k : 0.06 * k;
  return { id, value: Math.round(value * 100) / 100 };
}

/** Fixed reward for reaching a league (shown before claiming; never random) */
export function promotionReward(league: number, stageCoinReward: number): { gems: number; coins: number } {
  return { gems: 100 + 50 * Math.min(LEGEND, league), coins: Math.round(stageCoinReward * 25) };
}

/** Roman numerals for "Legend II", "Legend III" ... */
export function roman(n: number): string {
  const map: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  let v = Math.max(1, Math.floor(n));
  for (const [k, s] of map) while (v >= k) { out += s; v -= k; }
  return out;
}
