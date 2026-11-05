// Public settings only. Build contexts select live capture or local simulation.
// Branch/preview builds always simulate; payment and enrollment remain separate.
export const applicationConfig = Object.freeze({
  submissionMode: 'preview', // The explicit production build selects 'netlify'.
  formName: 'coaching-application',
  postTarget: '/apply',
  timeoutMs: 15000,
});
