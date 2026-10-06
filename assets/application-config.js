// Public settings only. This preview never transmits application data.
// Activation requires the checklist in docs/ACTIVATION.md; payment stays separate.
export const applicationConfig = Object.freeze({
  submissionMode: 'preview', // Approved activation may change this to 'netlify'.
  formName: 'coaching-application',
  postTarget: '/apply',
  timeoutMs: 15000,
});
