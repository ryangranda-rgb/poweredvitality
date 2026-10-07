import { applicationConfig as config } from './application-config.js';

if (config.submissionMode === 'netlify') {
  document.querySelectorAll('[data-preview-only]').forEach(element => { element.hidden = true; });
  const journeyNote = document.querySelector('#journey-note');
  if (journeyNote) journeyNote.textContent = 'This page explains the starting steps. It does not confirm an application, acceptance, consultation, signature or payment.';
  const nextStep = document.querySelector('#journey-next-copy');
  if (nextStep) nextStep.textContent = 'Complete the application. Ryan reviews your fit personally and, if appropriate, offers times for a 30-minute Zoom consultation before agreement and payment.';
  const status = document.querySelector('.state-pill');
  if (status) status.textContent = '6 steps · guided by Ryan';
  const applicationLink = document.querySelector('#journey-application-link');
  if (applicationLink) applicationLink.textContent = 'Open the application';
  const applicationStatus = document.querySelector('#journey-application-status');
  if (applicationStatus) applicationStatus.textContent = 'Personal review follows submission';
  const consultationGate = document.querySelector('#consultation-gate');
  if (consultationGate) consultationGate.textContent = 'This page does not schedule a call or send an invitation. Wait for Ryan’s confirmation; opening an invitation does not confirm that you attended.';
}
