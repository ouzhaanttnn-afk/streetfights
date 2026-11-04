// App Store Connect "robot": runs inside GitHub Actions with the repo secrets, so the API key never leaves GitHub.
// Never prints the key or the token. Tasks come from .github/asc/request.json.
import crypto from 'node:crypto';
import fs from 'node:fs';

// Local run (key never written to disk by this script):
//   NODE_USE_ENV_PROXY=1 ASC_KEY_ID=... ASC_ISSUER_ID=... ASC_PRIVATE_KEY="$(cat AuthKey.p8)" node scripts/asc/asc.mjs
// Needs an "App Manager" key for edits/submission; the CI upload key only has read + upload rights.
const KEY_ID = process.env.ASC_KEY_ID;
const ISSUER = process.env.ASC_ISSUER_ID;
const PEM = process.env.ASC_PRIVATE_KEY;
const BUNDLE = 'com.streetstriker.rpg';
const API = 'https://api.appstoreconnect.apple.com';

if (!KEY_ID || !ISSUER || !PEM) {
  console.log('MISSING_SECRETS: APP_STORE_CONNECT_API_KEY_ID / _ISSUER_ID / _PRIVATE_KEY');
  process.exit(1);
}

const b64u = (b) => Buffer.from(b).toString('base64url');
function token() {
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' }));
  const body = b64u(JSON.stringify({ iss: ISSUER, iat: now, exp: now + 1100, aud: 'appstoreconnect-v1' }));
  const sig = crypto.sign('sha256', Buffer.from(`${head}.${body}`), { key: crypto.createPrivateKey(PEM), dsaEncoding: 'ieee-p1363' });
  return `${head}.${body}.${b64u(sig)}`;
}
const TOKEN = token();

async function call(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json };
}
const errText = (r) => (r.json?.errors || []).map((e) => `${e.code}: ${e.detail || e.title}`).join(' | ');
const line = (ok, name, info = '') => console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${info ? ' -> ' + info : ''}`);

async function check() {
  const app = await call('GET', `/v1/apps?filter[bundleId]=${BUNDLE}&fields[apps]=name,bundleId`);
  const appId = app.json?.data?.[0]?.id;
  line(app.status === 200 && appId, 'read app', appId ? `${app.json.data[0].attributes.name} (${appId})` : `${app.status} ${errText(app)}`);
  if (!appId) return;

  const vers = await call('GET', `/v1/apps/${appId}/appStoreVersions?limit=3&fields[appStoreVersions]=versionString,appStoreState,platform`);
  line(vers.status === 200, 'read versions', (vers.json?.data || []).map((v) => `${v.attributes.versionString}=${v.attributes.appStoreState}`).join(', ') || errText(vers));

  const builds = await call('GET', `/v1/builds?filter[app]=${appId}&sort=-uploadedDate&limit=5&fields[builds]=version,processingState`);
  line(builds.status === 200, 'read builds', (builds.json?.data || []).map((b) => `${b.attributes.version}:${b.attributes.processingState}`).join(', ') || errText(builds));

  const bid = await call('GET', `/v1/bundleIds?filter[identifier]=${BUNDLE}&include=bundleIdCapabilities`);
  const caps = (bid.json?.included || []).map((c) => c.attributes?.capabilityType).filter(Boolean);
  line(bid.status === 200, 'read bundle id + capabilities (needs certificates/profiles access)', bid.status === 200 ? caps.join(', ') || 'none listed' : `${bid.status} ${errText(bid)}`);

  const prof = await call('GET', `/v1/profiles?fields[profiles]=name,profileState,expirationDate,profileType&limit=20`);
  line(prof.status === 200, 'read provisioning profiles', prof.status === 200 ? (prof.json.data || []).map((p) => `${p.attributes.name} [${p.attributes.profileType}, ${p.attributes.profileState}, exp ${String(p.attributes.expirationDate).slice(0, 10)}]`).join('; ') : `${prof.status} ${errText(prof)}`);

  const gc = await call('GET', `/v1/apps/${appId}/gameCenterDetail`);
  line(gc.status === 200 || gc.status === 404, 'read Game Center detail', gc.status === 200 ? `enabled (${gc.json?.data?.id})` : `${gc.status} ${errText(gc)}`);

  const info = await call('GET', `/v1/apps/${appId}/appInfos?fields[appInfos]=appStoreState,state`);
  line(info.status === 200, 'read app info (age rating lives here)', (info.json?.data || []).map((i) => `${i.id}:${i.attributes.state || i.attributes.appStoreState}`).join(', ') || errText(info));
}

async function appAndVersion() {
  const app = await call('GET', `/v1/apps?filter[bundleId]=${BUNDLE}`);
  const appId = app.json.data[0].id;
  const vers = await call('GET', `/v1/apps/${appId}/appStoreVersions?filter[platform]=IOS&limit=5`);
  const ver = (vers.json.data || []).find((v) => v.attributes.appStoreState !== 'READY_FOR_SALE') || vers.json.data[0];
  return { appId, ver };
}

// Read-only look at everything a resubmission touches
async function inspect() {
  const { appId, ver } = await appAndVersion();
  console.log(`version ${ver.attributes.versionString} id=${ver.id} state=${ver.attributes.appStoreState}`);
  const build = await call('GET', `/v1/appStoreVersions/${ver.id}/build`);
  console.log(`attached build: ${build.json?.data?.attributes?.version || 'none'}`);
  const infos = await call('GET', `/v1/apps/${appId}/appInfos`);
  for (const inf of infos.json.data) {
    const ar = await call('GET', `/v1/appInfos/${inf.id}/ageRatingDeclaration`);
    console.log(`appInfo ${inf.id} state=${inf.attributes.state || inf.attributes.appStoreState} ageRating=${ar.status}`);
    if (ar.json?.data) console.log('  ageRating attrs: ' + JSON.stringify(ar.json.data.attributes));
  }
  const rd = await call('GET', `/v1/appStoreVersions/${ver.id}/appStoreReviewDetail`);
  console.log(`reviewDetail ${rd.status} id=${rd.json?.data?.id} notes=${JSON.stringify(rd.json?.data?.attributes?.notes || '')}`);
  const locs = await call('GET', `/v1/appStoreVersions/${ver.id}/appStoreVersionLocalizations`);
  for (const l of locs.json.data || []) {
    const sets = await call('GET', `/v1/appStoreVersionLocalizations/${l.id}/appScreenshotSets?include=appScreenshots`);
    const desc = (sets.json?.data || []).map((st) => `${st.attributes.screenshotDisplayType}:${(st.relationships?.appScreenshots?.data || []).length}`).join(', ');
    console.log(`locale ${l.attributes.locale} id=${l.id} sets: ${desc || 'none'}`);
  }
  const subs = await call('GET', `/v1/reviewSubmissions?filter[app]=${appId}&limit=10`);
  for (const sub of subs.json?.data || []) console.log(`reviewSubmission ${sub.id} state=${sub.attributes.state} submitted=${sub.attributes.submittedDate || '-'}`);
  if (subs.status !== 200) console.log('reviewSubmissions ' + subs.status + ' ' + errText(subs));
}

const NOTES = [
  'Street Striker is an offline, single-player idle/auto-battle fighting RPG. No account or login is required and there are no in-app purchases. The player fights AI opponents, collects gear and trains stats.',
  '',
  '- Optional rewarded video ads (Google AdMob): Shop tab (Free Gems, 2x Damage, each capped per day), revive after a boss defeat, double the offline reward, double the daily login reward, one free gym level when the player is short of coins (cooldown), and short-lived offer cards after a boss win or a loss on a hard stage. They are never required to progress. In the EEA/UK the Google consent form is shown first; App Tracking Transparency permission is requested on first launch.',
  '- There is no online multiplayer, leaderboard, chat or user-generated content; all opponents are fictional AI characters.',
  '- Daily rewards use only free in-game currency; nothing can be bought, sold or cashed out. The lucky wheel from the previous build was removed, and the age rating now says Simulated Gambling: None.',
  '- Optional local reminders (gold vault full, daily reward) can be enabled from an in-game card shown after a few wins or in Settings > Notifications. They are scheduled on the device only.',
  '- To see everything quickly: launch and the fight starts automatically (the daily reward card appears after the first win). Tap AUTO (top right of the fight) for manual control; tap the gold SUPER button when the rage bar is full. Fighter / Gym / Arena / Shop tabs are along the bottom; tap the level badge (top left) for the profile.',
  '- Settings (gear icon, top right): language, sound, haptics, notifications, reduce motion, graphics quality, save backup, reset progress.',
  '- The game language follows the device language (8 languages supported).',
].join('\n');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function uploadScreenshot(setId, file) {
  const buf = fs.readFileSync(file);
  const name = file.split('/').pop();
  const created = await call('POST', '/v1/appScreenshots', {
    data: { type: 'appScreenshots', attributes: { fileName: name, fileSize: buf.length }, relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: setId } } } },
  });
  if (created.status !== 201) throw new Error(`reserve ${name}: ${created.status} ${errText(created)}`);
  const shot = created.json.data;
  for (const op of shot.attributes.uploadOperations) {
    const headers = Object.fromEntries((op.requestHeaders || []).map((h) => [h.name, h.value]));
    const res = await fetch(op.url, { method: op.method, headers, body: buf.subarray(op.offset, op.offset + op.length) });
    if (!res.ok) throw new Error(`upload part ${name}: ${res.status}`);
  }
  const md5 = crypto.createHash('md5').update(buf).digest('hex');
  const done = await call('PATCH', `/v1/appScreenshots/${shot.id}`, { data: { type: 'appScreenshots', id: shot.id, attributes: { uploaded: true, sourceFileChecksum: md5 } } });
  if (done.status !== 200) throw new Error(`commit ${name}: ${done.status} ${errText(done)}`);
  return shot.id;
}

async function replaceScreenshots(verId) {
  const dirs = { 'en-US': 'store/screenshots/en/65', tr: 'store/screenshots/tr/65' };
  const locs = await call('GET', `/v1/appStoreVersions/${verId}/appStoreVersionLocalizations`);
  const allIds = [];
  for (const l of locs.json.data) {
    const dir = dirs[l.attributes.locale];
    if (!dir) { line(true, `screenshots ${l.attributes.locale}`, 'no local files, kept as is'); continue; }
    const sets = await call('GET', `/v1/appStoreVersionLocalizations/${l.id}/appScreenshotSets?include=appScreenshots`);
    let set = (sets.json.data || []).find((st) => st.attributes.screenshotDisplayType === 'APP_IPHONE_65');
    if (!set) {
      const mk = await call('POST', '/v1/appScreenshotSets', { data: { type: 'appScreenshotSets', attributes: { screenshotDisplayType: 'APP_IPHONE_65' }, relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: l.id } } } } });
      set = mk.json.data;
    }
    for (const old of set.relationships?.appScreenshots?.data || []) await call('DELETE', `/v1/appScreenshots/${old.id}`);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
    const ids = [];
    for (const f of files) ids.push(await uploadScreenshot(set.id, `${dir}/${f}`));
    await call('PATCH', `/v1/appScreenshotSets/${set.id}/relationships/appScreenshots`, { data: ids.map((id) => ({ type: 'appScreenshots', id })) });
    allIds.push(...ids);
    line(true, `screenshots ${l.attributes.locale}`, `${ids.length} uploaded`);
  }
  // wait until Apple has processed them
  for (let i = 0; i < 40; i++) {
    const states = [];
    for (const id of allIds) {
      const r = await call('GET', `/v1/appScreenshots/${id}?fields[appScreenshots]=assetDeliveryState`);
      states.push(r.json?.data?.attributes?.assetDeliveryState?.state);
    }
    if (states.every((st) => st === 'COMPLETE')) { line(true, 'screenshots processed', `${states.length}/${states.length}`); return true; }
    if (states.some((st) => st === 'FAILED')) { line(false, 'screenshots processed', states.join(',')); return false; }
    await sleep(5000);
  }
  line(false, 'screenshots processed', 'timeout');
  return false;
}

async function prepareAndSubmit(buildVersion) {
  const { appId, ver } = await appAndVersion();
  let ok = true;

  const infos = await call('GET', `/v1/apps/${appId}/appInfos`);
  const info = infos.json.data.find((i) => (i.attributes.state || i.attributes.appStoreState) !== 'READY_FOR_SALE') || infos.json.data[0];
  const ar = await call('GET', `/v1/appInfos/${info.id}/ageRatingDeclaration`);
  const arPatch = await call('PATCH', `/v1/ageRatingDeclarations/${ar.json.data.id}`, { data: { type: 'ageRatingDeclarations', id: ar.json.data.id, attributes: { gamblingSimulated: 'NONE' } } });
  line(arPatch.status === 200, 'age rating: Simulated Gambling = NONE', arPatch.status === 200 ? arPatch.json.data.attributes.gamblingSimulated : `${arPatch.status} ${errText(arPatch)}`);
  ok &&= arPatch.status === 200;

  const rd = await call('GET', `/v1/appStoreVersions/${ver.id}/appStoreReviewDetail`);
  const rdPatch = await call('PATCH', `/v1/appStoreReviewDetails/${rd.json.data.id}`, { data: { type: 'appStoreReviewDetails', id: rd.json.data.id, attributes: { notes: NOTES } } });
  line(rdPatch.status === 200, 'review notes updated', rdPatch.status === 200 ? '' : `${rdPatch.status} ${errText(rdPatch)}`);
  ok &&= rdPatch.status === 200;

  const b = await call('GET', `/v1/builds?filter[app]=${appId}&filter[version]=${buildVersion}&fields[builds]=version,processingState`);
  const build = b.json?.data?.[0];
  if (!build || build.attributes.processingState !== 'VALID') { line(false, `build ${buildVersion}`, build ? build.attributes.processingState : 'not found'); return; }
  const attach = await call('PATCH', `/v1/appStoreVersions/${ver.id}/relationships/build`, { data: { type: 'builds', id: build.id } });
  line(attach.status === 204, `attach build ${buildVersion}`, attach.status === 204 ? '' : `${attach.status} ${errText(attach)}`);
  ok &&= attach.status === 204;

  try {
    ok &&= await replaceScreenshots(ver.id);
  } catch (e) {
    line(false, 'screenshots', String(e.message));
    ok = false;
  }

  if (!ok) { console.log('NOT SUBMITTED: fix the failures above first'); return; }
  await submitVersion(appId, ver);
}

// Waits for the version's screenshots to finish processing (they can take several minutes)
async function screenshotsReady(verId, maxWaitMs) {
  const t0 = Date.now();
  for (;;) {
    const locs = await call('GET', `/v1/appStoreVersions/${verId}/appStoreVersionLocalizations`);
    const states = [];
    for (const l of locs.json.data) {
      const sets = await call('GET', `/v1/appStoreVersionLocalizations/${l.id}/appScreenshotSets?include=appScreenshots`);
      (sets.json?.included || []).forEach((sh) => states.push(sh.attributes?.assetDeliveryState?.state));
    }
    const pending = states.filter((st) => st !== 'COMPLETE');
    if (!pending.length) { line(true, 'screenshots processed', `${states.length}/${states.length}`); return true; }
    if (states.includes('FAILED')) { line(false, 'screenshots processed', states.join(',')); return false; }
    if (Date.now() - t0 > maxWaitMs) { line(false, 'screenshots processed', `${states.length - pending.length}/${states.length} complete, still processing`); return false; }
    await sleep(15000);
  }
}

// Only the submission part: used after a run where processing was still going on
async function finish() {
  const { appId, ver } = await appAndVersion();
  if (await screenshotsReady(ver.id, 8 * 60000)) await submitVersion(appId, ver);
  else console.log('NOT SUBMITTED: screenshots still processing, run "finish" again later');
}

async function submitVersion(appId, ver) {
  // Resubmit: reuse the submission that has unresolved issues, otherwise create a new one
  const subs = await call('GET', `/v1/reviewSubmissions?filter[app]=${appId}&filter[platform]=IOS&limit=10`);
  let sub = (subs.json.data || []).find((x) => ['UNRESOLVED_ISSUES', 'READY_FOR_REVIEW'].includes(x.attributes.state));
  if (!sub) {
    const mk = await call('POST', '/v1/reviewSubmissions', { data: { type: 'reviewSubmissions', attributes: { platform: 'IOS' }, relationships: { app: { data: { type: 'apps', id: appId } } } } });
    sub = mk.json?.data;
    line(mk.status === 201, 'create review submission', mk.status === 201 ? sub.id : `${mk.status} ${errText(mk)}`);
    if (!sub) return;
  }
  const items = await call('GET', `/v1/reviewSubmissions/${sub.id}/items?include=appStoreVersion`);
  const hasVersion = (items.json?.data || []).some((it) => it.relationships?.appStoreVersion?.data?.id === ver.id);
  if (!hasVersion) {
    const add = await call('POST', '/v1/reviewSubmissionItems', { data: { type: 'reviewSubmissionItems', relationships: { reviewSubmission: { data: { type: 'reviewSubmissions', id: sub.id } }, appStoreVersion: { data: { type: 'appStoreVersions', id: ver.id } } } } });
    line(add.status === 201, 'add version to submission', add.status === 201 ? '' : `${add.status} ${errText(add)}`);
  }
  // After a rejection the old item must be marked resolved before the submission can be sent again
  for (const it of items.json?.data || []) {
    if (it.attributes?.state === 'REJECTED') {
      const r = await call('PATCH', `/v1/reviewSubmissionItems/${it.id}`, { data: { type: 'reviewSubmissionItems', id: it.id, attributes: { resolved: true } } });
      line(r.status === 200, 'mark rejected item resolved', r.status === 200 ? r.json.data.attributes.state : `${r.status} ${errText(r)}`);
    }
  }
  // Apple needs a moment after a build/screenshot change ("Version is not ready to be submitted yet"): retry
  let submit;
  for (let attempt = 1; attempt <= 8; attempt++) {
    submit = await call('PATCH', `/v1/reviewSubmissions/${sub.id}`, { data: { type: 'reviewSubmissions', id: sub.id, attributes: { submitted: true } } });
    if (submit.status === 200 || !JSON.stringify(submit.json || {}).includes('not ready')) break;
    console.log(`  not ready yet, retry ${attempt}/8 in 30 s`);
    await sleep(30000);
  }
  line(submit.status === 200, 'SUBMIT FOR REVIEW', submit.status === 200 ? `state=${submit.json.data.attributes.state}` : `${submit.status} ${errText(submit)}`);
}

// Pull a submission that is still waiting for review (to swap in a newer build), then submit that build
async function resubmit(buildVersion) {
  const { appId } = await appAndVersion();
  const subs = await call('GET', `/v1/reviewSubmissions?filter[app]=${appId}&filter[platform]=IOS&limit=10`);
  const waiting = (subs.json?.data || []).find((x) => ['WAITING_FOR_REVIEW', 'READY_FOR_REVIEW'].includes(x.attributes.state));
  if (waiting && waiting.attributes.state === 'WAITING_FOR_REVIEW') {
    const c = await call('PATCH', `/v1/reviewSubmissions/${waiting.id}`, { data: { type: 'reviewSubmissions', id: waiting.id, attributes: { canceled: true } } });
    line(c.status === 200, 'cancel waiting submission', c.status === 200 ? c.json.data.attributes.state : `${c.status} ${errText(c)}`);
    if (c.status !== 200) return;
    for (let i = 0; i < 30; i++) {
      const r = await call('GET', `/v1/reviewSubmissions/${waiting.id}`);
      const st = r.json?.data?.attributes?.state;
      if (st && st !== 'CANCELING') { line(true, 'submission after cancel', st); break; }
      await sleep(4000);
    }
  }
  await prepareAndSubmit(buildVersion);
}

const req = JSON.parse(fs.readFileSync('.github/asc/request.json', 'utf8'));
console.log(`ASC request #${req.id}: ${req.tasks.join(', ')} [${process.env.ASC_KEY_KIND || 'local key'}]`);
for (const t of req.tasks) {
  if (t === 'check') await check();
  else if (t === 'inspect') await inspect();
  else if (t.startsWith('submit:')) await prepareAndSubmit(t.split(':')[1]);
  else if (t.startsWith('resubmit:')) await resubmit(t.split(':')[1]);
  else if (t === 'finish') await finish();
  else console.log(`unknown task ${t}`);
}
