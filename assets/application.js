import { applicationConfig as config } from './application-config.js';

const form = document.querySelector('#application');
const steps = [...document.querySelectorAll('[data-step]')];
const stepLabels = ['Your start', 'Your week', 'Your support', 'Review'];
const safeFields = ['experience', 'goal', 'days', 'routine', 'equipment', 'schedule', 'barrier', 'nutrition', 'reason', 'budget'];
const storageKey = 'pv-application-choices-v2';
const publicFields = ['form-name', 'application-id', 'application-version', 'subject', 'bot-field', 'name', 'email', 'instagram', 'adult', ...safeFields];
const next = document.querySelector('#next');
const back = document.querySelector('#back');
const submit = document.querySelector('#submit');
const errorBox = document.querySelector('#form-error');
let step = 0;
let busy = false;
let finished = false;
let applicationId = newId();
let needsReceiptCheck = false;
const referenceKey = 'pv-application-reference-v2';
try {
  const saved = sessionStorage.getItem(referenceKey);
  if (/^(?:[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}|pv-\d+-[a-z0-9]+)$/i.test(saved || '')) {
    applicationId = saved;
    // A saved sending reference represents an uncertain earlier outcome.
    // Never automatically send it again or treat it as accepted/received.
    needsReceiptCheck = true;
  }
} catch { /* Sending remains usable when storage is unavailable. */ }

function newId() { return globalThis.crypto?.randomUUID?.() || `pv-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function readAnswers() { return Object.fromEntries(new FormData(form)); }
function setValue(name, value) {
  const controls = [...form.elements].filter(control => control.name === name);
  if (!controls.length || typeof value !== 'string') return;
  if (controls[0].type === 'radio') controls.forEach(control => { control.checked = control.value === value; });
  else if ([...controls[0].options || []].some(option => option.value === value)) controls[0].value = value;
}
function saveChoices() {
  const values = readAnswers();
  try { sessionStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(safeFields.map(name => [name, values[name] || ''])))); } catch { /* Navigation still preserves answers in memory. */ }
}
function clearErrors() {
  errorBox.hidden = !needsReceiptCheck;
  document.querySelectorAll('.error').forEach(error => { error.hidden = true; error.textContent = ''; });
  document.querySelectorAll('[aria-invalid]').forEach(control => control.removeAttribute('aria-invalid'));
  document.querySelectorAll('.invalid').forEach(field => field.classList.remove('invalid'));
}
function fieldError(name, message) {
  const controls = [...form.elements].filter(control => control.name === name);
  controls.forEach(control => control.setAttribute('aria-invalid', 'true'));
  controls[0].closest('.field,fieldset').classList.add('invalid');
  const error = document.getElementById(`${name}-error`);
  error.textContent = message;
  error.hidden = false;
  return controls[0];
}
function validate(index) {
  const values = readAnswers();
  let first;
  const fail = (name, message) => { const control = fieldError(name, message); first ||= control; };
  if (index === 0) {
    if (!values.name.trim()) fail('name', 'Please enter your name.');
    if (!values.email.trim() || !form.elements.email.validity.valid) fail('email', 'Please enter a valid email address, like you@example.com.');
    if (values.instagram && !form.elements.instagram.validity.valid) fail('instagram', 'Use your Instagram handle only, like @yourhandle, or leave it blank.');
    if (!values.experience) fail('experience', 'Choose your starting point.');
    if (!values.goal) fail('goal', 'Choose your main goal.');
    if (values.adult !== '18-or-older') fail('adult', 'This application is for adults. Please confirm you are 18 or older.');
  }
  if (index === 1 && !values.days) fail('days', 'Choose a realistic number of days, or “Not sure.”');
  if (index === 2 && !values.budget) fail('budget', 'Choose the answer that feels right for you.');
  if (first) { first.focus(); return false; }
  return true;
}
function renderReview() {
  const values = readAnswers();
  const groups = [
    ['Your start', 0, [['name', 'Name'], ['email', 'Email'], ['instagram', 'Instagram'], ['experience', 'Starting point'], ['goal', 'Main goal'], ['adult', 'Adult confirmation']]],
    ['Your week', 1, [['days', 'Days per week'], ['routine', 'Current routine'], ['equipment', 'Training space'], ['schedule', 'Schedule']]],
    ['Your support', 2, [['barrier', 'Consistency barrier'], ['nutrition', 'General eating-habit support'], ['reason', 'Why coaching now'], ['budget', '$199/month']]],
  ];
  const review = document.querySelector('#review');
  review.replaceChildren();
  groups.forEach(([title, index, fields]) => {
    const block = document.createElement('div'); block.className = 'review-block';
    const header = document.createElement('div'); header.className = 'review-title';
    const heading = document.createElement('h3'); heading.textContent = title;
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'text-button'; edit.textContent = 'Edit'; edit.setAttribute('aria-label', `Edit ${title.toLowerCase()}`); edit.addEventListener('click', () => goTo(index));
    header.append(heading, edit); block.append(header);
    const list = document.createElement('dl');
    fields.forEach(([name, label]) => {
      const term = document.createElement('dt'); term.textContent = label;
      const detail = document.createElement('dd'); detail.textContent = values[name]?.trim() || 'Not added';
      list.append(term, detail);
    });
    block.append(list); review.append(block);
  });
}
function showStep(index, focus = true) {
  step = index;
  steps.forEach((panel, number) => { panel.hidden = number !== step; });
  document.querySelector('#step-count').textContent = `Step ${step + 1} of 4`;
  document.querySelector('#step-label').textContent = stepLabels[step];
  document.querySelector('#progress').setAttribute('aria-valuenow', String(step + 1));
  document.querySelector('#progress').setAttribute('aria-valuetext', `Step ${step + 1} of 4: ${stepLabels[step]}`);
  document.querySelector('#progress-fill').style.width = `${(step + 1) * 25}%`;
  document.querySelectorAll('.step-names span').forEach((label, number) => label.classList.toggle('active', number === step));
  back.hidden = step === 0; next.hidden = step === 3; submit.hidden = step !== 3;
  if (step === 3) renderReview();
  if (focus) document.getElementById(`heading-${step}`).focus();
}
function goTo(index, push = true) {
  if (busy || finished) return;
  clearErrors(); saveChoices();
  if (push) history.pushState({ pvStep: index }, '', `#step-${index + 1}`);
  showStep(index);
}
function setBusy(value) {
  busy = value;
  form.setAttribute('aria-busy', String(value));
  [next, back, submit, document.querySelector('#clear')].forEach(button => { button.disabled = value; });
  submit.disabled = value || needsReceiptCheck;
  document.querySelectorAll('#review button').forEach(button => { button.disabled = value; });
  submit.replaceChildren();
  if (value) { const spinner = document.createElement('span'); spinner.className = 'spinner'; spinner.setAttribute('aria-hidden', 'true'); submit.append(spinner, document.createTextNode(config.submissionMode === 'preview' ? 'Checking preview…' : 'Sending…')); }
  else submit.textContent = needsReceiptCheck ? 'Contact Ryan before resubmitting' : config.submissionMode === 'preview' ? 'Preview application →' : 'Send application →';
}
async function deliver(payload) {
  if (config.submissionMode === 'preview') {
    await new Promise(resolve => setTimeout(resolve, 700));
    // Local-only QA scenario. This never enables submission, approval or payment.
    if (['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).get('preview-error') === '1') throw new Error('preview');
    return { preview: true };
  }
  if (config.submissionMode !== 'netlify') throw new Error('disabled');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(config.postTarget, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(payload).toString(), signal: controller.signal });
    if (!response.ok) throw new Error(`http-${response.status}`);
    return { preview: false };
  } finally { clearTimeout(timeout); }
}
next.addEventListener('click', () => { clearErrors(); if (validate(step)) goTo(step + 1); });
back.addEventListener('click', () => goTo(step - 1));
form.addEventListener('input', saveChoices);
form.addEventListener('change', saveChoices);
form.addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target.tagName === 'INPUT' && event.target.type !== 'radio' && step < 3) { event.preventDefault(); next.click(); }
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || finished || needsReceiptCheck) return;
  clearErrors();
  for (let index = 0; index < 3; index++) {
    if (!validate(index)) { showStep(index, false); steps[index].querySelector('[aria-invalid="true"]').focus(); return; }
  }
  // Never treat a honeypot rejection as a successful application.
  if (form.elements['bot-field'].value) {
    errorBox.hidden = false; document.querySelector('#form-error-text').textContent = 'This application could not be sent. Please contact Ryan for help.'; return;
  }
  form.elements['application-id'].value = applicationId;
  const answers = readAnswers();
  const payload = Object.fromEntries(publicFields.map(name => [name, answers[name] || '']));
  payload['form-name'] = config.formName;
  payload.name = payload.name.trim(); payload.email = payload.email.trim();
  if (config.submissionMode === 'netlify') {
    try { sessionStorage.setItem(referenceKey, applicationId); } catch {}
  }
  setBusy(true);
  try {
    const result = await deliver(payload);
    finished = true;
    try { sessionStorage.removeItem(storageKey); sessionStorage.removeItem(referenceKey); } catch {}
    document.querySelector('#wizard').hidden = true;
    document.querySelector('#success').hidden = false;
    if (!result.preview) {
      document.querySelector('#success-eyebrow').textContent = 'Application received';
      document.querySelector('#success-copy').textContent = 'Thanks for applying. Ryan will personally review your application and follow up at the email you provided. If you are a fit, he offers times for a 30-minute Zoom consultation, confirms your chosen time and sends a Zoom invitation before agreement and payment. You have not been enrolled or charged.';
    }
    form.reset();
    document.querySelector('#success-title').focus();
  } catch (error) {
    errorBox.hidden = false;
    if (config.submissionMode === 'netlify') needsReceiptCheck = true;
    document.querySelector('#form-error-text').textContent = config.submissionMode === 'preview' ? 'Preview error: nothing was sent. Your answers are still here. Try again or contact Ryan.' : `We could not confirm your application was received. Your answers are still here. Contact ryangrandafit@gmail.com before resubmitting and quote reference ${applicationId}. No automatic retry will be sent.`;
    errorBox.scrollIntoView({ block: 'center', behavior: 'smooth' });
  } finally { setBusy(false); }
});
function reset() {
  if (busy) return;
  form.reset(); applicationId = newId(); finished = false; needsReceiptCheck = false;
  form.elements['application-id'].value = applicationId;
  try { sessionStorage.removeItem(storageKey); sessionStorage.removeItem(referenceKey); } catch {}
  document.querySelector('#wizard').hidden = false; document.querySelector('#success').hidden = true;
  goTo(0);
  setBusy(false);
}
document.querySelector('#clear').addEventListener('click', reset);
document.querySelector('#start-over').addEventListener('click', reset);
window.addEventListener('popstate', event => {
  if (finished) return;
  const index = Number.isInteger(event.state?.pvStep) ? event.state.pvStep : 0;
  if (!busy) { clearErrors(); showStep(Math.min(3, Math.max(0, index))); }
});
try {
  sessionStorage.removeItem('pv-application-choices-v1');
  const saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
  safeFields.forEach(name => setValue(name, saved[name]));
} catch { /* Invalid or unavailable storage is harmless. */ }
// Always begin a reload at contact details. A URL never confers approval or progress.
history.replaceState({ pvStep: 0 }, '', `${location.pathname}${location.search}#step-1`);
if (config.submissionMode === 'netlify') {
  const previewNote = document.querySelector('#preview-note');
  if (previewNote) previewNote.hidden = true;
  document.querySelector('#preview-submit-note').textContent = 'Ryan uses your answers to review fit and follow up. This does not subscribe you to marketing.';
  submit.textContent = 'Send application →';
}
document.querySelector('#application-card').hidden = false;
form.elements['application-id'].value = applicationId;
if (needsReceiptCheck) {
  errorBox.hidden = false;
  document.querySelector('#form-error-text').textContent = `An earlier application receipt could not be confirmed. Contact ryangrandafit@gmail.com before resubmitting and quote reference ${applicationId}. Clearing unsent answers only clears this local draft; it does not delete a submitted application.`;
  setBusy(false);
}
showStep(0, false);
