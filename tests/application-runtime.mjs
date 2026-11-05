import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// Exercise the real application module against a bounded DOM/transport fixture.
// No browser, Netlify request, owner notification or real applicant data is used.
const source = (await readFile(new URL('../assets/application.js', import.meta.url), 'utf8')).replace(/^import[^\n]+\n/, '');
const html = await readFile(new URL('../apply.html', import.meta.url), 'utf8');
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? '';
const fieldDefinitions = [...html.matchAll(/<input\b([^>]+)>|<select\b([^>]+)>([\s\S]*?)<\/select>/g)].map(([, inputAttrs, selectAttrs, content]) => {
  const type = inputAttrs ? 'input' : 'select';
  const attrs = inputAttrs || selectAttrs;
  return ({
  name: attribute(attrs, 'name'), id: attribute(attrs, 'id'), type: attribute(attrs, 'type') || type,
  value: attribute(attrs, 'value'), options: type === 'select' ? [...content.matchAll(/<option([^>]*)>([^<]*)<\/option>/g)].map(([, attrs, text]) => ({ value: attrs.includes('value=') ? attribute(attrs, 'value') : text })) : [],
}); }).filter(field => field.name);
const expectedNames = ['form-name','application-id','application-version','subject','bot-field','name','email','instagram','adult','goal','barrier','experience','days','readiness'];
assert.deepEqual(fieldDefinitions.map(field => field.name), expectedNames);
assert.match(html, /name="coaching-application"[^>]*method="POST"[^>]*action="\/apply"[^>]*data-netlify="true"[^>]*netlify-honeypot="bot-field"/);
assert(!html.includes('name="budget"'));

let checks = 0;
const check = async (name, fn) => { await fn(); checks++; console.log(`PASS ${name}`); };
function createApp({ mode = 'netlify', outcome = '200', storage = new Map(), unavailableStorage = false } = {}) {
  let focused, sequence = 0;
  const requests = [], nodes = new Map(), timers = new Map();
  const element = (id = '') => {
    const classes = new Set();
    const node = { id, hidden: ['success','form-error','preview-note'].includes(id), textContent: '', disabled: false, value: '', name: '', type: '', validity: {valid:true}, options: [], listeners: {}, attributes: {},
      classList: {add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name)},
      addEventListener(name, fn) { this.listeners[name] = fn; },
      setAttribute(name, value) { this.attributes[name] = value; },
      removeAttribute(name) { delete this.attributes[name]; },
      focus() { focused = this.id; }, scrollIntoView() {}, closest() { return this; },
    };
    if (id) nodes.set(id, node);
    return node;
  };
  for (const id of ['application','submit','clear','form-error','form-error-text','draft-help','application-privacy-before','success','success-eyebrow','success-title','success-copy','preview-note']) element(id);
  const form = nodes.get('application');
  form.elements = fieldDefinitions.map(definition => Object.assign(element(definition.id), definition, { value: definition.value, disabled: !['hidden','bot-field'].includes(definition.type), options: definition.options.map(option => ({...option})) }));
  for (const control of form.elements) {
    form.elements[control.name] = control;
    if (control.name && control.type !== 'hidden' && control.name !== 'bot-field') element(`${control.name}-error`).hidden = true;
  }
  form.reset = () => { for (const control of form.elements) control.value = fieldDefinitions.find(definition => definition.name === control.name)?.value || ''; };
  form.querySelectorAll = selector => selector === 'fieldset' ? [{disabled:true},{disabled:true}] : [];
  const document = {
    querySelector(selector) { return nodes.get(selector.slice(1)) || null; },
    querySelectorAll(selector) { return selector === '.error' ? [...nodes.values()].filter(node => node.id.endsWith('-error') && node.id !== 'form-error') : []; },
  };
  const sessionStorage = {
    getItem(key) { if(unavailableStorage) throw Error('blocked'); return storage.get(key) ?? null; },
    setItem(key, value) { if(unavailableStorage) throw Error('blocked'); storage.set(key, String(value)); },
    removeItem(key) { if(unavailableStorage) throw Error('blocked'); storage.delete(key); },
  };
  let pendingResolve;
  const fetch = async (url, request) => {
    requests.push({url, ...request});
    if (outcome === 'pending') return new Promise(resolve => { pendingResolve = resolve; });
    if (outcome === 'network-error') throw Error('network');
    if (outcome === 'timeout') return new Promise((resolve, reject) => request.signal.addEventListener('abort', () => reject(Error('timeout'))));
    return {ok: outcome === '200', status:Number(outcome)};
  };
  class FormData {
    constructor(form) { this.entries = form.elements.filter(control => control.name && !control.disabled).map(control => [control.name,control.value]); }
    [Symbol.iterator]() { return this.entries[Symbol.iterator](); }
  }
  const context = vm.createContext({config:{submissionMode:mode,formName:'coaching-application',postTarget:'/apply',timeoutMs:15000},document,sessionStorage,FormData,URLSearchParams,AbortController,fetch,
    crypto:{randomUUID:() => `00000000-0000-4000-8000-${String(++sequence).padStart(12,'0')}`},
    setTimeout(fn) { const id=timers.size+1;timers.set(id,fn);return id; },clearTimeout(id) {timers.delete(id);},console,
  });
  vm.runInContext(source, context);
  const valid = () => Object.assign(form.elements.name,{value:'TEST ONLY — synthetic fixture'}) && Object.assign(form.elements.email,{value:'example@example.invalid'}) && Object.assign(form.elements.adult,{value:'18-or-older'}) && Object.assign(form.elements.goal,{value:'Build a consistent routine'}) && Object.assign(form.elements.barrier,{value:'Finding time'}) && Object.assign(form.elements.readiness,{value:'Within a month'});
  return {nodes,form,requests,storage,timers,valid,focused:() => focused,
    submit:() => form.listeners.submit({preventDefault(){}}), input:() => form.listeners.input(),
    clear:() => nodes.get('clear').listeners.click(),
    complete:() => pendingResolve({ok:true,status:200}),
  };
}

await check('validation rejects empty, underage and injected select answers without transport',async()=>{
  const app=createApp();await app.submit();assert.equal(app.requests.length,0);assert.equal(app.focused(),'name');
  for(const name of ['name','email','adult','goal','barrier','readiness']) assert.equal(app.form.elements[name].attributes['aria-invalid'],'true');
  app.valid();app.form.elements.adult.value='under-18';await app.submit();assert.equal(app.requests.length,0);assert.equal(app.focused(),'adult');
  app.valid();app.form.elements.days.value='unlisted injected value';await app.submit();assert.equal(app.requests.length,0);assert.equal(app.focused(),'days');
});
await check('honeypot never reports success or sends',async()=>{
  const app=createApp();app.valid();app.form.elements['bot-field'].value='synthetic bot';await app.submit();assert.equal(app.requests.length,0);assert.equal(app.nodes.get('success').hidden,true);
});
await check('one allowlisted POST trims contacts and excludes extra fields; successful receipt blocks repeat sends',async()=>{
  const app=createApp();app.valid();app.form.elements.name.value='  Synthetic test  ';app.form.elements.email.value='  test@example.invalid  ';
  app.form.elements.push({name:'diagnosis',value:'excluded fixture',disabled:false});await app.submit();await app.submit();
  assert.equal(app.requests.length,1);const sent=app.requests[0];assert.equal(sent.url,'/apply');assert.equal(sent.method,'POST');
  const payload=new URLSearchParams(sent.body);assert.equal(payload.get('form-name'),'coaching-application');assert.equal(payload.get('name'),'Synthetic test');assert.equal(payload.get('email'),'test@example.invalid');assert.equal(payload.get('adult'),'18-or-older');assert.equal(payload.get('application-version'),'2026-11-04-v4');assert(!payload.has('diagnosis'));assert(!payload.has('budget'));
  assert.equal(app.form.hidden,true);assert.equal(app.nodes.get('success').hidden,false);assert.equal(app.storage.size,0);assert.equal(app.focused(),'success-title');
});
await check('in-flight submissions and inputs are locked against repeated sends',async()=>{
  const app=createApp({outcome:'pending'});app.valid();const pending=app.submit();assert.equal(app.nodes.get('submit').disabled,true);assert.equal(app.nodes.get('clear').disabled,true);assert(app.form.elements.filter(control=>control.type!=='hidden').every(control=>control.disabled));await app.submit();assert.equal(app.requests.length,1);app.complete();await pending;
});
for(const outcome of ['500','network-error','timeout']) await check(`${outcome} preserves reference and answers; clear/reload cannot automatically resend`,async()=>{
  const app=createApp({outcome});app.valid();let pending=app.submit();if(outcome==='timeout') [...app.timers.values()][0]();await pending;
  assert.equal(app.requests.length,1);assert.equal(app.nodes.get('success').hidden,true);assert.equal(app.nodes.get('submit').disabled,true);assert.equal(app.form.elements.name.value,'TEST ONLY — synthetic fixture');
  const reference=app.storage.get('pv-application-reference-v2');assert(reference);assert(app.nodes.get('form-error-text').textContent.includes(reference));await app.submit();assert.equal(app.requests.length,1);
  app.clear();assert.equal(app.storage.get('pv-application-reference-v2'),reference);assert.equal(app.nodes.get('submit').disabled,true);
  const reloaded=createApp({storage:app.storage});reloaded.valid();await reloaded.submit();assert.equal(reloaded.requests.length,0);assert.equal(reloaded.form.elements['application-id'].value,reference);
});
await check('only noncontact choices are persisted and restored',async()=>{
  const app=createApp();app.valid();app.input();const saved=JSON.parse(app.storage.get('pv-application-choices-v3'));assert.deepEqual(Object.keys(saved),['goal','barrier','experience','days','readiness']);assert(!JSON.stringify(saved).includes('example.invalid'));
  const reloaded=createApp({storage:app.storage});assert.equal(reloaded.form.elements.goal.value,'Build a consistent routine');assert.equal(reloaded.form.elements.name.value,'');assert.equal(reloaded.form.elements.adult.value,'');
});
await check('preview mode simulates without transport and never claims receipt',async()=>{
  const app=createApp({mode:'preview'});app.valid();await app.submit();assert.equal(app.requests.length,0);assert.equal(app.nodes.get('success-title').textContent,'Nothing has been sent.');assert.equal(app.nodes.get('preview-note').hidden,false);
});
await check('blocked storage does not break a successful application',async()=>{
  const app=createApp({unavailableStorage:true});app.valid();app.input();await app.submit();assert.equal(app.requests.length,1);assert.equal(app.nodes.get('success').hidden,false);
});
console.log(`PASS ${checks} application runtime scenarios. Real submissions: 0.`);
