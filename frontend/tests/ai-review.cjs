// Uses synthetic demo reports only; credentials are read privately and never logged.
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const values = Object.fromEntries(fs.readFileSync('../backend/.env','utf8').split(/\r?\n/).filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)];}));
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3005';
(async()=>{
 const browser=await chromium.launch({headless:true, channel:'chrome'});
 try {
  const customer=await browser.newContext();
  const headers={'x-parcelcare-request':'1'};
  let response=await customer.request.post(`${base}/api/auth/login`,{headers,data:{email:'customer.a@parcelcare.demo',password:values.DEMO_PASSWORD}});
  assert.equal(response.status(),200);
  response=await customer.request.post(`${base}/api/reports`,{headers:{...headers,'Idempotency-Key':crypto.randomUUID()},data:{tracking_id:'PC-1001',category:'WRONG_ADDRESS',description:`Synthetic AI review test ${Date.now()}: my apartment number is missing; please request confirmation before changing it.`}});
  assert.equal(response.status(),201);
  const id=(await response.json()).case_id;
  assert.equal((await customer.request.get(`${base}/api/cases/${id}/ai-review`)).status(),403);
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.setDefaultTimeout(45000);
  await page.goto(base);
  await page.getByLabel('Email address').fill('staff@parcelcare.demo');
  await page.getByLabel('Password',{exact:true}).fill(values.DEMO_PASSWORD);
  await page.getByRole('button',{name:'Open my workspace'}).click();
  await page.waitForURL('**/staff**');
  await page.goto(`${base}/staff/cases/${id}`);
  await page.getByRole('button',{name:'Run seven AI checks'}).click();
  await page.getByText('COMPLETED',{exact:true}).waitFor({timeout:60000});
  const panel=page.getByRole('region',{name:'AI triage review'});
  for (const name of ['classification','summary','priority','missing data','duplicates','evidence consistency','next action']) {
   assert.equal(await panel.getByRole('heading',{name:new RegExp(name)}).count(),1);
  }
  await page.reload();
  await page.getByText('COMPLETED',{exact:true}).waitFor();
  await page.screenshot({path:'artifacts/ai-review-light.png',fullPage:true});
  await page.getByRole('button',{name:'Switch to dark theme'}).click();
  await page.screenshot({path:'artifacts/ai-review-dark.png',fullPage:true});
  const detail=await (await page.request.get(`${base}/api/cases/${id}`)).json();
  assert.equal(detail.status,'OPEN'); assert.equal(detail.version,1);
  console.log('PASS: live Groq seven-check UI, saved review after reload, staff-only access, light/dark rendering and no case action.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
