import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const out = join(mkdtempSync(join(tmpdir(), 'sim-')), 'sim.mjs');
await build({ entryPoints: ['scripts/balance-sim.ts'], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'error' });
const { simulate } = await import(pathToFileURL(out).href);

const RUNS = 12;
const FIGHTS = Number(process.env.FIGHTS || 400);
const agg = {};
let hours = 0, levels = 0, highestSum = 0;
for (let seed = 1; seed <= RUNS; seed++) {
  const r = simulate({ seed, maxFights: FIGHTS, gymWeight: 1 });
  hours += r.seconds / 3600; levels += r.level; highestSum += r.highest;
  for (const [idx, s] of Object.entries(r.perStage)) {
    const a = (agg[idx] ||= { fights: 0, losses: 0, runs: 0, cleared: 0 });
    a.fights += s.fights; a.losses += s.losses; a.runs++; if (s.firstClearFight > 0) a.cleared++;
  }
}
const stages = Object.keys(agg).map(Number).sort((a, b) => a - b);
const range = (lo, hi) => {
  let f = 0, l = 0, n = 0;
  for (const i of stages) if (i >= lo && i <= hi) { f += agg[i].fights; l += agg[i].losses; n += agg[i].runs; }
  return n ? { attempts: f / n, loss: l / f } : null;
};
console.log(`runs=${RUNS} fights/run=${FIGHTS} avgPlayHours=${(hours / RUNS).toFixed(2)} avgLevel=${(levels / RUNS).toFixed(1)} avgHighestStage=${(highestSum / RUNS).toFixed(1)}`);
console.log('range      attempts/stage  loss%');
for (let lo = 1; lo <= 150; lo += 10) {
  const r = range(lo, lo + 9);
  if (r) console.log(`${String(lo).padStart(3)}-${String(lo + 9).padEnd(4)}   ${r.attempts.toFixed(2).padStart(8)}     ${(r.loss * 100).toFixed(0).padStart(4)}%`);
}
const walls = stages.filter((i) => agg[i].losses / agg[i].fights > 0.5 && agg[i].runs >= 3);
console.log('walls (>50% loss):', walls.length ? walls.join(', ') : 'none');
console.log('milestone: median fights to first clear of stage N');
for (const n of [5, 10, 25, 50, 75, 100]) {
  const c = agg[n]; console.log(`  stage ${n}: reached by ${c ? c.runs : 0}/${RUNS} runs, avg attempts ${c ? (c.fights / c.runs).toFixed(1) : '-'}`);
}
if (process.env.DETAIL) {
  console.log('stage  attempts  loss%');
  for (const i of stages.slice(0, Number(process.env.DETAIL))) console.log(`${String(i).padStart(4)}   ${(agg[i].fights / agg[i].runs).toFixed(2).padStart(6)}   ${((agg[i].losses / agg[i].fights) * 100).toFixed(0).padStart(4)}%`);
}
