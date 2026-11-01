// App Store Connect "robot": runs inside GitHub Actions with the repo secrets, so the API key never leaves GitHub.
// Never prints the key or the token. Tasks come from .github/asc/request.json.
import crypto from 'node:crypto';
import fs from 'node:fs';

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

const req = JSON.parse(fs.readFileSync('.github/asc/request.json', 'utf8'));
console.log(`ASC request #${req.id}: ${req.tasks.join(', ')}`);
for (const t of req.tasks) {
  if (t === 'check') await check();
  else if (t === 'inspect') await inspect();
  else console.log(`unknown task ${t}`);
}
