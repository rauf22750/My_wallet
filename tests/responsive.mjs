import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const user={id:'test-admin',email:'long-administrator-name@example.com',app_metadata:{role:'admin'}};
const wallet={version:1,categories:[{id:'fund',name:'Home construction and household improvements',target:100000000}],transactions:[{id:'t',category:'fund',note:'Construction materials and transport for the new house',person:'',type:'expense',date:'2026-09-21',amount:12500000}]};
try{for(const role of ['admin','user'])for(const width of [320,375,390,768,1024,1440]){user.app_metadata.role=role;const page=await browser.newPage({viewport:{width,height:850}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/config.js',r=>r.fulfill({contentType:'text/javascript',body:'export default {supabaseUrl:"https://mock.supabase.co",supabaseKey:"public"};'}));await page.route('https://mock.supabase.co/**',r=>{const path=new URL(r.request().url()).pathname;r.fulfill({json:path.includes('/token')?{user,access_token:'test',refresh_token:'test',expires_at:9999999999}:path.includes('/wallets')?[{data:wallet}]:user});});await page.route('**/api/admin',r=>r.fulfill({json:{users:[{...user,role:'admin'},{id:'member',email:'member-with-long-email-address@example.com',name:'Example Member',role:'user'}]}}));
const fits=async(label)=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px overflow: ${label}`);
await page.goto('http://localhost:3001');await fits('login');await page.locator('#login-email').fill(user.email);await page.locator('#login-password').fill('test-password');await page.locator('#login-form button').click();await page.waitForSelector('body:not(.signed-out)');await fits('home');
if(role==='admin'){
await page.locator('#new-user').waitFor();assert.equal(await page.locator('#add-entry').isVisible(),false);assert.equal(await page.locator('[data-page="funds"]').isVisible(),false);
await page.locator('#new-user').click();await fits('add user');await page.locator('#cancel').click();await page.getByRole('button',{name:'View details',exact:true}).click();await fits('member details');assert.equal(await page.locator('#add-entry').isVisible(),false);assert.equal(await page.locator('[data-add-fund]').isVisible(),false);await page.locator('[data-page="transactions"]').click();assert.equal(await page.locator('[data-edit]:visible').count(),0);await page.locator('#return-wallet').click();await page.locator('#new-user').waitFor();
}else{
assert.equal(await page.getByRole('button',{name:'Manage users',exact:true}).isVisible(),false);
for(const section of ['transactions','funds','people']){await page.locator(`[data-page="${section}"]`).click();await fits(section);}
await page.locator('#add-entry').click();assert(await page.locator('#modal').isVisible());await fits('transaction form');await page.locator('#cancel').click();
}
assert.deepEqual(errors,[]);console.log(`${role} ${width}px: role controls and layout passed`);await page.close();}}finally{await browser.close();}
