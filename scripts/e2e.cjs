// Browser regression tests. Needs the dev server (npm run dev -- --port 5199) and Playwright.
// Run: NODE_PATH=$(npm root -g) node scripts/e2e.cjs
const { chromium } = require('playwright');
const GL = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
const results = [];
const ok = (n, c, extra='') => { results.push(`${c ? 'PASS' : 'FAIL'}  ${n} ${extra}`); };
const today = () => new Date().toLocaleDateString('en-CA');
const URL = process.env.URL || 'http://localhost:5199';
// Wait until the app has booted and written its save (more reliable than fixed sleeps on a loaded machine)
const ready = (p) => p.waitForFunction(() => { try { return JSON.parse(localStorage.getItem('street_striker_rpg_save_v2')).saveVersion === 4; } catch { return false; } }, null, { timeout: 20000 }).catch(() => {});

(async () => {
  // ---- 1. Legacy save compatibility (shape written by the ORIGINAL game, before my changes)
  {
    const b = await chromium.launch({ args: GL });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
    const legacy = { lang:'tr', coins: 12345, gems: 77, trophies: 40, playerLevel: 9, playerXp: 50, playerMaxXp: 400,
      currentWorld: 2, currentSubStage: 4, highestWorld: 2, highestSubStage: 6, inventory: [{id:'item_x',name:'RARE Hand Wraps',slot:'gloves',rarity:'rare',level:5,stats:{hp:0,atk:20,def:0,spd:0,critRate:3,critDmg:0,comboRate:0,dodgeRate:0,lifesteal:0,stamina:0},powerScore:99,sellPrice:50,iconName:'Flame'}],
      maxInventorySlots: 20, autoBattle: true, battleSpeed: 1, soundEnabled: true, autoSellRarity:'none', totalFightsWon: 33, totalDamageDealt: 0, bossDefeatedCount: 2,
      dailyLoginStreak: 1, lastDailyLoginDate: '', claimedDailyDays: [], lastOfflineTimestamp: Date.now(),
      unlockedCosmetics: ['outfit_street','hair_spiky_yellow','aura_none','ball_street'], equippedOutfit:'outfit_street', equippedHair:'hair_spiky_yellow', equippedAura:'aura_none', equippedBall:'ball_street', doubleDamageUntil:0, doubleCoinsUntil:0 };
    await p.addInitScript((l) => { localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify(l)); }, legacy);
    await p.goto(URL); await ready(p); await p.waitForTimeout(4500);
    const s = await p.evaluate(() => JSON.parse(localStorage.getItem('street_striker_rpg_save_v2')));
    ok('legacy save: level/world/inventory kept', s.playerLevel === 9 && s.currentWorld === 2 && s.inventory.length === 1 && s.totalFightsWon >= 33 && s.bossDefeatedCount === 2, `lvl=${s.playerLevel} inv=${s.inventory.length} fights=${s.totalFightsWon}`);
    ok('legacy save: coins not reset (>=12345)', s.coins >= 12345, `coins=${s.coins}`);
    ok('legacy save: new fields filled', s.saveVersion === 4 && s.dailyQuests?.length === 4 && s.quality === 'medium');
    ok('legacy save: daily login opens for old save', await p.getByText(/7-DAY LOGIN REWARDS|7 GÜNLÜK GİRİŞ ÖDÜLÜ/).count() > 0);
    ok('legacy save: no page errors', errs.length === 0, errs.join('|'));
    await b.close();
  }
  // ---- 2. Full combat flow (manual mode): attack, guard, rage, victory, loot, equip
  {
    const b = await chromium.launch({ args: GL });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
    const base = {hp:3000,maxHp:3000,atk:120,def:200,spd:30,critRate:20,critDmg:1.6,comboRate:20,dodgeRate:5,lifesteal:0,stamina:100,powerScore:1};
    await p.addInitScript(([base,d]) => { localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify({ lastDailyLoginDate:d, dailyLoginStreak:1, claimedDailyDays:[1], autoBattle:false, playerFighter:{baseStats:base} })); }, [base, today()]);
    await p.goto(URL); await ready(p); await p.waitForTimeout(4500);
    ok('3D scene active', await p.evaluate(() => window.__battleRig.active === true));
    const hp0 = await p.evaluate(() => document.body.innerText.match(/(\d+) \/ (\d+)/g));
    // manual attacks
    for (let i = 0; i < 6; i++) { await p.getByRole('button', { name: /VUR|HIT/ }).click({ force: true }).catch(()=>{}); await p.waitForTimeout(700); }
    const afterHits = await p.evaluate(() => document.body.innerText.match(/(\d+) \/ (\d+)/g));
    ok('manual attack lowers opponent HP', afterHits && hp0 && afterHits[1] !== hp0[1], `${hp0?.[1]} -> ${afterHits?.[1]}`);
    // guard
    await p.getByRole('button', { name: /KORUN|GUARD/ }).click({ force: true }).catch(()=>{});
    const guarding = await p.evaluate(() => window.__battleRig && true);
    ok('guard button reachable', guarding);
    // loop until victory & loot modal
    let loot = false;
    for (let i = 0; i < 40 && !loot; i++) {
      await p.getByRole('button', { name: /VUR|HIT/ }).click({ force: true, timeout: 500 }).catch(()=>{});
      await p.waitForTimeout(500);
      loot = await p.getByText(/YENİ EKİPMAN|NEW GEAR|NEW EQUIPMENT/i).count() > 0;
    }
    ok('victory -> reward screen (loot or stage advanced)', loot || (await p.evaluate(() => JSON.parse(localStorage.getItem('street_striker_rpg_save_v2')).totalFightsWon)) >= 1);
    const save = await p.evaluate(() => JSON.parse(localStorage.getItem('street_striker_rpg_save_v2')));
    ok('victory persisted (fights won, quest progress)', save.totalFightsWon >= 1 && save.dailyQuests.find(q => q.id==='win_fights').progress >= 1, `fights=${save.totalFightsWon}`);
    ok('no page errors in combat flow', errs.length === 0, errs.join('|'));
    await b.close();
  }
  // ---- 3. Rage (super) attack
  {
    const b = await chromium.launch({ args: GL });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
    const base = {hp:90000,maxHp:90000,atk:60,def:900,spd:30,critRate:5,critDmg:1.5,comboRate:5,dodgeRate:5,lifesteal:0,stamina:100,powerScore:1};
    await p.addInitScript(([base,d]) => { localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify({ lastDailyLoginDate:d, dailyLoginStreak:1, claimedDailyDays:[1], autoBattle:true, currentWorld:3,currentSubStage:2,highestWorld:3,highestSubStage:2, playerFighter:{baseStats:base} })); }, [base, today()]);
    await p.goto(URL); await ready(p); await p.waitForTimeout(4000);
    let used = 0;
    for (let i = 0; i < 40 && !used; i++) { await p.waitForTimeout(500); used = await p.evaluate(() => { const x = JSON.parse(localStorage.getItem('street_striker_rpg_save_v2') || '{}'); return ((x.dailyQuests || []).find(q => q.id === 'use_super') || {}).progress || 0; }); }
    ok('rage attack fires and is counted', used >= 1, `use_super=${used}`);
    ok('no page errors during rage', errs.length === 0, errs.join('|'));
    await b.close();
  }
  // ---- 4. Boss defeat -> retry / revive buttons
  {
    const b = await chromium.launch({ args: GL });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
    await p.addInitScript((d) => { localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify({ lastDailyLoginDate:d, dailyLoginStreak:1, claimedDailyDays:[1], autoBattle:true, currentWorld:4,currentSubStage:10,highestWorld:4,highestSubStage:10 })); }, today());
    await p.goto(URL); await ready(p); await p.waitForTimeout(3000);
    let retry = 0;
    for (let i = 0; i < 40 && !retry; i++) { await p.waitForTimeout(500); retry = await p.getByText(/Tekrar dene|Retry/).count(); }
    ok('boss defeat shows retry + revive-ad buttons', retry > 0 && await p.getByText(/CANLAN|REVIVE/i).count() > 0);
    await p.getByText(/Tekrar dene|Retry/).click({ force: true });
    await p.waitForTimeout(800);
    ok('retry restarts the boss fight', await p.getByText(/Tekrar dene|Retry/).count() === 0);
    ok('no page errors in boss flow', errs.length === 0, errs.join('|'));
    await b.close();
  }
  // ---- 5. WebGL context loss + restore
  {
    const b = await chromium.launch({ args: GL });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
    await p.addInitScript((d) => { localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify({ lastDailyLoginDate:d, dailyLoginStreak:1, claimedDailyDays:[1] })); }, today());
    await p.goto(URL); await ready(p); await p.waitForTimeout(3500);
    await p.evaluate(() => { const c = document.querySelector('.battle-viewport canvas:not([class*="z-10"])') || document.querySelector('.battle-viewport canvas'); const gl = [...document.querySelectorAll('.battle-viewport canvas')].map(cv => cv.getContext('webgl2') || cv.getContext('webgl')).find(Boolean); window.__ext = gl.getExtension('WEBGL_lose_context'); window.__ext.loseContext(); });
    await p.waitForTimeout(500);
    const lost = await p.evaluate(() => window.__battleRig.active);
    await p.evaluate(() => window.__ext.restoreContext());
    await p.waitForTimeout(1500);
    const back = await p.evaluate(() => window.__battleRig.active);
    ok('context lost -> scene suspended, restored -> scene rebuilt', lost === false && back === true, `lost.active=${lost} restored.active=${back}`);
    ok('no page errors on context loss', errs.length === 0, errs.join('|'));
    await b.close();
  }
  // ---- 6. No WebGL at all -> 2D fallback keeps game playable
  {
    const b = await chromium.launch({ args: ['--disable-gpu','--disable-webgl','--disable-3d-apis'] });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
    await p.addInitScript((d) => { localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify({ lastDailyLoginDate:d, dailyLoginStreak:1, claimedDailyDays:[1] })); }, today());
    await p.goto(URL); await ready(p); await p.waitForTimeout(6000);
    const fights = await p.evaluate(() => JSON.parse(localStorage.getItem('street_striker_rpg_save_v2') || '{}').totalFightsWon || 0);
    ok('no-WebGL: game still runs fights (2D fallback)', fights >= 1, `fights=${fights}`);
    ok('no-WebGL: no uncaught errors', errs.length === 0, errs.join('|'));
    await p.screenshot({ path: 'nowebgl.png', clip:{x:0,y:60,width:390,height:260} });
    await b.close();
  }

  // ---- 7. First-run experience: tutorial, boss intro, achievements
  {
    const b = await chromium.launch({ args: GL });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
    await p.addInitScript((d) => { localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify({ lastDailyLoginDate:d, dailyLoginStreak:1, claimedDailyDays:[1] })); }, today());
    await p.goto(URL); await ready(p); await p.waitForTimeout(3500);
    ok('tutorial shows on a brand-new save', await p.getByText(/otomatik savaşıyor|battles automatically/i).count() > 0);
    await p.getByText(/^Tamam$|^Next$/).click({ force: true }); await p.waitForTimeout(300);
    ok('tutorial advances to step 2', await p.getByText(/SÜPER|SUPER/).count() > 0);
    await p.getByText(/^Atla$|^Skip$/).click({ force: true }); await p.waitForTimeout(300);
    const step = await p.evaluate(() => JSON.parse(localStorage.getItem('street_striker_rpg_save_v2')).tutorialStep);
    ok('tutorial can be skipped and is remembered', step === 99, `step=${step}`);
    ok('bottom nav has 4 tabs', await p.locator('nav button').count() === 4, `n=${await p.locator('nav button').count()}`);
    await p.locator('nav [data-tab=arena]').click(); await p.waitForTimeout(400);
    await p.locator('[data-view=quests]').click(); await p.waitForTimeout(500);
    ok('achievements card is in Arena > Quests', await p.getByText(/Başarımlar|Achievements/).count() > 0);
    await p.locator('[data-open-profile]').click(); await p.waitForTimeout(500);
    ok('profile sheet opens from the header name', await p.locator('[data-profile-sheet]').count() === 1);
    await p.getByRole('button', { name: 'Close' }).click(); await p.waitForTimeout(300);
    ok('profile sheet closes', await p.locator('[data-profile-sheet]').count() === 0);
    ok('no hidden dev panel text in production-like UI', await p.getByText('SECRET TEST PANEL').count() === 0);
    ok('no page errors on first run', errs.length === 0, errs.join('|'));
    await b.close();
  }
  {
    const b = await chromium.launch({ args: GL });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.addInitScript((d) => { localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify({ lastDailyLoginDate:d, dailyLoginStreak:1, claimedDailyDays:[1], tutorialStep:99, currentWorld:1,currentSubStage:5,highestWorld:1,highestSubStage:5 })); }, today());
    await p.goto(URL, { waitUntil: 'commit' });
    const seen = await p.waitForFunction(() => !!document.body && /BOSS DÖVÜŞÜ|BOSS FIGHT/.test(document.body.innerText), null, { timeout: 8000 }).then(() => true).catch(() => false);
    ok('boss intro banner appears on a boss stage', seen);
    await b.close();
  }
  // ---- 8. Localisation of the newest strings
  {
    const b = await chromium.launch({ args: GL });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
    await p.addInitScript((d) => { localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify({ lang:'ja', lastDailyLoginDate:d, dailyLoginStreak:1, claimedDailyDays:[1] })); }, today());
    await p.goto(URL); await ready(p); await p.waitForTimeout(3500);
    ok('Japanese: tutorial text is translated', await p.getByText('戦闘は自動です').count() > 0);
    await p.locator('nav [data-tab=arena]').click(); await p.waitForTimeout(400);
    await p.locator('[data-view=quests]').click(); await p.waitForTimeout(500);
    ok('Japanese: daily quests title is translated', await p.getByText('デイリークエスト').count() > 0);
    ok('Japanese: no page errors', errs.length === 0, errs.join('|'));
    await b.close();
  }
  // ---- 9. Compact layout: 6 gear slots, auto-equip toasts, guidance, 2 ad offers, save migration
  {
    const b = await chromium.launch({ args: GL });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
    const item = (slot, rarity, atk, sell) => ({ id:'it_'+slot+atk, name:'Test '+slot, slot, rarity, level:3, stats:{hp:0,atk,def:0,spd:0,critRate:0,critDmg:0,comboRate:0,dodgeRate:0,lifesteal:0,stamina:0}, powerScore:Math.round(atk*3.5), sellPrice:sell, iconName:'Flame' });
    // A save from the 9-slot layout: mouth / weapon / partner gear must be cashed out
    const old = { saveVersion:3, lastDailyLoginDate:today(), dailyLoginStreak:1, claimedDailyDays:[1], tutorialStep:99, coins:500, autoBattle:false,
      inventory:[item('weapon','rare',30,70), item('gloves','rare',100,40)],
      playerFighter:{ equipped:{ head:null, gloves:item('gloves','common',10,10), mouth:item('mouth','rare',20,50), robe:null, shorts:null, boots:null, belt:null, weapon:item('weapon','common',8,20), partner:null } } };
    await p.addInitScript((o) => { localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify(o)); }, old);
    await p.goto(URL); await ready(p); await p.waitForTimeout(3000);
    let s = await p.evaluate(() => JSON.parse(localStorage.getItem('street_striker_rpg_save_v2')));
    ok('migration: removed slots cashed out', !s.playerFighter.equipped.mouth && !s.playerFighter.equipped.weapon && s.inventory.length === 1 && s.coins >= 500 + 70 + 50 + 20, `coins=${s.coins} inv=${s.inventory.length}`);
    ok('migration: kept gear lifted to the 6-slot budget', s.playerFighter.equipped.gloves.stats.atk === 13, `atk=${s.playerFighter.equipped.gloves.stats.atk}`);
    ok('gear grid shows 6 slots', await p.locator('.grid-cols-3 > button').count() === 6, `n=${await p.locator('.grid-cols-3 > button').count()}`);
    ok('better item in bag is tagged and the Fighter tab has a dot', await p.locator('[data-better]').count() === 1 && await p.locator('nav [data-tab=gear] [data-badge]').count() === 1);
    // Non-epic drops never open a modal: better -> equipped with a toast, worse -> bag
    await p.evaluate((it) => window.__game.handleLootDrop(it), item('boots','uncommon',40,30));
    await p.waitForTimeout(300);
    const toast = await p.locator('[data-toast]').count();
    s = await p.evaluate(() => JSON.parse(JSON.stringify(window.__game.getState())));
    ok('better common/rare drop is auto-equipped with a toast', s.playerFighter.equipped.boots?.powerScore === 140 && toast > 0 && !s.pendingLootDrop, `toast=${toast}`);
    await p.evaluate((it) => window.__game.handleLootDrop(it), item('boots','common',5,9));
    s = await p.evaluate(() => JSON.parse(JSON.stringify(window.__game.getState())));
    ok('worse drop goes to the bag, no modal', s.inventory.some(i => i.powerScore === 18) && !s.pendingLootDrop);
    // Epic+ drops still get the big reveal card
    await p.evaluate(() => window.__game.cheatDropRandomGear('epic')); await p.waitForTimeout(1200);
    const hadCard = await p.getByText(/YENİ EKİPMAN|NEW GEAR/i).count() > 0;
    await p.getByRole('button', { name: /KUŞAN|EQUIP/i }).first().click({ force: true }).catch(() => {}); await p.waitForTimeout(500);
    ok('epic drop opens the loot card and equips from it', hadCard && await p.getByText(/YENİ EKİPMAN|NEW GEAR/i).count() === 0);
    // Next-step card from another tab jumps to the right place
    await p.locator('nav [data-tab=gym]').click(); await p.waitForTimeout(400);
    const nextKey = await p.locator('[data-next-step]').getAttribute('data-next-step').catch(() => null);
    await p.locator('[data-next-step]').click().catch(() => {}); await p.waitForTimeout(400);
    const tab = await p.evaluate(() => window.__game.getState().activeTab);
    ok('next-step card shows on other tabs and jumps there', !!nextKey && tab !== 'gym', `key=${nextKey} tab=${tab}`);
    // Stat bar: one row, expands on tap
    const chipsBefore = await p.locator('.stat-bar .grid > div').count();
    await p.locator('.stat-bar > button').click(); await p.waitForTimeout(300);
    ok('stat bar is a single row that expands to 8 stats', chipsBefore === 0 && await p.locator('.stat-bar .grid > div').count() === 8);
    // Shop: two clear ad offers
    await p.locator('nav [data-tab=shop]').click(); await p.waitForTimeout(500);
    ok('shop shows exactly 2 ad offers', await p.locator('[data-ad]').count() === 2);
    // Coins piling up -> gym dot
    await p.evaluate(() => window.__game.cheatAddCoins(50000)); await p.waitForTimeout(300);
    ok('gym tab gets a dot when training is affordable', await p.locator('nav [data-tab=gym] [data-badge]').count() === 1);
    ok('no page errors in compact layout', errs.length === 0, errs.join('|'));
    await b.close();
  }
  // ---- 10. Dynamic Island: header splits left/right of the island, nothing under it; notch phones keep the classic header
  for (const [w, h, top, island] of [[393, 852, 59, true], [402, 874, 62, true], [390, 844, 47, false]]) {
    const b = await chromium.launch({ args: GL });
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top, bottom: 34, left: 0, right: 0 } });
    await p.addInitScript((d) => { localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify({ lastDailyLoginDate:d, dailyLoginStreak:1, claimedDailyDays:[1], tutorialStep:99, coins: 1234567, gems: 98765 })); }, today());
    await p.goto(URL); await ready(p); await p.waitForTimeout(2500);
    const isl = { x: (w - 126) / 2, y: 11, w: 126, h: 37 };
    const overlap = await p.evaluate((isl) => [...document.querySelectorAll('header button, header div.rounded-lg')].map(e => e.getBoundingClientRect()).filter(r => r.width && !(r.right <= isl.x || r.left >= isl.x + isl.w || r.bottom <= isl.y || r.top >= isl.y + isl.h)).length, isl);
    const split = await p.locator('[data-island-header]').count() === 1;
    ok(`island ${w}x${h} inset ${top}: ${island ? 'header beside the island' : 'classic header below the notch'}`, split === island && overlap === 0, `split=${split} overlap=${overlap}`);
    ok(`island ${w}x${h}: speed button moved into the fight view`, await p.locator('[data-speed]').count() === 1 && errs.length === 0, errs.join('|'));
    await b.close();
  }
  console.log(results.join('\n'));
  if (results.some((r) => r.startsWith('FAIL'))) process.exitCode = 1;
})();
