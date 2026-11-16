// App Store screenshots: 6 per language, each a real capture of the running web build (no mockups) under a
// translated caption band (docs/PLAN_BUILD_19.md P0-D). No two shots share the same lower half.
// Run: (dev server on :5199)  NODE_PATH=$(npm root -g) node scripts/store-screenshots.cjs
// Output: store/screenshots/<lang>/<size>/NN_name.png for lang in en,tr and size 69 (1320x2868) / 65 (1242x2688).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { buildSync } = require('esbuild');

const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const URL = process.env.URL || 'http://localhost:5199';
const LANGS = (process.env.LANGS || 'en,tr').split(',');
const OUT = { '69': { w: 1320, h: 2868 }, '65': { w: 1242, h: 2688 } };
const CAPTURE = { w: 390, h: 844, scale: 3 }; // iPhone 14/15 points; composed below the caption band
const today = new Date().toLocaleDateString('en-CA');

// Real game data (stage opponents, skills, gym prices) so the shots show honest numbers
const entry = path.join(require('os').tmpdir(), 'ss-entry.ts');
const bundle = path.join(require('os').tmpdir(), 'ss-data.cjs');
fs.writeFileSync(entry, `export { getStageData } from '${path.resolve('src/core/stageDatabase.ts')}';
export { SKILL_DATABASE } from '${path.resolve('src/core/skillDatabase.ts')}';
export { gymCostAt, GYM_TEMPLATES } from '${path.resolve('src/core/progression.ts')}';
export { ACHIEVEMENTS } from '${path.resolve('src/core/achievements.ts')}';`);
buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, logLevel: 'error' });
const { getStageData, SKILL_DATABASE, gymCostAt, GYM_TEMPLATES, ACHIEVEMENTS } = require(bundle);

const GYM_IDS = ['gym_punching_bag', 'gym_bench_press', 'gym_agility_ladder', 'gym_reflex_ball', 'gym_jump_rope'];
const gymLevel = (world) => 8 + Math.min(world, 6) * 5;
const GYM = (world) => GYM_TEMPLATES.map((g) => ({ ...g, level: gymLevel(world) }));
// Wallet below the cheapest gym price, so no "you can afford" hint or badge clutters the shot
const walletFor = (world) => Math.round(Math.min(...GYM_IDS.map((id) => gymCostAt(id, gymLevel(world)))) * 0.8);

// Player stats from each shot's real opponent: the fight lasts long enough to photograph and the chip stays honest
const statsFor = (world, sub, hard) => {
  const o = getStageData(world, sub).opponent.stats;
  const atk = Math.max(10, Math.round(o.maxHp / 16));
  const hp = Math.max(150, Math.round(o.atk * (hard ? 26 : 45)));
  return { hp, maxHp: hp, atk, def: o.def, spd: o.spd, critRate: 18, critDmg: 1.7, comboRate: 18, dodgeRate: 8, lifesteal: 0, stamina: 100, powerScore: 1 };
};
const gear = (slot, rarity, atk, hp) => ({ id: `shot_${slot}`, name: `${rarity.toUpperCase()} ${slot}`, slot, rarity, level: 30, stats: { hp, atk, def: 20, spd: 4, critRate: 6, critDmg: 0, comboRate: 5, dodgeRate: 3, lifesteal: 0, stamina: 0 }, powerScore: Math.round(hp * 0.4 + atk * 3.5 + 170), sellPrice: 400, iconName: 'Flame' });
const GEAR = { head: gear('head', 'legendary', 30, 420), gloves: gear('gloves', 'mythic', 90, 120), mouth: null, robe: gear('robe', 'epic', 20, 520), shorts: gear('shorts', 'rare', 15, 300), boots: gear('boots', 'legendary', 25, 260), belt: gear('belt', 'epic', 35, 340), weapon: null, partner: null };
const skill = (id, level) => ({ ...SKILL_DATABASE.find((s) => s.id === id), level });
const DECK = [skill('skill_flurry_master', 4), skill('skill_iron_chin', 3), skill('skill_vampiric_bite', 3), skill('skill_chain_lightning', 2), skill('skill_sixth_sense', 2), skill('skill_berserk_trance', 1)];
const ACH = ACHIEVEMENTS.map((a) => a.id); // all claimed, so the "rewards to claim" card stays out of the shots

const CAPTIONS = {
  en: [['Boss fights', 'worth watching'], ['Unleash your', 'SUPER'], ['Pick 1 of 3 skills', 'build your style'], ['Collect & upgrade', 'your gear'], ['Train hard,', 'hit harder'], ['Climb from Bronze', 'to Legend']],
  tr: [['İzlemeye değer', 'boss dövüşleri'], ['SÜPER vuruşunu', 'patlat'], ['3 yetenekten', 'birini seç'], ['Ekipman topla,', 'güçlen'], ['Sıkı çalış,', 'sert vur'], ['Bronz’dan', 'Efsane’ye yüksel']],
};

// world/sub = stage on screen; tab/view = what fills the lower half; act = a moment staged in the page
const SHOTS = [
  { name: '01_boss_fight', world: 4, sub: 10, league: 0, tab: 'arena', view: 'stages', wait: 5200 },
  { name: '02_super', world: 2, sub: 3, league: 0, tab: 'gear', view: 'skills', wait: 2500, act: 'super' },
  { name: '03_skill_draft', world: 3, sub: 2, league: 0, wait: 2500, act: 'draft' },
  { name: '04_gear', world: 5, sub: 2, league: 0, tab: 'gear', view: 'gear', wait: 3200 },
  { name: '05_gym', world: 1, sub: 2, league: 0, tab: 'gym', wait: 1800 },
  { name: '06_league', world: 6, sub: 1, league: 1, wait: 2500, act: 'promotion' },
];

async function capture(b, lang, s) {
  const ctx = await b.newContext({ viewport: { width: CAPTURE.w, height: CAPTURE.h }, deviceScaleFactor: CAPTURE.scale, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  const save = {
    lang, saveVersion: 6, lastDailyLoginDate: today, dailyLoginStreak: 1, claimedDailyDays: [1], tutorialStep: 99,
    coins: walletFor(s.world), gems: 340, playerLevel: 18 + s.world * 4, gymTrainings: GYM(s.world), claimedAchievements: ACH,
    notifAsked: true, currentWorld: s.world, currentSubStage: s.sub, highestWorld: s.world, highestSubStage: s.sub, league: s.league,
    autoBattle: true, autoAdvance: false,
    playerFighter: { baseStats: statsFor(s.world, s.sub, s.sub === 10), equipped: GEAR, equippedSkills: DECK },
  };
  await p.addInitScript((sv) => localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify(sv)), save);
  await p.goto(URL);
  await p.waitForTimeout(s.wait);
  await p.evaluate(() => { const g = window.__game; (g.getState().dailyQuests || []).forEach((q) => { q.claimed = true; }); g.notify(); });
  if (s.tab) { await p.locator(`nav [data-tab=${s.tab}]`).click(); await p.waitForTimeout(600); }
  if (s.view) { await p.locator(`[data-view=${s.view}]`).first().click().catch(() => {}); await p.waitForTimeout(600); }
  if (s.act === 'draft') {
    await p.evaluate(() => { window.__game.openSkillDraft(true); window.__game.notify(); });
    await p.waitForSelector('[data-draft-option]', { timeout: 5000 });
    await p.waitForTimeout(700);
  } else if (s.act === 'super') {
    await p.evaluate(async () => {
      const until = performance.now() + 12000;
      while (performance.now() < until && window.__battleRig.cine?.kind !== 'super') { window.__fight.fillRage(); await new Promise((r) => setTimeout(r, 16)); }
    });
    await p.waitForTimeout(Number(process.env.SUPER_MS || 450));
  } else if (s.act === 'promotion') {
    await p.evaluate(() => { const g = window.__game; g.getState().pendingPromotion = { league: 1, gems: 150, coins: 41100 }; g.notify(); });
    await p.waitForSelector('[data-league-promotion]', { timeout: 5000 });
    await p.waitForTimeout(900);
  }
  const png = await p.screenshot();
  await ctx.close();
  return png;
}

async function compose(b, png, caption, size) {
  const { w, h } = OUT[size];
  const band = Math.round(h * 0.2);
  const pad = Math.round(h * 0.022);
  const imgH = h - band - pad;
  const imgW = Math.round(imgH * (CAPTURE.w / CAPTURE.h));
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const fs1 = Math.round(w * 0.082);
  await p.setContent(`<!doctype html><html><body style="margin:0;width:${w}px;height:${h}px;overflow:hidden;
    background:radial-gradient(120% 60% at 50% 0%, #4a2a05 0%, #1a1206 45%, #09090c 100%);font-family:'Inter Display','Inter',sans-serif">
    <div style="height:${band}px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 ${Math.round(w * 0.06)}px;box-sizing:border-box">
      <div style="font-weight:900;font-size:${fs1}px;line-height:1.08;color:#fff;letter-spacing:-0.01em;text-shadow:0 6px 30px rgba(0,0,0,.6)">${caption[0]}</div>
      <div style="font-weight:900;font-size:${fs1}px;line-height:1.08;color:#fbbf24;letter-spacing:-0.01em;text-shadow:0 6px 30px rgba(245,158,11,.35)">${caption[1]}</div>
    </div>
    <div style="display:flex;justify-content:center">
      <img src="data:image/png;base64,${png.toString('base64')}" style="width:${imgW}px;height:${imgH}px;border-radius:${Math.round(imgW * 0.07)}px ${Math.round(imgW * 0.07)}px 0 0;
        box-shadow:0 0 0 ${Math.round(w * 0.006)}px rgba(255,255,255,.14),0 30px 90px rgba(0,0,0,.7);object-fit:cover;object-position:top">
    </div></body></html>`);
  await p.evaluate(() => document.fonts.ready);
  const out = await p.screenshot();
  await ctx.close();
  return out;
}

(async () => {
  const b = await chromium.launch({ args: GL });
  for (const lang of LANGS) {
    for (const size of Object.keys(OUT)) {
      const dir = `store/screenshots/${lang}/${size}`;
      fs.mkdirSync(dir, { recursive: true });
      for (const f of fs.readdirSync(dir)) if (f.endsWith('.png')) fs.unlinkSync(path.join(dir, f));
    }
    for (const [i, s] of SHOTS.entries()) {
      const raw = await capture(b, lang, s);
      for (const size of Object.keys(OUT)) fs.writeFileSync(`store/screenshots/${lang}/${size}/${s.name}.png`, await compose(b, raw, CAPTIONS[lang][i], size));
      console.log('done', lang, s.name);
    }
  }
  await b.close();
})();
