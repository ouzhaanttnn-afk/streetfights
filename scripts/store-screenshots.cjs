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
const shots = [
  { name: '01_alley_battle', save: { currentWorld: 1, currentSubStage: 2 }, wait: 2600 },
  { name: '02_cage_battle', save: { currentWorld: 2, currentSubStage: 3 }, wait: 3000 },
  { name: '03_neon_club', save: { currentWorld: 3, currentSubStage: 2 }, wait: 3200 },
  { name: '04_ring_boss', save: { currentWorld: 4, currentSubStage: 10 }, wait: 4200 },
  { name: '05_stadium', save: { currentWorld: 5, currentSubStage: 2 }, wait: 3600 },
  { name: '06_skills_tab', save: { currentWorld: 3, currentSubStage: 2 }, tab: 'gear', view: 'skills', wait: 3000 },
  { name: '07_arena_quests', save: { currentWorld: 2, currentSubStage: 3 }, tab: 'arena', view: 'quests', wait: 3000 },
];
(async () => {
  const b = await chromium.launch({ args: GL });
  for (const lang of LANGS) for (const [size, vp] of Object.entries(SIZES)) {
    fs.mkdirSync(`store/screenshots/${lang}/${size}`, { recursive: true });
    for (const s of shots) {
      const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
      const p = await ctx.newPage();
      await p.addInitScript(([save, d, strong, lang]) => {
        localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify({ lang, lastDailyLoginDate: d, dailyLoginStreak: 1, claimedDailyDays: [1], tutorialStep: 99, highestWorld: save.currentWorld, highestSubStage: save.currentSubStage, playerFighter: { baseStats: strong }, ...save }));
      }, [s.save, today, strong, lang]);
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
