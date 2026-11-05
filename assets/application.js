import { applicationConfig as config } from './application-config.js';

// One-page application. Only bounded noncontact choices are saved in this tab.
const form = document.querySelector('#application');
const submit = document.querySelector('#submit');
const submitLabel = document.querySelector('#submit-label');
const clear = document.querySelector('#clear');
const errorBox = document.querySelector('#form-error');
const errorText = document.querySelector('#form-error-text');
const fields = [...form.elements].filter(control => control.name && control.type !== 'hidden');
const choiceFields = ['goal', 'barrier', 'experience', 'days', 'readiness'];
const publicFields = ['form-name', 'application-id', 'application-version', 'subject', 'bot-field', 'name', 'email', 'instagram', 'adult', ...choiceFields];
const storageKey = 'pv-application-choices-v3';
// Keep the previous sending-reference key so an uncertain older send stays protected.
const referenceKey = 'pv-application-reference-v2';
let applicationId = newId();
let busy = false;
let finished = false;
let needsReceiptCheck = false;

function newId() {
  return globalThis.crypto?.randomUUID?.() || `pv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function answers() { return Object.fromEntries(new FormData(form)); }
function receiptMessage() {
  return `We could not confirm your application was received. Contact ryangrandafit@gmail.com before resubmitting and quote reference ${applicationId}. No automatic retry will be sent. Clearing this draft does not delete a submitted application or resolve its receipt.`;
}
function showError(message) {
  errorText.textContent = message;
  errorBox.hidden = false;
}
function clearErrors() {
  errorBox.hidden = !needsReceiptCheck;
  document.querySelectorAll('.error').forEach(error => { error.hidden = true; error.textContent = ''; });
  fields.forEach(control => { control.removeAttribute('aria-invalid'); control.closest('.field')?.classList.remove('invalid'); });
}
function fieldError(name, message) {
  const control = form.elements[name];
  control.setAttribute('aria-invalid', 'true');
  control.closest('.field')?.classList.add('invalid');
  const error = document.querySelector(`#${name}-error`);
  error.textContent = message;
  error.hidden = false;
  return control;
}
function validate() {
  const values = answers();
  let first;
  const fail = (name, message) => { const control = fieldError(name, message); first ||= control; };
  if (!values.name?.trim() || values.name.trim().length > 100) fail('name', 'Please enter your name.');
  if (!values.email?.trim() || !form.elements.email.validity.valid) fail('email', 'Please enter a valid email address, like you@example.com.');
  if (values.instagram && !form.elements.instagram.validity.valid) fail('instagram', 'Use your Instagram handle only, like @yourhandle, or leave it blank.');
  if (values.adult !== '18-or-older') fail('adult', 'This application is for adults. Please confirm you are 18 or older.');
  for (const [name, message] of [
    ['goal', 'Choose your main goal.'],
    ['barrier', 'Choose your main obstacle, or talk it through with Ryan.'],
    ['readiness', 'Choose your timing, or discuss it on the call.'],
  ]) if (!values[name]) fail(name, message);
  // Reject injected select values, including optional answers, before transport.
  for (const name of choiceFields) {
    const value = values[name];
    if (value && ![...form.elements[name].options].some(option => option.value === value)) fail(name, 'Please choose one of the listed answers.');
  }
  if (first) {
    showError('Please check the highlighted answer before sending.');
    first.focus();
    return false;
  }
  return true;
}
function saveChoices() {
  if (busy || finished) return;
  const values = answers();
  try { sessionStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(choiceFields.map(name => [name, values[name] || ''])))); } catch { /* The application works without storage. */ }
}
function setBusy(value) {
  busy = value;
  form.setAttribute('aria-busy', String(value));
  fields.forEach(control => { control.disabled = value; });
  clear.disabled = value;
  submit.disabled = value || needsReceiptCheck || finished;
  submitLabel.textContent = value ? (config.submissionMode === 'preview' ? 'Checking preview…' : 'Sending…') : needsReceiptCheck ? 'Contact Ryan before resubmitting' : config.submissionMode === 'preview' ? 'Preview application' : 'Send application';
}
async function deliver(payload) {
  if (config.submissionMode === 'preview') return { preview: true };
  if (config.submissionMode !== 'netlify') throw new Error('disabled');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(config.postTarget, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(payload).toString(),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`http-${response.status}`);
    return { preview: false };
  } finally { clearTimeout(timeout); }
}

form.addEventListener('input', saveChoices);
form.addEventListener('change', saveChoices);
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || finished || needsReceiptCheck) return;
  clearErrors();
  if (!validate()) return;
  if (form.elements['bot-field'].value) {
    showError('This application could not be sent. Please contact Ryan for help.');
    return;
  }
  form.elements['application-id'].value = applicationId;
  const values = answers();
  const payload = Object.fromEntries(publicFields.map(name => [name, values[name] || '']));
  payload['form-name'] = config.formName;
  payload.name = payload.name.trim();
  payload.email = payload.email.trim();
  payload.instagram = payload.instagram.trim();
  if (config.submissionMode === 'netlify') {
    try { sessionStorage.setItem(referenceKey, applicationId); } catch { /* In-memory guards still prevent repeat sends. */ }
  }
  setBusy(true);
  try {
    const result = await deliver(payload);
    finished = true;
    try { sessionStorage.removeItem(storageKey); sessionStorage.removeItem(referenceKey); } catch { /* No storage is required. */ }
    form.reset();
    form.hidden = true;
    document.querySelector('#draft-help').hidden = true;
    document.querySelector('#application-privacy-before').hidden = true;
    const success = document.querySelector('#success');
    success.hidden = false;
    if (result.preview) {
      document.querySelector('#success-eyebrow').textContent = 'Preview complete';
      document.querySelector('#success-title').textContent = 'Nothing has been sent.';
      document.querySelector('#success-copy').textContent = 'This is a test preview. Ryan has not received an application. The public application sends your answers for his personal review; it does not enroll or charge you.';
    }
    document.querySelector('#success-title').focus();
  } catch {
    if (config.submissionMode === 'netlify') needsReceiptCheck = true;
    showError(needsReceiptCheck ? receiptMessage() : 'This preview could not complete. Nothing was sent. Your answers are still here.');
    errorBox.scrollIntoView({ block: 'center' });
  } finally { setBusy(false); }
});

clear.addEventListener('click', () => {
  if (busy || finished) return;
  form.reset();
  try {
    sessionStorage.removeItem(storageKey);
    if (!needsReceiptCheck) sessionStorage.removeItem(referenceKey);
  } catch { /* The in-memory draft is still cleared. */ }
  if (!needsReceiptCheck) applicationId = newId();
  form.elements['application-id'].value = applicationId;
  clearErrors();
  if (needsReceiptCheck) showError(receiptMessage());
  setBusy(false);
  form.elements.name.focus();
});

try {
  const savedReference = sessionStorage.getItem(referenceKey);
  if (/^(?:[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}|pv-\d+-[a-z0-9]+)$/i.test(savedReference || '')) {
    applicationId = savedReference;
    needsReceiptCheck = true;
  }
  sessionStorage.removeItem('pv-application-choices-v1');
  sessionStorage.removeItem('pv-application-choices-v2');
  const savedChoices = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
  for (const name of choiceFields) {
    const value = savedChoices[name];
    if (typeof value === 'string' && [...form.elements[name].options].some(option => option.value === value)) form.elements[name].value = value;
  }
} catch { /* Invalid or unavailable storage is harmless. */ }
form.querySelectorAll('fieldset').forEach(fieldset => { fieldset.disabled = false; });
form.elements['application-id'].value = applicationId;
if (config.submissionMode === 'preview') document.querySelector('#preview-note').hidden = false;
if (needsReceiptCheck) showError(receiptMessage());
setBusy(false);
