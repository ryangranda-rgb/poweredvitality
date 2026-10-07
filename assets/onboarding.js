// Local preview only. No network, client storage, approval or enrollment state.
const form = document.querySelector('#preferences');
const requiredFields = ['focus', 'training-days', 'training-space'];
let finished = false;
function updateProgress() {
  const count = requiredFields.filter(name => form.elements[name].value).length;
  document.querySelector('#preferences-count').textContent = `${count} of 3 chosen`;
  document.querySelector('#preferences-progress').setAttribute('aria-valuenow', count);
  document.querySelector('#preferences-fill').style.width = `${count / 3 * 100}%`;
}
form.addEventListener('change', updateProgress);
form.addEventListener('submit', event => {
  event.preventDefault(); if (finished) return;
  let first;
  requiredFields.forEach(name => {
    const control = form.elements[name];
    const invalid = !control.value;
    const error = document.getElementById(`${name}-error`);
    error.hidden = !invalid;
    error.textContent = invalid ? 'Choose an option, or decide together with Ryan.' : '';
    control.closest('.field').classList.toggle('invalid', invalid);
    if (invalid) { control.setAttribute('aria-invalid', 'true'); first ||= control; }
    else control.removeAttribute('aria-invalid');
  });
  if (first) { first.focus(); return; }
  finished = true;
  document.querySelector('#preferences-wizard').hidden = true;
  document.querySelector('#preferences-success').hidden = false;
  form.reset();
  document.querySelector('#preferences-success-heading').focus();
});
document.querySelector('#preferences-card').hidden = false;
