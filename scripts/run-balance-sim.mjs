// Runs scripts/balance-sim.ts for several seeds and prints the progression curve and the milestone table
// (docs/PLAN_BUILD_19.md C2). Options (env):
//   RUNS=10 HOURS=14 (play time per run) SESSION=20 (minutes) PER_DAY=3 (sessions) FIGHTS=<cap>
//   BAL='{"boss":1.2}' COMBAT='{"defK":0.5}' GYM='{"costGrowth":1.13}' OFFLINE='{"stageCoinFactor":0.5}'
//   MANUAL_GUARD=1 (guard charged strikes by hand) MAX_SPEED=1 (what-if: no 2x/4x) FARM_ODDS=1.6 CALIB=1 DETAIL=30
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const out = join(mkdtempSync(join(tmpdir(), 'sim-')), 'sim.mjs');
await build({ entryPoints: ['scripts/balance-sim.ts'], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'error' });
const { simulate } = await import(pathToFileURL(out).href);

const env = process.env;
const RUNS = Number(env.RUNS || 10);
const opts = {
  maxHours: Number(env.HOURS || 14),
  maxFights: env.FIGHTS ? Number(env.FIGHTS) : undefined,
  sessionMin: Number(env.SESSION || 20),
  sessionsPerDay: Number(env.PER_DAY || 3),
  manualGuard: !!env.MANUAL_GUARD,
  farmOdds: env.FARM_ODDS ? Number(env.FARM_ODDS) : undefined,
  maxSpeed: env.MAX_SPEED ? Number(env.MAX_SPEED) : undefined,
  balance: env.BAL ? JSON.parse(env.BAL) : {},
  combat: env.COMBAT ? JSON.parse(env.COMBAT) : {},
  offline: env.OFFLINE ? JSON.parse(env.OFFLINE) : {},
  gym: env.GYM ? JSON.parse(env.GYM) : {},
};
const agg = {};
const reach = {};
const fr = { normal: [0, 0], sub: [0, 0], boss: [0, 0] };
const ft = { sub: [0, 0], boss: [0, 0] };
const fr100 = { normal: [0, 0], sub: [0, 0], boss: [0, 0] };
const ft100 = { sub: [0, 0], boss: [0, 0] };
const farm100 = [];
const farmToReady = [];
const farmBy = {};
const calib = {};
const farmEpisodes = [];
let highestSum = 0;
for (let seed = 1; seed <= RUNS; seed++) {
  const r = simulate({ seed, ...opts });
  highestSum += r.highest;
  for (const [n, v] of Object.entries(r.reachedAt)) (reach[n] ||= []).push(v);
  for (const k of Object.keys(fr)) { fr[k][0] += r.frontier[k][0]; fr[k][1] += r.frontier[k][1]; }
  for (const k of Object.keys(ft)) { ft[k][0] += r.firstTry[k][0]; ft[k][1] += r.firstTry[k][1]; }
  for (const k of Object.keys(fr100)) { fr100[k][0] += r.frontier100[k][0]; fr100[k][1] += r.frontier100[k][1]; }
  for (const k of Object.keys(ft100)) { ft100[k][0] += r.firstTry100[k][0]; ft100[k][1] += r.firstTry100[k][1]; }
  for (const [idx, n] of r.farmByStage) if (idx <= 100) farm100.push(n);
  farmToReady.push(...r.farmToReady);
  for (const [b, [w, n]] of Object.entries(r.calib)) { (calib[b] ||= [0, 0]); calib[b][0] += w; calib[b][1] += n; }
  for (const [idx, n] of r.farmByStage) (farmBy[Math.floor((idx - 1) / 10)] ||= []).push(n);
  farmEpisodes.push(...r.farmEpisodes);
  for (const [idx, s] of Object.entries(r.perStage)) {
    const a = (agg[idx] ||= { fights: 0, losses: 0, runs: 0, wins: [], boss: s.boss });
    a.fights += s.fights; a.losses += s.losses; a.runs++; a.wins.push(...s.winSecs);
  }
}
const med = (arr) => { if (!arr.length) return NaN; const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const pctl = (arr, q) => { if (!arr.length) return NaN; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * q))]; };
const pct = ([l, n]) => (n ? `${((l / n) * 100).toFixed(0)}%` : '-');
const stages = Object.keys(agg).map(Number).sort((a, b) => a - b);
console.log(`runs=${RUNS} play=${opts.maxHours}h sessions=${opts.sessionMin}min x${opts.sessionsPerDay}/day avgHighestStage=${(highestSum / RUNS).toFixed(1)} balance=${JSON.stringify(opts.balance)} combat=${JSON.stringify(opts.combat)} offline=${JSON.stringify(opts.offline)} gym=${JSON.stringify(opts.gym)}`);
console.log('stages    fights/stage  normal%  sub-boss%  boss%   median win (s, 1x)   farm fights to ready (n, median, max)');
for (let lo = 1; lo <= 300; lo += 10) {
  let f = 0, n = 0; const L = { normal: [0, 0], sub: [0, 0], boss: [0, 0] }; const wins = [];
  for (const i of stages) if (i >= lo && i <= lo + 9) {
    const a = agg[i]; f += a.fights; n += a.runs; wins.push(...a.wins);
    const kind = i % 10 === 0 ? 'boss' : i % 10 === 5 ? 'sub' : 'normal';
    L[kind][0] += a.losses; L[kind][1] += a.fights;
  }
  if (!n) continue;
  const fb = farmBy[Math.floor((lo - 1) / 10)] || [];
  console.log(`${String(lo).padStart(3)}-${String(lo + 9).padEnd(4)}  ${(f / n).toFixed(2).padStart(8)}   ${pct(L.normal).padStart(7)}   ${pct(L.sub).padStart(7)}  ${pct(L.boss).padStart(5)}   ${med(wins).toFixed(1).padStart(6)}              ${fb.length ? `${fb.length}, ${med(fb)}, ${Math.max(...fb)}` : '-'}`);
}
const allWins = stages.flatMap((i) => agg[i].wins);
console.log('');
const wins100 = stages.filter((i) => i <= 100).flatMap((i) => agg[i].wins);
console.log('Rules for stages 1-100, the milestone range (targets in brackets):');
console.log(`  losses at the frontier: normal ${pct(fr100.normal)} [10-25%], sub-boss ${pct(fr100.sub)}, boss ${pct(fr100.boss)}`);
console.log(`  first attempt lost: sub-boss ${pct(ft100.sub)}, boss ${pct(ft100.boss)} [30-55%]`);
console.log(`  farm fights until odds >= 1.1: median ${med(farm100)}, p90 ${pctl(farm100, 0.9)}, max ${Math.max(0, ...farm100)} [<= ~15]`);
console.log(`  fight length (wins, 1x game time): p10 ${pctl(wins100, 0.1).toFixed(1)} s, median ${med(wins100).toFixed(1)} s, p90 ${pctl(wins100, 0.9).toFixed(1)} s [6-12 s]`);
console.log('Rules over everything played (includes the late-league soft wall):');
console.log(`  losses at the frontier: normal ${pct(fr.normal)} [10-25%], sub-boss ${pct(fr.sub)}, boss ${pct(fr.boss)}`);
console.log(`  first attempt lost: sub-boss ${pct(ft.sub)}, boss ${pct(ft.boss)} [30-55%]`);
console.log(`  farm fights until odds >= 1.1: median ${med(farmToReady)}, p90 ${pctl(farmToReady, 0.9)}, max ${Math.max(0, ...farmToReady)} [<= ~15]; farm episodes ${farmEpisodes.length} (median ${med(farmEpisodes)} fights until the wall fell)`);
console.log(`  fight length (wins, 1x game time): p10 ${pctl(allWins, 0.1).toFixed(1)} s, median ${med(allWins).toFixed(1)} s, p90 ${pctl(allWins, 0.9).toFixed(1)} s [6-12 s]`);
console.log('');
console.log('Milestones (median play time at the unlocked speed, over the runs that got there):');
const row = (label, idx, target) => {
  const r = reach[idx] || [];
  const h = med(r.map((x) => x.wall)) / 3600;
  const time = !r.length ? '-' : h < 1 ? `${(h * 60).toFixed(0)} min` : `${h.toFixed(1)} h`;
  const days = r.length ? `day ${med(r.map((x) => x.day))}` : '';
  console.log(`  ${label.padEnd(26)} ${`${r.length}/${RUNS}`.padStart(6)}  ${time.padStart(8)}  ${days.padEnd(7)}  target ${target}`);
};
row('First boss (1-10) down', 11, '8-12 min');
row('World 2 cleared (stage 20)', 21, '40-60 min');
row('World 5 boss (stage 50)', 51, '3-4 h (day 3-4)');
row('League 2 cleared (st. 100)', 101, '8-12 h (week 2)');
row('League 3 cleared (st. 150)', 151, '-');
row('League 4 cleared (st. 200)', 201, '-');
row('League 5 cleared (st. 250)', 251, '-');
if (env.DETAIL) {
  console.log('stage  fights  loss%  medianWin');
  for (const i of stages.slice(0, Number(env.DETAIL))) console.log(`${String(i).padStart(4)}   ${(agg[i].fights / agg[i].runs).toFixed(2).padStart(5)}  ${((agg[i].losses / agg[i].fights) * 100).toFixed(0).padStart(4)}%  ${med(agg[i].wins).toFixed(1)}`);
}
if (env.CALIB) {
  console.log('fightOdds calibration (odds bucket: win rate, fights)');
  for (const [b, [w, n]] of Object.entries(calib).sort((a, b) => a[0] - b[0])) console.log(`  ${(b / 5).toFixed(1)}-${((Number(b) + 1) / 5).toFixed(1)}: ${((w / n) * 100).toFixed(0)}% of ${n}`);
}
