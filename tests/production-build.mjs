import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PV_PLAYWRIGHT_PATH || '/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/playwright-core');
const base = 'http://127.0.0.1:8766';
const output = path.resolve(process.env.PV_QA_OUTPUT || '../outputs/application-launch');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({headless:true,executablePath:process.env.PV_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const checks = [], external = [], errors = [];
async function check(name, fn) { await fn(); checks.push(name); }
async function pageAt(width=390, headers={}) {
  const context=await browser.newContext({viewport:{width,height:844},extraHTTPHeaders:headers});
  const page=await context.newPage();
  page.on('request',r=>{if(new URL(r.url()).origin!==base) external.push(r.url());});
  page.on('pageerror',e=>errors.push(e.message));
  return page;
}
async function fill(page) {
  await page.locator('#name').fill('TEST ONLY — not a real prospect');
  await page.locator('#email').fill('ryangrandafit@gmail.com');
  await page.locator('#experience').selectOption('Starting fresh');
  await page.locator('#goal').selectOption('Build a consistent routine');
  await page.locator('#adult').check();await page.locator('#next').click();
  await page.getByLabel('3 days',{exact:true}).check();await page.locator('#next').click();
  await page.getByLabel('Yes, this feels workable',{exact:true}).check();await page.locator('#next').click();
}
try {
  for(const width of [320,390,430,1280]) {
    const page=await pageAt(width);
    await check(`Production application/policy/journey routes fit ${width}px and keep enrollment unavailable`,async()=>{
      for(const route of ['/', '/apply', '/application-privacy', '/privacy-policy', '/terms-and-conditions', '/refund-policy', '/disclaimer', '/start', '/onboard']) {
        const response=await page.goto(base+route);assert.equal(response.status(),200);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route);
        assert.equal(await page.locator('script[src*="netlify"], iframe[src*="netlify"], link[href*="fonts.google"]').count(),0);
        if(route==='/apply') {
          await page.waitForSelector('#application-card:not([hidden])');
          assert.equal(await page.locator('#preview-note').count(),0);
          assert.equal(await page.locator('#application').getAttribute('data-netlify'),'true');
          assert((await page.locator('#application-submit-notice').textContent()).includes('not enrollment'));
          if(width===390) await page.screenshot({path:path.join(output,'production-application-mobile.png'),fullPage:true});
        }
        if(route==='/application-privacy') {
          const content=await page.locator('#main').textContent();
          for(const text of ['Powered Vitality LLC','Union City, California','Effective date: October 7, 2026','Google/Gmail','Netlify Forms','Do Not Track','required retention','revised effective date']) assert(content.includes(text),text);
          assert(!content.includes('HIPAA'));assert(!content.includes('Jotform'));
          if(width===390) await page.screenshot({path:path.join(output,'production-privacy-mobile.png'),fullPage:true});
        }
        if(route==='/start') {
          assert((await page.locator('.state-pill').textContent()).includes('6 steps'));
          assert.equal(await page.locator('#consultation-scheduling li').count(),3);
          assert(await page.getByRole('button',{name:/Payment · Unavailable/}).isDisabled());
          assert.equal(await page.locator('a[href*="buy.stripe.com"], a[href*="calendly.com"]').count(),0);
        }
        if(route==='/onboard') assert.equal(await page.locator('form, input, select, textarea').count(),0);
      }
    });await page.context().close();
  }
  for(const outcome of ['200','500','network-error']) {
    const page=await pageAt();let count=0,payload;
    await page.route('**/apply',route=>{
      if(route.request().method()!=='POST')return route.continue();
      count++;payload=new URLSearchParams(route.request().postData());
      return outcome==='network-error'?route.abort('failed'):route.fulfill({status:Number(outcome),body:outcome==='200'?'OK':'Error'});
    });await page.goto(base+'/apply');
    await check(`Mocked production ${outcome} has honest status and no automatic or repeat POST`,async()=>{
      await fill(page);
      await page.locator('#application').evaluate(form=>{
        const extra=document.createElement('input');extra.name='diagnosis';extra.value='excluded synthetic field';form.append(extra);
      });
      const reference=await page.locator('#application-id').inputValue();
      await page.locator('#submit').click();
      if(outcome==='200') {
        await page.waitForSelector('#success:not([hidden])');
        assert((await page.locator('#success-copy').textContent()).includes('You have not been enrolled or charged'));
        assert.equal(await page.evaluate(()=>sessionStorage.getItem('pv-application-reference-v2')),null);
      } else {
        await page.waitForSelector('#form-error:not([hidden])');
        assert((await page.locator('#form-error-text').textContent()).includes('could not confirm'));
        assert((await page.locator('#form-error-text').textContent()).includes(reference));
        assert(await page.locator('#submit').isDisabled());
        await page.locator('#application').evaluate(form=>form.requestSubmit());
        assert.equal(count,1);
        await page.reload();await page.waitForSelector('#application-card:not([hidden])');
        assert.equal(await page.locator('#application-id').inputValue(),reference);
        assert((await page.locator('#form-error-text').textContent()).includes(reference));
        assert.equal(count,1);
        await page.getByRole('button',{name:'Clear unsent answers',exact:true}).click();
        assert.equal(await page.evaluate(()=>sessionStorage.getItem('pv-application-reference-v2')),null);
        assert.equal(count,1);
      }
      assert.equal(count,1);assert.equal(payload.get('email'),'ryangrandafit@gmail.com');
      assert.equal(payload.get('adult'),'18-or-older');assert.equal(payload.get('application-version'),'2026-10-07-v2');
      assert(!payload.has('diagnosis'));assert(!payload.has('encouragement'));assert(!payload.has('limitations'));
    });await page.context().close();
  }
  await check('Production application behaves consistently with DNT=1 and loads no off-origin resources',async()=>{
    const page=await pageAt(390,{DNT:'1'});await page.goto(base+'/apply');await fill(page);
    assert(await page.locator('#submit').isEnabled());
    assert.equal(await page.locator('#application-submit-notice a[href="/application-privacy"]').count(),1);
    await page.context().close();assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
  });
  const result={passed:checks.length,checks,externalRequests:external,uncaughtErrors:errors,realSubmissionCount:0};
  await writeFile(path.join(output,'production-build-qa.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
} finally {await browser.close();}
