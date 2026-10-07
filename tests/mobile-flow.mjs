import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(import.meta.url);
let chromium;
try { ({chromium} = require('playwright')); }
catch { ({chromium} = require(process.env.PV_PLAYWRIGHT_PATH || '/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/playwright-core')); }
const output = path.resolve(process.env.PV_QA_OUTPUT || '../outputs');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.PV_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const results = [];
const errors = [];
const base = 'http://127.0.0.1:8765';
async function check(name, work) { await work(); results.push({name, passed:true}); }
async function newPage(width=390, options={}) {
  const context = await browser.newContext({viewport:{width,height:844}, ...options});
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.on('pageerror', e => errors.push(e.message));
  return page;
}
async function firstStep(page) {
  await page.getByLabel('Your name', {exact:true}).fill('Preview Applicant');
  await page.getByLabel('Email address', {exact:true}).fill('preview@example.com');
  await page.getByLabel('Where are you starting?', {exact:true}).selectOption({label:'Restarting after time away'});
  await page.getByLabel('What is your main goal?', {exact:true}).selectOption({label:'Build a consistent routine'});
  await page.getByRole('button', {name:'Continue'}).click();
}
async function fillAll(page) {
  await firstStep(page);
  await page.getByLabel('3 days', {exact:true}).check();
  await page.getByLabel('What does your routine look like?', {exact:false}).fill('A couple of walks each week.');
  await page.getByLabel('Where would you train?', {exact:false}).selectOption({label:'Home with some equipment'});
  await page.getByRole('button', {name:'Continue'}).click();
  await page.getByLabel('Yes, this feels workable', {exact:true}).check();
  await page.getByLabel('Why coaching, and why now?', {exact:false}).fill('I want a repeatable routine and personal accountability.');
  await page.getByRole('button', {name:'Continue'}).click();
}
try {
  for(const width of [320,360,390,430,768,1280]) {
    const page = await newPage(width);
    await check(`No horizontal overflow at ${width}px on every route`, async () => {
      for(const route of ['/', '/apply', '/start', '/onboard']) {
        await page.goto(base+route);
        if (route==='/apply') await page.waitForSelector('#application-card:not([hidden])');
        if (route==='/onboard') await page.waitForSelector('#preferences-card:not([hidden])');
        const dimensions = await page.evaluate(() => ({viewport:innerWidth, content:document.documentElement.scrollWidth}));
        assert(dimensions.content <= dimensions.viewport, `${route}: ${JSON.stringify(dimensions)}`);
      }
    });
    if(width===390) {
      await page.goto(base+'/'); await page.screenshot({path:path.join(output,'home-mobile.png'), fullPage:true});
      await page.goto(base+'/apply'); await page.screenshot({path:path.join(output,'apply-mobile.png'),fullPage:true});
      await page.goto(base+'/start'); await page.screenshot({path:path.join(output,'journey-mobile.png'),fullPage:true});
      await page.goto(base+'/onboard'); await page.screenshot({path:path.join(output,'onboarding-mobile.png'),fullPage:true});
    }
    await page.context().close();
  }
  const page = await newPage();
  let posts=0;page.on('request', req => {if(req.method()==='POST') posts++;});
  await page.goto(base+'/apply');
  await check('Required fields validate accessibly; email keyboard and autocomplete', async () => {
    assert.equal(await page.locator('#email').getAttribute('type'),'email');
    assert.equal(await page.locator('#email').getAttribute('inputmode'),'email');
    assert.equal(await page.locator('#email').getAttribute('autocomplete'),'email');
    await page.getByRole('button',{name:'Continue'}).click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'name');
    assert.equal(await page.locator('#name').getAttribute('aria-invalid'),'true');
    assert(await page.locator('#name-error').isVisible());
    await page.getByLabel('Your name',{exact:true}).fill('Preview Applicant');
    await page.getByLabel('Email address',{exact:true}).fill('invalid');
    await page.getByRole('button',{name:'Continue'}).click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'email');
  });
  await check('Back/Forward preserve answers, required radio group validates', async () => {
    await firstStep(page);
    await page.getByRole('button',{name:'Continue'}).click();
    assert(await page.locator('#days-error').isVisible());
    await page.getByLabel('3 days',{exact:true}).check();
    await page.getByLabel('What does your routine look like?',{exact:false}).fill('Preview routine');
    await page.getByRole('button',{name:'Back',exact:true}).click();
    assert.equal(await page.locator('#name').inputValue(),'Preview Applicant');
    await page.goBack();
    assert(await page.locator('[data-step="1"]').isVisible());
    assert(await page.getByLabel('3 days',{exact:true}).isChecked());
    assert.equal(await page.locator('#routine').inputValue(),'Preview routine');
    await page.goForward();
    assert(await page.locator('[data-step="0"]').isVisible());
  });
  await check('Reload persists only allowed choices and clears identifying/written answers', async () => {
    const stored = await page.evaluate(()=>JSON.parse(sessionStorage.getItem('pv-application-choices-v1')));
    assert.deepEqual(Object.keys(stored), ['experience','goal','days','equipment','barrier','nutrition','budget']);
    assert(!JSON.stringify(stored).includes('Preview Applicant'));
    assert(!JSON.stringify(stored).includes('Preview routine'));
    await page.reload();
    assert.equal(await page.locator('#name').inputValue(),'');
    assert.equal(await page.locator('#email').inputValue(),'');
    assert.equal(await page.locator('#routine').inputValue(),'');
    assert.equal(await page.locator('#experience').inputValue(),'Restarting after time away');
  });
  await check('Review editing, no injected HTML, loading and duplicate-submit protection', async () => {
    await fillAll(page);
    assert(await page.getByRole('heading',{name:'Looks like you?'}).isVisible());
    await page.getByRole('button',{name:'Edit your start',exact:true}).click();
    await page.getByLabel('Your name',{exact:true}).fill('<img src=x onerror=alert(1)>');
    await page.getByRole('button',{name:'Continue'}).click();
    await page.getByRole('button',{name:'Continue'}).click();
    await page.getByRole('button',{name:'Continue'}).click();
    assert.equal(await page.locator('#review img').count(),0);
    assert((await page.locator('#review').textContent()).includes('<img src=x onerror=alert(1)>'));
    await page.screenshot({path:path.join(output,'review-mobile.png'),fullPage:true});
    const submit=page.locator('#submit');
    await submit.click();
    assert(await submit.isDisabled());
    assert.equal(await page.locator('#application').getAttribute('aria-busy'),'true');
    await page.locator('#application').evaluate(form=>form.requestSubmit());
    await page.waitForSelector('#success:not([hidden])');
    assert((await page.locator('#success-copy').textContent()).includes('Nothing was sent'));
    const nextSteps = await page.locator('#success ol li').allTextContents();
    assert(nextSteps[1].includes('30-minute Zoom consultation'));
    assert(nextSteps[2].includes('After your consultation'));
    assert(nextSteps[3].includes('1st check-in'));
    assert.equal(posts,0);
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('pv-application-choices-v1')),null);
    await page.screenshot({path:path.join(output,'success-mobile.png'),fullPage:true});
  });
  await page.context().close();
  const failPage=await newPage();await failPage.goto(base+'/apply?preview-error=1');
  await check('Preview error preserves answers and permits recovery',async()=>{
    await fillAll(failPage);await failPage.locator('#submit').click();
    await failPage.waitForSelector('#form-error:not([hidden])');
    assert(await failPage.locator('#submit').isEnabled());
    assert.equal(await failPage.locator('#name').inputValue(),'Preview Applicant');
    assert(!(await failPage.locator('#success').isVisible()));
    await failPage.screenshot({path:path.join(output,'error-mobile.png'),fullPage:true});
  });await failPage.context().close();
  const keyboard=await newPage();await keyboard.goto(base+'/apply');
  await check('Keyboard tab order, Enter advances and no hidden-step focus',async()=>{
    await keyboard.keyboard.press('Tab');
    assert.equal(await keyboard.evaluate(()=>document.activeElement.textContent),'Skip to application');
    await keyboard.keyboard.press('Enter');
    await keyboard.locator('#name').focus();
    await keyboard.keyboard.type('Keyboard Preview');
    await keyboard.keyboard.press('Tab');
    assert.equal(await keyboard.evaluate(()=>document.activeElement.id),'email');
    await keyboard.keyboard.type('keyboard@example.com');
    await keyboard.keyboard.press('Tab');
    assert.equal(await keyboard.evaluate(()=>document.activeElement.id),'instagram');
    await keyboard.keyboard.press('Tab');
    assert.equal(await keyboard.evaluate(()=>document.activeElement.id),'experience');
    await keyboard.locator('#experience').selectOption({label:'Starting fresh'});
    await keyboard.keyboard.press('Tab');
    assert.equal(await keyboard.evaluate(()=>document.activeElement.id),'goal');
    await keyboard.locator('#goal').selectOption({label:'Build a consistent routine'});
    assert(await keyboard.locator('#experience').inputValue());
    assert(await keyboard.locator('#goal').inputValue());
    await keyboard.locator('#email').focus();
    await keyboard.keyboard.press('Enter');
    assert(await keyboard.locator('[data-step="1"]').isVisible());
    assert.equal(await keyboard.evaluate(()=>document.activeElement.id),'heading-1');
  });await keyboard.context().close();
  const gates=await newPage();await gates.goto(base+'/start');
  await check('Agreement/payment stay disabled, no public checkout, no fake client state',async()=>{
    assert.equal(await gates.locator('a[href*="buy.stripe.com"]').count(),0);
    assert(await gates.getByRole('button',{name:/Payment · Unavailable/}).isDisabled());
    assert(await gates.getByRole('button',{name:/Review & sign/}).isDisabled());
    assert((await gates.locator('.state-pill').textContent()).includes('0 of 6'));
    await gates.goto(base+'/');
    assert.equal(await gates.locator('a[href*="buy.stripe.com"]').count(),0);
    assert.equal(await gates.locator('a.btn-solid[href="/apply"]').count(),4);
  });await gates.context().close();
  const consultation=await newPage();await consultation.goto(base+'/start');
  await check('6-stage journey puts a disabled 30-minute Zoom consultation before enrollment',async()=>{
    const titles=await consultation.locator('.stage-title').allTextContents();
    const expected=['Apply for coaching','Ryan reviews your fit','30-minute Zoom consultation','Agreement & enrollment','Complete private onboarding','Starting plan & 1st check-in'];
    assert.equal(titles.length,6);expected.forEach((title,index)=>assert(titles[index].startsWith(title)));
    assert(await consultation.locator('#consultation-booking').isDisabled());
    assert((await consultation.locator('#consultation-status').textContent()).includes('Awaiting scheduling setup'));
    assert.equal(await consultation.locator('a[href*="calendly.com"]').count(),0);
    assert.equal(await consultation.locator('iframe[src*="calendly.com"]').count(),0);
    await consultation.getByRole('link',{name:'Open the application preview',exact:true}).click();
    await fillAll(consultation);await consultation.locator('#submit').click();
    await consultation.waitForSelector('#success:not([hidden])');
    await consultation.getByRole('link',{name:'See your next steps',exact:true}).click();
    assert(await consultation.locator('#consultation-booking').isDisabled());
    assert((await consultation.locator('.state-pill').textContent()).includes('0 of 6'));
  });await consultation.context().close();
  const configured=await newPage();
  await configured.route('**/assets/consultation-config.js',route=>route.fulfill({contentType:'text/javascript',body:"export const consultationConfig=Object.freeze({durationMinutes:30,meetingPlatform:'Zoom',confirmedBookingUrl:'https://calendly.com/ryangrandafit/coaching-call-clone'});"}));
  await configured.goto(base+'/start');
  await check('Configuring a link never enables public preview booking or bypasses review',async()=>{
    assert(await configured.locator('#consultation-booking').isDisabled());
    assert((await configured.locator('#consultation-status').textContent()).includes('invitation after Ryan'));
    assert.equal(await configured.locator('a[href*="calendly.com"]').count(),0);
    assert.equal(await configured.locator('iframe[src*="calendly.com"]').count(),0);
  });await configured.context().close();
  const prefs=await newPage();let prefPosts=0;prefs.on('request',req=>{if(req.method()==='POST')prefPosts++;});await prefs.goto(base+'/onboard');
  await check('Mobile nonmedical preferences validate and explain manual plan delivery',async()=>{
    await prefs.getByRole('button',{name:'Preview my next step'}).click();
    assert.equal(await prefs.evaluate(()=>document.activeElement.id),'focus');
    await prefs.locator('#focus').selectOption({label:'Build a routine I can repeat'});
    await prefs.locator('#training-days').selectOption({label:'Mostly weekdays'});
    await prefs.locator('#training-space').selectOption({label:'Home equipment'});
    assert((await prefs.locator('#preferences-count').textContent()).includes('3 of 3'));
    await prefs.getByRole('button',{name:'Preview my next step'}).click();
    assert(await prefs.locator('#preferences-success').isVisible());
    assert((await prefs.locator('#preferences-success').textContent()).includes('Nothing was sent or saved'));
    assert.equal(prefPosts,0);
  });await prefs.context().close();
  const nojs=await newPage(390,{javaScriptEnabled:false});await nojs.goto(base+'/apply');
  await check('No-JavaScript fallback has contact route and cannot submit data',async()=>{
    assert(await nojs.locator('.noscript').isVisible());
    assert(!(await nojs.locator('#application-card').isVisible()));
  });await nojs.context().close();
  for(const status of [200,500]) {
    const live=await newPage();let received;
    // Isolated browser response overrides exercise the prepared transport. No real POST is sent.
    await live.route('**/assets/application-config.js',route=>route.fulfill({contentType:'text/javascript',body:"export const applicationConfig = Object.freeze({submissionMode:'netlify',formName:'coaching-application',postTarget:'/apply',timeoutMs:1000});"}));
    await live.route('**/apply',route=>{if(route.request().method()==='POST'){received=route.request().postData();return route.fulfill({status,body:status===200?'OK':'Error'});}return route.continue();});
    await live.goto(base+'/apply');
    await check(`Prepared Netlify transport handles mocked HTTP ${status} without live transmission`,async()=>{
      await fillAll(live);await live.locator('#submit').click();
      if(status===200) {await live.waitForSelector('#success:not([hidden])');assert((await live.locator('#success-eyebrow').textContent()).includes('Application received'));}
      else {await live.waitForSelector('#form-error:not([hidden])');assert(!(await live.locator('#success').isVisible()));assert.equal(await live.locator('#name').inputValue(),'Preview Applicant');}
      const body=new URLSearchParams(received);assert.equal(body.get('form-name'),'coaching-application');assert.equal(body.get('email'),'preview@example.com');assert(body.get('application-id'));assert.equal(body.get('bot-field'),'');
    });await live.context().close();
  }
  await check('No JavaScript console errors',async()=>assert.deepEqual(errors,[]));
  await writeFile(path.join(output,'mobile-flow-qa.json'),JSON.stringify({baseline:'201582946d3644fcd82fe9032a7880187b94c232',results,consoleErrors:errors,liveDataTransmitted:false},null,2));
  console.log(JSON.stringify({passed:results.length,results,output},null,2));
} catch(error) {console.error(error);process.exitCode=1;}
finally {await browser.close();}
