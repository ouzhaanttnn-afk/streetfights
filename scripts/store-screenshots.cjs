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
const GYM = [['gym_punching_bag','atk',3,'Flame'],['gym_bench_press','hp',25,'Heart'],['gym_agility_ladder','spd',2,'Wind'],['gym_reflex_ball','critRate',0.8,'Crosshair'],['gym_jump_rope','dodgeRate',0.7,'Footprints']]
  .map(([id, targetStat, statGain, iconName]) => ({ id, name: id, description: '', targetStat, statGain, level: 12, cost: 999999, iconName }));
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
      const base = { ...strong, hp: s.hp || strong.hp, maxHp: s.hp || strong.maxHp };
      await p.addInitScript(([save, d, base, lang, gym, ach]) => {
        localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify({ lang, lastDailyLoginDate: d, dailyLoginStreak: 1, claimedDailyDays: [1], tutorialStep: 99, coins: 48250, gems: 340, playerLevel: 18 + save.currentWorld * 4, gymTrainings: gym, claimedAchievements: ach, notifAsked: true, highestWorld: save.currentWorld, highestSubStage: save.currentSubStage, playerFighter: { baseStats: base }, ...save }));
      }, [s.save, today, base, lang, GYM, ACH]);
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
