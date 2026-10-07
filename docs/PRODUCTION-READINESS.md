# Earlier review findings — resolved for the application-only launch

The operational privacy/policy mismatches below were identified before application launch. The parent subsequently approved a factual application-specific notice, narrow website/application terms and gated paid/private stages. Exact legacy policy files are archived outside publish output. Read `ACTIVATION.md` for the current bounded scope and pending real-record/owner-notification verification. No paid agreement, private intake or legal-compliance claim is activated.

# Production boundary report for parent review

Ryan has authorized publication of responsibly verified components. This report is the required internal scope handoff before any production change; it does not request another user approval. Production/main remain at `201582946d3644fcd82fe9032a7880187b94c232`, published deploy `6ac53f154aba9f0008fd47e8`, which is the rollback point.

## Implemented and tested

The existing site's visual identity, application-first homepage, approved $199 continuous-enrollment/cancellation wording, accessible mobile application UI, manual fit review and 30-minute Zoom consultation handoff are implemented. Ryan offers times from his own schedule by email, confirms the applicant's chosen date/time/time zone and sends the Zoom invitation. No automatic calendar integration remains. Capacity review stays at 3 active clients.

The application is still an explicitly labelled preview, with no real receipt. The journey has 0 of 6 confirmed stages. Agreement, recurring consent, payment and private intake remain unavailable. Do not merge this preview wholesale and describe it as a live application.

## Exact privacy mismatches blocking application receipt

The current `privacy-policy.html` is dated May 29, 2026 and does not describe Netlify application storage. These are operational inconsistencies in the repository; no claim of legal compliance is made here.

1. Section 1.1 describes enrollment/intake data, including diagnoses, surgeries, medications and photos. Add a distinct public-application paragraph listing the actual fields: name, email, optional Instagram, training experience, goal, realistic training days, optional routine/equipment/scheduling limitations, consistency barrier, general eating habits, reason for coaching and comfort with the disclosed monthly offer. Include hidden form version and application ID used for administration/deduplication. State that medical/injury details and photos are not requested here.
2. Section 1.3 lists Skool, Kit, Jotform, Make.com and DocuSign as used providers without verification. The proposed receipt uses Netlify Forms and Ryan's existing email; manual consultation uses his existing Zoom account. Add Netlify hosting/form storage and the actually used email/meeting providers, and remove or clearly qualify unconfirmed providers. Stripe belongs to the later, separately gated enrollment process.
3. Sections 3 and 7 assert HIPAA-compliant Jotform processing. That setup has not been verified and is not part of this activation. Remove those unsupported assertions and explain that any future private health/readiness intake requires its own approved process and disclosure before collection.
4. Section 2 combines communication with marketing/SMS. State that application processing and fit/consultation replies are transactional; application submission does not enroll the applicant in marketing or SMS. No marketing consent is bundled into this form. Customer email/reminder automation is not authorized by this production task.
5. Section 5 promises a cookie-consent banner, analytics cookies and marketing cookies. No such banner or analytics/marketing integration exists in the site's source. Describe the actual hosting/browser-session behavior and Google Fonts requests after the reviewer checks production; do not promise nonexistent controls. Netlify's preview tooling is distinct from business tracking and must not be assumed to exist in production.
6. Section 6 gives subscriber/health/communication retention periods but no applicant retention rule or verified deletion workflow. Ryan/reviewer must specify and implement the applicant retention period and deletion handling before live receipt; no duration has been invented in this branch.
7. Section 4.1 asserts contractual duties for every named provider. Verify applicable provider terms rather than retaining an unsupported blanket assurance. Check any California-specific rights/applicability language through the native reviewer; this code change does not make that legal determination.

### Proposed short notice at the application submit step

Use only after the underlying provider/access/retention facts and policy changes above are approved:

> Powered Vitality uses your application answers to review coaching fit and contact you about your application and, if appropriate, a 30-minute Zoom consultation. Ryan reviews applications personally. Applications are stored through Netlify Forms and accessible through the authorized owner's account. Please do not include diagnoses, injury details, photos or other sensitive health information. Applying does not enroll you, authorize payment, sign an agreement or subscribe you to marketing. Read the Privacy Policy for storage, retention and your options, or contact ryangrandafit@gmail.com.

Add an actual Privacy Policy link beside this notice. Owner-only access must be verified before publishing that sentence; a private dashboard alone does not prove that no other team member can view records.

## Integration checks before real receipt

- Confirm Free billing and included-credit usage. Keep the existing site/account; no new paid subscription or credential.
- Inspect authorized Netlify membership/access and confirm owner-only form administration. Do not expose submissions through public APIs, HTML, shared spreadsheets or secret URLs.
- Approve the factual privacy edits, actual retention/deletion process and application notice. Keep original legal documents available for reviewer reconciliation; payment/agreement/private intake stay disabled.
- Enable form processing only after those checks, deploy the real static form in an approved synthetic test context and confirm detection/fields. Current hosted preview builds deliberately strip registration and reject live submission mode.
- Verify synthetic receipt in Netlify, HTTP/network errors, honeypot handling, retry/deduplication and actual owner access. Decide whether Ryan wants an owner-only notification; do not send customer emails or reminders.
- Update preview wording to real receipt wording only when a real receipt has been verified. HTTP success alone is not evidence of a signature, acceptance, consultation, enrollment or payment.
- Parent reconciles the native review and this scope report before production publication. Preserve the rollback SHA/deploy above and verify the exact tested production artifact.

## Separate later integration work

Ryan continues to choose consultation times, decide coaching fit and review capacity at 3. Approved paperwork can later use existing tools for template assembly and admin drafts once counsel approves it; no legal judgment or signature completion is automated. Payment remains gated by the attended consultation, Ryan's confirmation, approved agreement/recurring consent and agreed plan-start date, with actual Stripe confirmation. Private intake/client access and plan/check-in delivery require the approved private process. No new service, credential, client store, active signature flow or payment webhook was created.
