import { consultationConfig as config } from './consultation-config.js';

// This public preview never activates booking or confers applicant approval.
// The configured URL is reserved for the separately approved invitation flow.
const status = document.querySelector('#consultation-status');
const gate = document.querySelector('#consultation-gate');
const booking = document.querySelector('#consultation-booking');
let confirmedUrl;
try {
  const url = config.confirmedBookingUrl ? new URL(config.confirmedBookingUrl) : null;
  if (url?.protocol === 'https:' && url.hostname === 'calendly.com') confirmedUrl = url;
} catch { /* Missing/invalid configuration must leave booking unavailable. */ }
if (confirmedUrl) {
  status.textContent = 'Booking by invitation after Ryan’s review';
  gate.textContent = 'Scheduling has a confirmed link. Ryan must review your fit and send your invitation; this preview cannot book a call. A link visit does not confirm booking or attendance.';
}
booking.disabled = true;
