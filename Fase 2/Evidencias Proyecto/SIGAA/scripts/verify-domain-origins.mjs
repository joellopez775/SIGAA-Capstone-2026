// HTTP checks over the live demo. These do NOT certify TLS/DNS on the new hostname.
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const demo = 'https://winter-mount-aluminum-removable.trycloudflare.com';
const permanent = 'https://sigaa.ignisert.com';
const accounts = {
  ...JSON.parse(await readFile(new URL('../.secrets/hosted-accounts.json', import.meta.url))),
  ...JSON.parse(await readFile(new URL('../.secrets/operations-accounts.json', import.meta.url))),
};
const checks = [];
async function request(path, {method='GET', origin, body, cookie, csrf} = {}) {
  return fetch(demo + '/api' + path, {method, headers:{
    ...(origin ? {origin} : {}), ...(body ? {'content-type':'application/json'} : {}),
    ...(cookie ? {cookie} : {}), ...(csrf ? {'x-csrf-token':csrf} : {}),
  }, ...(body ? {body:JSON.stringify(body)} : {}), signal:AbortSignal.timeout(20000)});
}
for (const origin of [demo, permanent]) for (const role of ['admin','inspector','teacher','student']) {
  const response = await request('/auth/login', {method:'POST', origin, body:accounts[role]});
  assert.equal(response.status, 200, `login ${role} ${origin}`);
  const session = await response.json(), flags=response.headers.get('set-cookie'), cookie=flags.split(';')[0];
  try {
    assert.equal(session.user.role,role);
    assert.ok(flags.startsWith('__Host-sigaa_session=') && /; Secure/.test(flags) && /; HttpOnly/.test(flags) && /; SameSite=Strict/.test(flags));
    assert.ok(!/Domain=/i.test(flags));
    assert.equal((await request('/auth/me',{cookie})).status,200);
    assert.equal((await request('/auth/logout',{method:'POST',origin,cookie,body:{}})).status,403);
    checks.push({origin,role,login:true,secureHostCookie:true,sessionRead:true,csrfRequired:true});
  } finally {
    assert.equal((await request('/auth/logout',{method:'POST',origin,cookie,csrf:session.csrfToken,body:{}})).status,204);
  }
}
for (const origin of [undefined,'null','http://sigaa.ignisert.com','https://sigaa.ignisert.com.evil.test'])
  assert.equal((await request('/auth/login',{method:'POST',origin,body:{}})).status,403);
assert.equal((await request('/health')).status,200);
const result = {date:new Date().toISOString(),transport:demo,newHostnameTlsTested:false,checks,rejectedOrigins:4,result:'passed'};
await writeFile(new URL('../output/evidence/domain-origins-tests.json',import.meta.url), JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({result:'passed',roleOriginCombinations:checks.length,rejectedOrigins:4,newHostnameTlsTested:false}));
