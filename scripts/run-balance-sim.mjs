// Runs scripts/balance-sim.ts for several seeds and prints the progression curve.
// Options (env): FIGHTS=1500 RUNS=10 BAL='{"boss":1.2}' COMBAT='{"defK":0.5}' DETAIL=30
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const out = join(mkdtempSync(join(tmpdir(), 'sim-')), 'sim.mjs');
await build({ entryPoints: ['scripts/balance-sim.ts'], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'error' });
const { simulate } = await import(pathToFileURL(out).href);

const RUNS = Number(process.env.RUNS || 10);
const FIGHTS = Number(process.env.FIGHTS || 1500);
const balance = process.env.BAL ? JSON.parse(process.env.BAL) : {};
const combat = process.env.COMBAT ? JSON.parse(process.env.COMBAT) : {};
const agg = {};
const reach = {};
let highestSum = 0;
for (let seed = 1; seed <= RUNS; seed++) {
  const r = simulate({ seed, maxFights: FIGHTS, balance, combat });
  highestSum += r.highest;
  for (const [n, sec] of Object.entries(r.reachedAt)) (reach[n] ||= []).push(sec);
  for (const [idx, s] of Object.entries(r.perStage)) {
    const a = (agg[idx] ||= { fights: 0, losses: 0, runs: 0, wins: [], boss: s.boss });
    a.fights += s.fights; a.losses += s.losses; a.runs++; a.wins.push(...s.winSecs);
  }
}
const med = (arr) => { if (!arr.length) return NaN; const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const stages = Object.keys(agg).map(Number).sort((a, b) => a - b);
console.log(`runs=${RUNS} fights/run=${FIGHTS} avgHighestStage=${(highestSum / RUNS).toFixed(1)} balance=${JSON.stringify(balance)} combat=${JSON.stringify(combat)}`);
console.log('stages    tries/stage  normal%  sub-boss%  boss%   median win (s, 1x)');
for (let lo = 1; lo <= 200; lo += 10) {
  let f = 0, n = 0; const L = { normal: [0, 0], sub: [0, 0], boss: [0, 0] }; const wins = [];
  for (const i of stages) if (i >= lo && i <= lo + 9) {
    const a = agg[i]; f += a.fights; n += a.runs; wins.push(...a.wins);
    const kind = i % 10 === 0 ? 'boss' : i % 10 === 5 ? 'sub' : 'normal';
    L[kind][0] += a.losses; L[kind][1] += a.fights;
  }
  if (!n) continue;
  const pct = (k) => (L[k][1] ? `${((L[k][0] / L[k][1]) * 100).toFixed(0)}%` : '-').padStart(7);
  console.log(`${String(lo).padStart(3)}-${String(lo + 9).padEnd(4)}  ${(f / n).toFixed(2).padStart(8)}   ${pct('normal')}   ${pct('sub')}  ${pct('boss')}   ${med(wins).toFixed(1).padStart(6)}`);
}
console.log('time to reach stage (game time at 1x, median over runs that got there):');
for (const n of [10, 25, 50, 75, 100, 150]) {
  const r = reach[n] || [];
  console.log(`  stage ${String(n).padStart(3)}: ${r.length}/${RUNS} runs, ${r.length ? (med(r) / 3600).toFixed(2) + ' h' : '-'}`);
}
if (process.env.DETAIL) {
  console.log('stage  tries  loss%  medianWin');
  for (const i of stages.slice(0, Number(process.env.DETAIL))) console.log(`${String(i).padStart(4)}   ${(agg[i].fights / agg[i].runs).toFixed(2).padStart(5)}  ${((agg[i].losses / agg[i].fights) * 100).toFixed(0).padStart(4)}%  ${med(agg[i].wins).toFixed(1)}`);
}
