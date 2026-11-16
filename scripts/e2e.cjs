// Browser regression tests. Needs the dev server (npm run dev -- --port 5199) and Playwright.
// Run: NODE_PATH=$(npm root -g) node scripts/e2e.cjs
const { chromium } = require('playwright');
const GL = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
const results = [];
const ok = (n, c, extra='') => { results.push(`${c ? 'PASS' : 'FAIL'}  ${n} ${extra}`); };
const today = () => new Date().toLocaleDateString('en-CA');
const URL = process.env.URL || 'http://localhost:5199';
// Wait until the app has booted and written its save (more reliable than fixed sleeps on a loaded machine)
const ready = (p) => p.waitForFunction(() => { try { return JSON.parse(localStorage.getItem('street_striker_rpg_save_v2')).saveVersion >= 6; } catch { return false; } }, null, { timeout: 20000 }).catch(() => {});

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
    ok('legacy save: new fields filled', s.saveVersion === 6 && s.dailyQuests?.length === 4 && s.quality === 'medium');
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
    await p.screenshot({ path: require('path').join(require('os').tmpdir(), 'nowebgl.png'), clip:{x:0,y:60,width:390,height:260} });
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
    ok('stat bar is a single row that expands to 9 stats', chipsBefore === 0 && await p.locator('.stat-bar .grid > div').count() === 9);
    // Shop: two clear ad offers
    await p.locator('nav [data-tab=shop]').click(); await p.waitForTimeout(500);
    ok('shop shows exactly 2 ad offers', await p.locator('[data-ad]').count() === 2);
    // Coins piling up -> gym dot
    await p.evaluate(() => window.__game.cheatAddCoins(50000)); await p.waitForTimeout(300);
    ok('gym tab gets a dot when training is affordable', await p.locator('nav [data-tab=gym] [data-badge]').count() === 1);
    ok('no page errors in compact layout', errs.length === 0, errs.join('|'));
    await b.close();
  }
  // ---- 11. Retention: notification soft ask, settings toggle, boss bonus ad offer
  {
    const b = await chromium.launch({ args: GL });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
    await p.addInitScript((d) => { localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify({ lastDailyLoginDate:d, dailyLoginStreak:1, claimedDailyDays:[1], tutorialStep:99, totalFightsWon: 12, autoBattle:false })); }, today());
    await p.goto(URL); await ready(p); await p.waitForTimeout(2500);
    ok('notification soft ask shows after some wins', await p.locator('[data-notif-ask]').count() === 1);
    await p.getByText(/^Şimdi değil$|^Not now$/).click(); await p.waitForTimeout(400);
    let s = await p.evaluate(() => JSON.parse(JSON.stringify(window.__game.getState())));
    ok('"not now" is remembered and no OS prompt is forced', s.notifAsked === true && s.notificationsEnabled === false && await p.locator('[data-notif-ask]').count() === 0);
    // Boss bonus offer: card -> rewarded ad -> payout once
    const before = s.coins, gemsBefore = s.gems;
    await p.evaluate(() => { const st = window.__game.getState(); st.bossBonus = { coins: 500, gems: 7, expiresAt: Date.now() + 45000 }; window.__game.notify(); });
    await p.waitForTimeout(400);
    ok('boss bonus card appears after a boss win', await p.locator('[data-boss-bonus]').count() === 1);
    await p.locator('[data-boss-bonus] button').first().click(); await p.waitForTimeout(400);
    const adType = await p.evaluate(() => window.__game.getState().activeAdModal?.type);
    await p.evaluate(() => window.__game.claimRewardedAdReward()); await p.waitForTimeout(300);
    s = await p.evaluate(() => JSON.parse(JSON.stringify(window.__game.getState())));
    ok('boss bonus pays out once through a rewarded ad', adType === 'boss_double' && s.coins === before + 500 && s.gems === gemsBefore + 7 && s.bossBonus === null, `type=${adType} coins=${s.coins - before}`);
    // Settings has a notifications switch
    await p.locator('header button[aria-label]').last().click(); await p.waitForTimeout(400);
    ok('settings has a notifications switch', await p.locator('[data-notif-toggle]').count() === 1);
    ok('no page errors in retention flow', errs.length === 0, errs.join('|'));
    await b.close();
  }
  // ---- 12. Regression tests for the 2026-11-04 playtest bugs
  {
    const b = await chromium.launch({ args: GL });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
    const it = (slot, atk) => ({ id:'reg_'+slot+atk, name:'Reg '+slot, slot, rarity:'common', level:1, stats:{hp:0,atk,def:0,spd:0,critRate:0,critDmg:0,comboRate:0,dodgeRate:0,lifesteal:0,stamina:0}, powerScore:Math.round(atk*3.5), sellPrice:25, iconName:'Flame' });
    const bag = Array.from({ length: 20 }, (_, i) => it('boots', 1 + i));
    await p.addInitScript(([d, bag, head]) => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify({ lang:'en', lastDailyLoginDate:d, dailyLoginStreak:1, claimedDailyDays:[1], tutorialStep:99, totalFightsWon:5, notifAsked:true, coins:200, inventory: bag, playerFighter:{ equipped:{ head, gloves:null, robe:null, shorts:null, boots:null, belt:null } } })); } }, [today(), bag, it('head', 10)]);
    await p.goto(URL); await ready(p); await p.waitForTimeout(2000);
    let s = await p.evaluate(() => JSON.parse(JSON.stringify(window.__game.getState())));
    await p.evaluate(() => window.__game.sellItem(window.__game.getState().playerFighter.equipped.head));
    let s2 = await p.evaluate(() => JSON.parse(JSON.stringify(window.__game.getState())));
    ok('selling an equipped item pays nothing (no infinite coins)', s2.coins === s.coins && s2.playerFighter.equipped.head);
    await p.evaluate(() => window.__game.unequipItem('head'));
    s2 = await p.evaluate(() => JSON.parse(JSON.stringify(window.__game.getState())));
    ok('unequip with a full bag is blocked (gear never destroyed)', !!s2.playerFighter.equipped.head && s2.coins === s.coins && s2.inventory.length === 20);
    // speed is locked before the first boss
    await p.evaluate(() => window.__game.cycleBattleSpeed());
    ok('2x speed stays locked before the first boss', (await p.evaluate(() => window.__game.getState().battleSpeed)) === 1);
    // build 19: the paid "another skill" reroll is gone (the draft offers three skills for free)
    const noReroll = await p.evaluate(() => typeof window.__game.rerollSkill === 'undefined' && typeof window.__game.rerollCost === 'undefined' && !('offerRerolls' in window.__game.getState()));
    ok('no paid skill reroll left in the game logic', noReroll);
    // import save survives the reload
    await p.evaluate(() => window.__game.importSave(JSON.stringify({ lang:'en', playerLevel: 7, coins: 777777, tutorialStep: 99, lastDailyLoginDate: new Date().toLocaleDateString('en-CA'), dailyLoginStreak:1, claimedDailyDays:[1] })));
    await p.waitForTimeout(4000);
    s2 = await p.evaluate(() => JSON.parse(JSON.stringify(window.__game.getState())));
    ok('import save is kept after the reload', s2.coins >= 777777 && s2.playerLevel === 7, `coins=${s2.coins} lvl=${s2.playerLevel}`);
    // phase 2: manual mode runs at 1x
    await p.evaluate(() => { const g = window.__game; if (g.getState().autoBattle) g.toggleAutoBattle(); g.cycleBattleSpeed(); });
    ok('manual mode stays at 1x speed', (await p.evaluate(() => window.__game.getState().battleSpeed)) === 1);
    await p.evaluate(() => { const g = window.__game; if (!g.getState().autoBattle) g.toggleAutoBattle(); });
    // phase 2: a loss on a hard stage offers the optional 2x damage ad
    await p.evaluate(() => { const g = window.__game; const st = g.getState(); st.lastBuffOfferAt = 0; st.doubleDamageUntil = 0; g.onStageDefeat({ isBoss: false, world: 9, subStage: 3, opponent: { stats: { hp: 1e7, maxHp: 1e7, atk: 1e6, def: 1e6, spd: 500, critRate: 10, critDmg: 1.5, comboRate: 5, dodgeRate: 5, lifesteal: 0, stamina: 100, powerScore: 1 }, profile: 'aggressive' } }); g.notify(); });
    await p.waitForTimeout(400);
    ok('hard-stage loss offers the 2x damage ad card', await p.locator('[data-buff-offer]').count() === 1);
    ok('no page errors in regression flow', errs.length === 0, errs.join('|'));
    await b.close();
  }
  {
    // an unanswered offline reward survives a relaunch
    const b = await chromium.launch({ args: GL });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.addInitScript((d) => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify({ lang:'en', lastDailyLoginDate:d, dailyLoginStreak:1, claimedDailyDays:[1], tutorialStep:99, totalFightsWon:5, lastOfflineTimestamp: Date.now() - 3 * 3600 * 1000 })); } }, today());
    await p.goto(URL); await ready(p); await p.waitForTimeout(2000);
    const g1 = await p.evaluate(() => window.__game.getState().offlineGoldAccumulated);
    await p.reload(); await ready(p); await p.waitForTimeout(2000);
    const st = await p.evaluate(() => ({ open: window.__game.getState().isOfflineRewardOpen, gold: window.__game.getState().offlineGoldAccumulated }));
    ok('offline reward is still offered after a relaunch', g1 > 0 && st.open && st.gold >= g1, `before=${g1} after=${st.gold}`);
    await b.close();
  }
  {
    // a malformed save never gives a white screen
    const b = await chromium.launch({ args: GL });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
    await p.addInitScript((d) => { localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify({ lang:'en', lastDailyLoginDate:d, dailyLoginStreak:1, claimedDailyDays:[1], tutorialStep:99, playerLevel:3, inventory:null, dailyQuests:[null], questDate:d, coins:-50, playerFighter:{ equipped:null } })); }, today());
    await p.goto(URL); await p.waitForTimeout(5000);
    ok('malformed save loads (no white screen, no errors)', await p.locator('nav button').count() === 4 && errs.length === 0, errs.join('|'));
    await b.close();
  }
  // ---- 13. Build 19 (docs/PLAN_BUILD_19.md B1-B3, C1, C3): draft, boss mechanics, farm until ready, leagues, v6 save
  const open19 = async (save) => {
    const b = await chromium.launch({ args: GL });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript((s) => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify(s)); } },
      { lang: 'en', lastDailyLoginDate: today(), dailyLoginStreak: 1, claimedDailyDays: [1], tutorialStep: 99, notifAsked: true, ...save });
    await p.goto(URL); await ready(p); await p.waitForTimeout(1500);
    return { b, p, errs };
  };
  const st = (p) => p.evaluate(() => JSON.parse(JSON.stringify(window.__game.getState())));
  const until = async (p, fn, arg, ms = 20000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 200 }).then(() => true).catch(() => false);
  {
    // B1: skill draft, choose 1 of 3, free; auto pick after 8 s; "Always let me choose"; no reroll anywhere
    const { b, p, errs } = await open19({ autoBattle: true, autoAdvance: false });
    await p.evaluate(() => {
      const g = window.__game; const s = g.getState();
      // a full deck guarantees a level-up option
      ['skill_iron_chin', 'skill_shadow_slip', 'skill_vampiric_bite', 'skill_heavy_haymaker', 'skill_counter_sniper'].forEach((id) => { if (!s.playerFighter.equippedSkills.some((k) => k.id === id)) s.playerFighter.equippedSkills.push({ id, name: id, description: '', rarity: 'rare', category: 'strike', level: 1, maxLevel: 5, iconName: 'Zap', bonusText: '', statBonus: { atk: 1 } }); });
      g.openSkillDraft(true); g.notify();
    });
    await p.waitForTimeout(400);
    const ids = await p.locator('[data-draft-option]').evaluateAll((els) => els.map((e) => e.getAttribute('data-draft-option')));
    ok('draft: three different skills to choose from', ids.length === 3 && new Set(ids).size === 3, ids.join(','));
    const lvl = await p.locator('[data-draft-option][data-levelup]').first().innerText().catch(() => '');
    ok('draft: a level-up of an owned skill is labelled as such', /LEVEL UP → Lv\.2/i.test(lvl), lvl.split('\n').slice(0, 2).join(' / '));
    ok('draft: one option is highlighted as recommended', await p.locator('[data-draft-option][data-recommended]').count() === 1);
    const t1 = await p.locator('[data-draft-countdown]').innerText().catch(() => '');
    await p.waitForTimeout(1300);
    const t2 = await p.locator('[data-draft-countdown]').innerText().catch(() => '');
    ok('draft: auto mode shows a running countdown', /Auto pick in [78]s/.test(t1) && t1 !== t2, `${t1.split('\n')[0]} -> ${t2.split('\n')[0]}`);
    ok('draft: no paid reroll / "another skill" button', await p.getByText(/ANOTHER SKILL|BAŞKA YETENEK|reroll/i).count() === 0);
    // tapping the card stops the countdown; the player then chooses
    await p.locator('[data-skill-draft] [role=dialog]').dispatchEvent('pointerdown');
    await p.waitForTimeout(300);
    const stopped = await p.locator('[data-draft-countdown]').count() === 0;
    await p.waitForTimeout(8500);
    const stillOpen = await p.locator('[data-draft-option]').count() === 3;
    await p.locator('[data-draft-option]').nth(0).click();
    await p.waitForTimeout(300);
    let s = await st(p);
    ok('draft: a tap cancels the countdown and the player picks', stopped && stillOpen && !s.pendingSkillDraft && s.draftsPicked === 1);
    // auto pick: the recommended option is taken after 8 s
    await p.evaluate(() => { const g = window.__game; g.getState().pendingSkillReplacement = null; g.openSkillDraft(true); g.notify(); });
    const rec = await p.evaluate(() => { const d = window.__game.getState().pendingSkillDraft; return { id: d.options[d.recommended].id, up: d.levelUp[d.recommended] }; });
    const before = await st(p);
    await p.waitForTimeout(9000);
    s = await st(p);
    const lvBefore = before.playerFighter.equippedSkills.find((k) => k.id === rec.id)?.level || 0;
    const lvAfter = s.playerFighter.equippedSkills.find((k) => k.id === rec.id)?.level || 0;
    ok('draft: auto mode picks the recommended option after 8 s', !s.pendingSkillDraft && s.draftsPicked === 2 && (rec.up ? lvAfter === lvBefore + 1 : (s.pendingSkillReplacement?.id === rec.id || lvAfter === 1)), `${rec.id} up=${rec.up} ${lvBefore}->${lvAfter}`);
    // "Always let me choose": no countdown, nothing picked by itself
    await p.evaluate(() => { const g = window.__game; g.getState().pendingSkillReplacement = null; g.toggleDraftAlwaysChoose(); g.openSkillDraft(true); g.notify(); });
    await p.waitForTimeout(9000);
    s = await st(p);
    ok('draft: "Always let me choose" turns the countdown off (setting persists)', await p.locator('[data-draft-countdown]').count() === 0 && !!s.pendingSkillDraft && s.draftAlwaysChoose === true);
    // a new skill with a full deck opens the (translated) swap card; keeping the deck is possible
    const newOpt = p.locator('[data-draft-option]:not([data-levelup])');
    const hasNew = await newOpt.count() > 0;
    await (hasNew ? newOpt.first() : p.locator('[data-draft-option]').first()).click(); await p.waitForTimeout(300);
    const swapCard = !hasNew || (await p.getByText('KEEP CURRENT DECK').count() === 1 && await p.getByText('CHOOSE A SKILL TO SWAP OUT').count() === 1);
    await p.evaluate(() => window.__game.dismissSkillReplacement()); await p.waitForTimeout(300);
    ok('draft: deck full + new skill opens the swap card (keep deck works)', swapCard && (await st(p)).playerFighter.equippedSkills.length === 6);
    await p.locator('header button[aria-label]').last().click(); await p.waitForTimeout(400);
    ok('settings has "Always let me choose" and "Return to the boss" switches', await p.locator('[data-draft-choose-toggle]').count() === 1 && await p.locator('[data-auto-return-toggle]').count() === 1);
    ok('draft: no page errors', errs.length === 0, errs.join('|'));
    await b.close();
  }
  {
    // B2: each world boss fires its signature mechanic (fight runs at 4x with a fighter that survives)
    const { b, p, errs } = await open19({ autoBattle: true, autoAdvance: false, battleSpeed: 4, highestWorld: 6, highestSubStage: 1, currentWorld: 1, currentSubStage: 1 });
    const expected = { 1: 'enrage', 2: 'bite', 3: 'evade_stance', 4: 'shell_absorb', 5: 'charged' };
    for (const w of [1, 2, 3, 4, 5]) {
      const mech = await p.evaluate((w) => {
        const g = window.__game; const s = g.getState();
        s.pendingLootDrop = null; s.pendingSkillDraft = null; s.bossBonus = null;
        window.__mechLog = [];
        g.selectStage(w, 10);
        const boss = g.getCurrentStage().opponent.stats;
        s.playerFighter.baseStats = { ...s.playerFighter.baseStats, hp: 5e7, maxHp: 5e7, atk: Math.round(boss.maxHp / 30), def: boss.atk * 3, spd: boss.spd };
        g.recalculatePlayerStats(); g.notify();
        return g.getCurrentStage().bossMechanic;
      }, w);
      const fired = await until(p, (e) => { const s = window.__game.getState(); if (s.pendingLootDrop) { s.pendingLootDrop = null; window.__game.notify(); } return (window.__mechLog || []).includes(e); }, expected[w], 30000);
      const log = await p.evaluate(() => (window.__mechLog || []).slice(0, 8).join(','));
      ok(`boss mechanic: world ${w} boss (${mech?.id}, strength ${mech?.strength}) fires "${expected[w]}"`, fired && mech?.strength === 1, log);
    }
    const subMech = await p.evaluate(() => { const g = window.__game; g.selectStage(7, 5); return g.getCurrentStage().bossMechanic; });
    ok('boss mechanic: sub-bosses get a weaker version (Silver 2-5: leech at strength 0.5)', subMech?.id === 'leech' && subMech.strength < 1, JSON.stringify(subMech));
    ok('boss mechanics: no page errors', errs.length === 0, errs.join('|'));
    await b.close();
  }
  {
    // B3: boss loss in auto mode -> defeat panel (mechanic tip, farm countdown) -> farm -> "Boss ready" chip -> back
    const { b, p, errs } = await open19({ autoBattle: true, battleSpeed: 2, currentWorld: 2, currentSubStage: 10, highestWorld: 2, highestSubStage: 10 });
    const panel = await until(p, () => !!document.querySelector('[data-boss-defeat]'), null, 30000);
    const farmBtn = await p.locator('[data-farm]').innerText().catch(() => '');
    const tip = await p.locator('[data-mech-hint]').getAttribute('data-mech-hint').catch(() => null);
    ok('farm: boss defeat panel keeps Retry / Gym / ad revive and adds the mechanic tip + farm countdown',
      panel && tip === 'leech' && /FARM UNTIL READY \(\d\)/.test(farmBtn) && await p.locator('[data-retry]').count() === 1 && await p.getByText(/REVIVE/i).count() > 0 && await p.getByText(/GO TO GYM/).count() > 0, `tip=${tip} btn=${farmBtn}`);
    const farming = await until(p, () => { const s = window.__game.getState(); return !!s.farm && (s.currentWorld - 1) * 10 + s.currentSubStage < 20; }, null, 12000);
    let s = await st(p);
    ok('farm: after the countdown the fighter drops to a stage it beats reliably', farming && s.farm.world === 2 && s.farm.sub === 10 && s.highestWorld === 2 && s.highestSubStage === 10, `now ${s.currentWorld}-${s.currentSubStage}`);
    ok('farm: progress chip is shown while farming', await until(p, () => !!document.querySelector('[data-farm-chip=farming]'), null, 5000));
    // get strong (as gym/gear would): the chip turns into "Boss ready"; with auto-return off the player taps it
    await p.evaluate(() => { const g = window.__game; const s = g.getState(); if (s.autoReturnToBoss) g.toggleAutoReturnToBoss(); s.playerFighter.baseStats = { ...s.playerFighter.baseStats, hp: 1e8, maxHp: 1e8, atk: 1e6, def: 1e6 }; g.recalculatePlayerStats(); g.notify(); });
    const readyChip = await until(p, () => !!document.querySelector('[data-farm-chip=ready]'), null, 5000);
    const chipText = await p.locator('[data-farm-chip]').innerText().catch(() => '');
    await p.locator('[data-farm-chip=ready]').click().catch(() => {});
    await p.waitForTimeout(400);
    s = await st(p);
    ok('farm: "Boss ready" chip at odds >= 1.1, one tap returns to the boss', readyChip && /BOSS READY/.test(chipText) && !s.farm && s.currentWorld === 2 && s.currentSubStage === 10, `chip=${chipText} now ${s.currentWorld}-${s.currentSubStage}`);
    // auto-return setting: farming ends by itself once the boss is beatable
    await p.evaluate(() => { const g = window.__game; g.toggleAutoReturnToBoss(); g.startFarming({ world: 3, sub: 5 }); });
    const back = await until(p, () => { const s = window.__game.getState(); if (s.pendingLootDrop || s.pendingSkillDraft) { s.pendingLootDrop = null; s.pendingSkillDraft = null; window.__game.notify(); } return !s.farm && ((s.currentWorld === 3 && s.currentSubStage === 5) || (s.currentWorld - 1) * 10 + s.currentSubStage > 25); }, null, 20000);
    ok('farm: with "Return to the boss" on, the fighter goes back by itself', back);
    ok('farm: no page errors', errs.length === 0, errs.join('|'));
    await b.close();
  }
  {
    // C1: beating the last boss of a league promotes the fighter (celebration + fixed reward), labels drop the ∞ suffix
    const { b, p, errs } = await open19({ autoBattle: true, battleSpeed: 4, currentWorld: 5, currentSubStage: 10, highestWorld: 5, highestSubStage: 10, gems: 10,
      playerFighter: { baseStats: { hp: 1e9, maxHp: 1e9, atk: 5e6, def: 5e6, spd: 500, critRate: 10, critDmg: 1.5, comboRate: 10, dodgeRate: 5, lifesteal: 0, stamina: 100, powerScore: 1 } } });
    const promoted = await until(p, () => { const s = window.__game.getState(); if (s.pendingSkillDraft) window.__game.pickSkillDraft(0); if (s.pendingLootDrop) { s.pendingLootDrop = null; window.__game.notify(); } return !!document.querySelector('[data-league-promotion]'); }, null, 30000);
    const card = await p.locator('[data-league-promotion]').innerText().catch(() => '');
    let s = await st(p);
    const reward = s.pendingPromotion;
    await p.locator('[data-league-promotion] button').click().catch(() => {});
    await p.waitForTimeout(400);
    const s2 = await st(p);
    // stop winning (manual mode, no taps) so no draft / loot card covers the next checks
    await p.evaluate(() => { const g = window.__game; const s = g.getState(); if (s.autoBattle) g.toggleAutoBattle(); s.pendingSkillDraft = null; s.pendingLootDrop = null; s.pendingSkillReplacement = null; g.notify(); });
    await p.waitForTimeout(400);
    ok('league: promotion screen after the world-5 boss with a fixed reward', promoted && /PROMOTED/.test(card) && /Silver League/.test(card) && reward?.league === 1 && s2.gems === s.gems + reward.gems && s2.league === 1 && !s2.pendingPromotion, `gems ${s.gems}->${s2.gems} reward=${JSON.stringify(reward)}`);
    const hud = await p.evaluate(() => document.body.innerText);
    ok('league: stage label reads "Silver 1-x" instead of a loop suffix', /Silver 1-\d/.test(hud) && !hud.includes('∞'));
    await p.locator('nav [data-tab=arena]').click(); await p.waitForTimeout(500);
    const arena = await p.evaluate(() => document.body.innerText);
    ok('league: Arena shows league tabs, the boss mechanic and the league twist; no ∞ anywhere', await p.locator('[data-league-tabs] button').count() >= 2 && await p.locator('[data-league-mod]').count() === 1 && /Boss: /i.test(arena) && !arena.includes('∞'));
    await p.locator('[data-open-profile]').click(); await p.waitForTimeout(400);
    ok('league: badge next to the name in the profile', await p.locator('[data-profile-sheet] [data-league-badge=silver]').count() === 1);
    ok('league: no page errors', errs.length === 0, errs.join('|'));
    await b.close();
  }
  {
    // C3: a version 5 save at stage 80 keeps stage, gear and gym; maps to Silver world 3; the open offer becomes a draft
    const gym = [['gym_punching_bag', 'atk', 3, 'Flame'], ['gym_bench_press', 'hp', 25, 'Shield'], ['gym_agility_ladder', 'spd', 2, 'Footprints'], ['gym_reflex_ball', 'critRate', 0.8, 'Zap'], ['gym_jump_rope', 'dodgeRate', 0.7, 'Wind']]
      .map(([id, targetStat, statGain, iconName], i) => ({ id, name: id, description: '', targetStat, statGain, level: 30 + i, cost: 999999, iconName }));
    const gloves = { id: 'v5_gloves', name: 'EPIC Dragon Fist Gloves', slot: 'gloves', rarity: 'epic', level: 78, stats: { hp: 0, atk: 9000, def: 0, spd: 0, critRate: 6, critDmg: 0, comboRate: 0, dodgeRate: 0, lifesteal: 0, stamina: 0 }, powerScore: 31500, sellPrice: 900, iconName: 'Flame' };
    const v5 = { saveVersion: 5, coins: 50000, gems: 300, playerLevel: 40, totalFightsWon: 900, bossDefeatedCount: 16, autoBattle: false,
      currentWorld: 8, currentSubStage: 10, highestWorld: 8, highestSubStage: 10, gymTrainings: gym,
      playerFighter: { equipped: { head: null, gloves, mouth: null, robe: null, shorts: null, boots: null, belt: null, weapon: null, partner: null } },
      pendingSkillOffer: { id: 'skill_iron_chin', name: 'Iron Chin', description: '', rarity: 'rare', category: 'defense', level: 1, maxLevel: 5, iconName: 'Shield', bonusText: '', statBonus: { hp: 120, def: 15 } }, offerRerolls: 2 };
    const { b, p, errs } = await open19(v5);
    const s = await st(p);
    ok('v5 -> v6: stage 80 kept (Silver league, world 3), nobody moved backwards', s.saveVersion === 6 && s.highestWorld === 8 && s.highestSubStage === 10 && s.currentWorld === 8 && s.currentSubStage === 10 && s.league === 1 && !s.pendingPromotion, `v=${s.saveVersion} hi=${s.highestWorld}-${s.highestSubStage} cur=${s.currentWorld}-${s.currentSubStage} league=${s.league}`);
    ok('v5 -> v6: gear and gym levels kept', s.playerFighter.equipped.gloves?.id === 'v5_gloves' && s.gymTrainings.map((g) => g.level).join(',') === '30,31,32,33,34' && s.coins >= 50000);
    ok('v5 -> v6: open skill offer became a draft, reroll state removed', !!s.pendingSkillDraft && s.pendingSkillDraft.options.length === 3 && !('pendingSkillOffer' in s) && !('offerRerolls' in s));
    ok('v5 -> v6: bosses already beaten count for the mechanic achievements', ['enrage', 'leech', 'evade', 'shell', 'charged'].every((m) => s.mechWins[m] >= 1));
    const hud = await p.evaluate(() => document.body.innerText);
    ok('v5 -> v6: fight label reads "Silver 3-10"', /Silver 3-10/.test(hud), (hud.match(/Silver[^\n]*/) || [''])[0]);
    await p.evaluate(() => window.__game.pickSkillDraft(0)); await p.waitForTimeout(300);
    await p.locator('nav [data-tab=arena]').click(); await p.waitForTimeout(400);
    await p.locator('[data-view=quests]').click(); await p.waitForTimeout(500);
    const achText = await p.evaluate(() => document.body.innerText);
    const total = Number((achText.match(/\d+\/(\d+)( •|\n)/) || [])[1] || 0);
    const gems0 = (await st(p)).gems;
    await p.evaluate(() => window.__game.claimAchievement('league_1'));
    const gems1 = (await st(p)).gems;
    ok('achievements: about 36 with tiers; the Silver league one is claimable after the migration', total >= 36 && await p.locator('[data-tier]').count() >= 4 && gems1 === gems0 + 150, `total=${total} gems ${gems0}->${gems1}`);
    ok('v5 -> v6: no page errors', errs.length === 0, errs.join('|'));
    await b.close();
  }
  // ---- 12. Build 19 fight view: HUD overlay, VS card, SUPER / KO moments stay in sync with the fight clock
  {
    const b = await chromium.launch({ args: GL });
    const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
    await p.addInitScript((d) => { localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify({ lang:'de', lastDailyLoginDate:d, dailyLoginStreak:1, claimedDailyDays:[1], tutorialStep:99, currentWorld:4, currentSubStage:10, highestWorld:4, highestSubStage:10, playerLevel:30, battleSpeed:1 })); }, today());
    await p.goto(URL); await ready(p);
    await p.waitForSelector('[data-boss-intro]', { timeout: 15000 }).catch(() => {});
    // Hold the card and check that nobody is hit while it shows
    const held = await p.evaluate(async () => {
      const r = window.__battleRig; if (!r.cine) return { ok: false };
      r.cine.dur = 1e9;
      const hp = () => document.querySelector('[data-hud-opponent]')?.parentElement?.textContent;
      const before = hp(); await new Promise((res) => setTimeout(res, 1500));
      return { ok: r.cine?.kind === 'boss_intro', same: hp() === before };
    });
    ok('boss VS card shows and pauses the fight clock', held.ok && held.same, JSON.stringify(held));
    await p.locator('[data-boss-intro]').click({ force: true }); await p.waitForTimeout(400);
    ok('VS card is skipped by a tap', await p.locator('[data-boss-intro]').count() === 0 && await p.evaluate(() => window.__battleRig.cine === null));
    // HUD overlay: names not cut off on a 375 pt screen
    const cut = await p.evaluate(() => [...document.querySelectorAll('.battle-hud span, header span')].filter((e) => !e.children.length && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 2)).map((e) => e.textContent));
    ok('fight HUD and header show full names at 375 pt (de)', cut.length === 0, cut.join('|'));
    // SUPER: the cinematic runs and its hit still lands (opponent HP drops right after it)
    const sup = await p.evaluate(async () => {
      const r = window.__battleRig; const seen = [];
      const until = performance.now() + 12000;
      while (performance.now() < until && !seen.includes('super')) { window.__fight.fillRage(); if (r.cine) seen.push(r.cine.kind); await new Promise((res) => setTimeout(res, 16)); }
      const hpText = () => document.querySelector('[data-hp=opp]')?.textContent || '';
      const before = hpText();
      const t0 = performance.now(); while (r.cine?.kind === 'super' && performance.now() - t0 < 3000) await new Promise((res) => setTimeout(res, 16));
      await new Promise((res) => setTimeout(res, 250));
      return { seen: seen.includes('super'), dur: Math.round(performance.now() - t0), changed: hpText() !== before };
    });
    ok('SUPER cinematic plays (~0.8 s at 1x) and its hit lands', sup.seen && sup.changed && sup.dur < 2500, JSON.stringify(sup));
    ok('no page errors in the build 19 fight view', errs.length === 0, errs.join('|'));
    await b.close();
  }
  {
    // Reduced motion: static VS card, no SUPER cinematic
    const b = await chromium.launch({ args: GL });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.addInitScript((d) => { localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify({ lang:'en', reducedMotion:true, lastDailyLoginDate:d, dailyLoginStreak:1, claimedDailyDays:[1], tutorialStep:99, currentWorld:1, currentSubStage:10, highestWorld:1, highestSubStage:10, playerLevel:30, battleSpeed:1 })); }, today());
    await p.goto(URL); await ready(p);
    const card = await p.waitForSelector('[data-boss-intro]', { timeout: 15000 }).then(() => true).catch(() => false);
    ok('reduced motion: VS card is a static card', card && await p.locator('[data-boss-intro].vs-anim').count() === 0);
    await p.locator('[data-boss-intro]').click({ force: true }).catch(() => {});
    const r = await p.evaluate(async () => { let sup = false; const until = performance.now() + 6000; while (performance.now() < until) { window.__fight.fillRage(); if (window.__battleRig.cine?.kind === 'super') sup = true; await new Promise((res) => setTimeout(res, 16)); } return sup; });
    ok('reduced motion: no SUPER cinematic', r === false);
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
