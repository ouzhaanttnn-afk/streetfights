// Captures App Store screenshot DRAFTS from the running web build (real UI, real rendering; no mockups).
// iPhone 6.9" = 1320x2868. Replace with captures from a real device/simulator before submitting if you can.
// Run: (dev server on :5199)  NODE_PATH=$(npm root -g) node scripts/store-screenshots.cjs
// Output: store/screenshots/<lang>/<size>/NN_name.png for lang in en,tr and size 69 (1320x2868) / 65 (1242x2688).
const { chromium } = require('playwright');
const GL = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
const today = new Date().toLocaleDateString('en-CA');
const strong = { hp: 8000, maxHp: 8000, atk: 170, def: 700, spd: 28, critRate: 25, critDmg: 1.7, comboRate: 25, dodgeRate: 8, lifesteal: 0, stamina: 100, powerScore: 1 };
const LANGS = (process.env.LANGS || 'en,tr').split(',');
const SIZES = { '69': { w: 440, h: 956 }, '65': { w: 414, h: 896 } };
const fs = require('fs');
// Late-game-looking wallet without the "next step" hint/badges cluttering the store shots
// Gym level grows with the world; the wallet stays below 3x the cheapest price, so no hint card or gym badge shows
const gymLevel = (world) => 8 + world * 6;
const GYM = (world) => [['gym_punching_bag','atk',3,'Flame'],['gym_bench_press','hp',25,'Heart'],['gym_agility_ladder','spd',2,'Wind'],['gym_reflex_ball','critRate',0.8,'Crosshair'],['gym_jump_rope','dodgeRate',0.7,'Footprints']]
  .map(([id, targetStat, statGain, iconName]) => ({ id, name: id, description: '', targetStat, statGain, level: gymLevel(world), cost: 999999, iconName }));
const walletFor = (world) => Math.round(30 * Math.pow(1.22, gymLevel(world) - 1) * 2.5);
// Player stats derived from each shot's real opponent so the fight lasts ~15 s and the difficulty chip is honest
const { buildSync } = require('esbuild');
const stageBundle = require('path').join(require('os').tmpdir(), 'ss-stage.cjs');
buildSync({ entryPoints: ['src/core/stageDatabase.ts'], bundle: true, platform: 'node', format: 'cjs', outfile: stageBundle, logLevel: 'error' });
const { getStageData } = require(stageBundle);
const statsFor = (save, hard) => {
  const o = getStageData(save.currentWorld, save.currentSubStage).opponent.stats;
  const L = gymLevel(save.currentWorld);
  const pct = 1 + (L - 1) * 0.015; // gym ATK/HP percentage bonus
  const grow = Math.pow(1.4, Math.floor(L / 5));
  const flatAtk = (L - 1) * 3 * grow, flatHp = (L - 1) * 25 * grow;
  const atk = Math.max(10, Math.round(o.maxHp / 14 / pct - flatAtk));
  const hp = Math.max(150, Math.round((o.atk * (hard ? 22 : 45)) / pct - flatHp));
  return { ...strong, atk, def: o.def, spd: o.spd, hp, maxHp: hp };
};
// Colourful late-game gear for the shots (real items: icon + 3D model come from slot + rarity)
const gear = (slot, rarity, atk, hp) => ({ id: `shot_${slot}`, name: `${rarity.toUpperCase()} ${slot}`, slot, rarity, level: 30, stats: { hp, atk, def: 20, spd: 4, critRate: 6, critDmg: 0, comboRate: 5, dodgeRate: 3, lifesteal: 0, stamina: 0 }, powerScore: Math.round(hp * 0.4 + atk * 3.5 + 56 + 10 + 48 + 35 + 21), sellPrice: 400, iconName: 'Flame' });
const GEAR = { head: gear('head', 'legendary', 30, 420), gloves: gear('gloves', 'mythic', 90, 120), mouth: null, robe: gear('robe', 'epic', 20, 520), shorts: gear('shorts', 'rare', 15, 300), boots: gear('boots', 'legendary', 25, 260), belt: gear('belt', 'epic', 35, 340), weapon: null, partner: null };
// Achievements already claimed so the "rewards to claim" hint does not sit in every shot
const ACH = [...require('fs').readFileSync('src/core/achievements.ts', 'utf8').matchAll(/id: '([a-z_0-9]+)'/g)].map((m) => m[1]);
// hp per shot keeps the power comparison honest (rival vs. you) while fights still last long enough to photograph
const shots = [
  { name: '01_alley_battle', save: { currentWorld: 1, currentSubStage: 2 }, wait: 2600 },
  { name: '02_cage_battle', save: { currentWorld: 2, currentSubStage: 3 }, wait: 3000 },
  { name: '03_neon_club', save: { currentWorld: 3, currentSubStage: 2 }, hp: 22000, wait: 3200 },
  { name: '04_ring_boss', save: { currentWorld: 4, currentSubStage: 10 }, hp: 135000, wait: 4200 },
  { name: '05_stadium', save: { currentWorld: 5, currentSubStage: 2 }, hp: 115000, wait: 3600 },
  { name: '06_skills_tab', save: { currentWorld: 3, currentSubStage: 2 }, hp: 22000, tab: 'gear', view: 'skills', wait: 3000 },
  { name: '07_arena_quests', save: { currentWorld: 2, currentSubStage: 3 }, tab: 'arena', view: 'quests', wait: 3000 },
];
(async () => {
  const b = await chromium.launch({ args: GL });
  for (const lang of LANGS) for (const [size, vp] of Object.entries(SIZES)) {
    fs.mkdirSync(`store/screenshots/${lang}/${size}`, { recursive: true });
    for (const s of shots) {
      const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
      const p = await ctx.newPage();
      const base = statsFor(s.save, s.save.currentSubStage === 10);
      const wallet = walletFor(s.save.currentWorld);
      const gymSet = GYM(s.save.currentWorld);
      await p.addInitScript(([save, d, base, lang, gym, ach, gear, wallet]) => {
        localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify({ lang, lastDailyLoginDate: d, dailyLoginStreak: 1, claimedDailyDays: [1], tutorialStep: 99, coins: wallet, gems: 340, playerLevel: 18 + save.currentWorld * 4, gymTrainings: gym, claimedAchievements: ach, notifAsked: true, highestWorld: save.currentWorld, highestSubStage: save.currentSubStage, playerFighter: { baseStats: base, equipped: gear }, ...save }));
      }, [s.save, today, base, lang, gymSet, ACH, GEAR, wallet]);
      await p.goto(process.env.URL || 'http://localhost:5199');
      await p.waitForTimeout(s.wait);
      if (s.tab !== undefined) { await p.locator(`nav [data-tab=${s.tab}]`).click(); await p.waitForTimeout(700); }
      if (s.view !== undefined) { await p.locator(`[data-view=${s.view}]`).click(); await p.waitForTimeout(700); }
      await p.screenshot({ path: `store/screenshots/${lang}/${size}/${s.name}.png` });
      await ctx.close();
    }
    console.log('done', lang, size);
  }
  await b.close();
})();
