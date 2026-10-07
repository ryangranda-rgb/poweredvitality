# Mobile application and onboarding proposal

Source: https://github.com/ryangranda-rgb/poweredvitality

Baseline: production commit `201582946d3644fcd82fe9032a7880187b94c232`, verified by parent against Netlify site `982e7dd9-f871-44c4-93b7-581ce06549b9` and deploy `6ac53f154aba9f0008fd47e8`.

This isolated local branch preserves the original source (the old alternate landing page is clearly archived under `docs/archive/`) and changes the homepage where necessary for the approved application-first flow. The original checkout URL is removed from the homepage; hiding a link is not authorization. Payment remains unavailable in this prototype. Original full legal pages have not been revised and remain pending attorney review.

## Local preview behavior

- `/apply`: 4 short steps, required basic contact/experience/goal/days/budget questions, optional context, final review/edit, keyboard accessible validation, back/forward navigation, loading/error/preview-success states, and duplicate-click protection. No network requests occur in preview submission.
- Actual static Netlify Forms definition is in `apply.html`: unique `coaching-application` name, hidden form name/version/application ID, honeypot, and all matching field names. `assets/application-config.js` defaults to `submissionMode: 'preview'`.
- `/start`: general onboarding checklist. 0 of 6 client stages are confirmed: Apply → Ryan reviews fit → 30-minute Zoom consultation → agreement/payment → private onboarding → 1st check-in. Booking, agreement, consent, private intake and payment controls are disabled. This page is informational, not an authenticated portal.
- `/onboard`: real local web form for nonmedical first-week preferences. It never sends, stores or grants access. The workbook stays in Ryan's back office. No Google Form or hosted client portal is represented as existing.
- Safe multiple-choice application answers persist only in `sessionStorage` for the current tab. Name, email, Instagram, written routine/reason/limitations and submission status are never persisted. Reload restarts at contact details. Clear/success removes saved choices. Browser Back/Forward and in-form Back preserve all current answers in memory.
- No client records, real data, public response lists, health details, uploads, analytics, new credentials or recurring-payment consent are collected.
- Local error-state QA: `/apply?preview-error=1` (only honored on `localhost` / `127.0.0.1`). It does not enable submission or alter approval/payment.

## Remaining steps, in order

1. Ryan and California counsel approve the application privacy notice, final client agreement, intake/privacy/retention process, subscription disclosures, recurring-payment consent and cancellation experience. Remove local proposal banners only after approved live activation. Existing full legal pages must be reconciled before launch.
2. Confirm current Netlify credit allowance/usage and no-cost activation. Parent research says Forms unlimited/free and previews zero credits; the team is Free, but current balance was not exposed. Do not change plans or enable paid features.
3. Review this branch/patch and the proposed `netlify.toml` publish-directory change. Run `python3 tools/build_site.py` to create the allowlisted `dist` artifact. Authorize a push and protected preview explicitly before executing either. A production merge/push can trigger Netlify Git deployment; no such action has been performed.
4. Enable Netlify form detection for the existing site (if not already enabled), deploy the reviewed static form to the approved preview and confirm its registered fields. Configure Ryan's notification/reply-to workflow with his authorization. Do not submit real client data in QA.
5. After privacy and form handling are approved, change `submissionMode` to `netlify`, verify the form's POST target on the actual Netlify deploy, and test receipt, non-2xx/network timeout, spam/honeypot, error recovery and notification delivery with approved synthetic data. The existing transport URL-encodes every field and only shows receipt after an HTTP success; it never falls back from a failed live submission to simulated success.
6. Netlify Forms has no guaranteed idempotency key support. Current duplicate-click protection blocks concurrent submits and successful-session resubmission. The stable `application-id` supports manual deduplication when retrying an uncertain network result. For guaranteed server deduplication, add an approved server-side receipt/idempotency mechanism. Do not call this complete until receipt behavior is verified.
7. Ryan manually reviews every application and communicates fit. Netlify's submission dashboard is private and must remain private. No automatic acceptance. If fit is confirmed, Ryan invites the applicant to book and attend a 30-minute Zoom consultation before agreement/payment. Verify calendar conflicts and native availability first. Store only the approved final booking URL in `assets/consultation-config.js` (`confirmedBookingUrl`); it is currently `null`. The candidate event is inactive and is not linked or embedded. Public preview navigation never grants booking eligibility. The public checklist keeps booking disabled even when a URL is configured; it only indicates that Ryan can send an approved invitation. Activating a functional booking control requires a separately approved reviewed-applicant invitation/access flow. Agree on the plan-start date after the consultation before enrollment instructions.
8. Implement separately approved authenticated client access or a verified manual invitation process for agreement/private intake. No URL, browser state, hidden button or query parameter may serve as authorization. The preview intentionally has no activation switch for signatures, intake or payment.
9. After the attended consultation and Ryan's confirmation, complete final agreement and separate recurring consent, then send the verified Stripe checkout on the agreed plan-start date. Checkout starts billing immediately. Confirm payment in Stripe or through verified server-side webhook processing; opening/returning from a link never completes payment or agreement. The known checkout is `https://buy.stripe.com/28E3cv1pn4nSfLp2wF5os00`; it is documented here, not wired as a public enrollment control.
10. After confirmed enrollment and the approved private readiness process, activate the mobile nonmedical preferences form through the approved client flow. Ryan reviews it and supplies the personalized first-week plan, check-in schedule and contact expectations. Keep health fields disabled until the private process is approved.
11. Verify cancellation portal and support handling on a real approved test environment: `https://billing.stripe.com/p/login/28E3cv1pn4nSfLp2wF5os00`. Cancellation received before renewal prevents the next charge, with coaching through the paid period and statutory rights preserved.
12. After mobile QA, legal review and explicit production authorization, release through the existing repository/site. Never replace the project or create an unrelated site.

## Existing material requiring reconciliation

- Homepage formerly promised permanent founders grandfathering, a vague three-month founding window and a two-business-day cancellation-processing delay. Proposed homepage now follows the parent-approved terms: $199 while continuously enrolled, new $249 enrollments January 5, 2027, current disclosed rejoin price, no minimum, timely cancellation prevents renewal.
- `terms-and-conditions.html` and `refund-policy.html` retain the old cancellation-processing language, refund/all-sales-final clauses and refund restrictions. Counsel must reconcile them with statutory rights and approved recurring terms.
- `privacy-policy.html` mentions health information and third-party platforms/retention. Confirm actual vendors, processing, application versus private-intake separation, retention/deletion, and the review notice. Do not imply attorney approval.
- Old policies also mention Skool, Kit/ConvertKit, training-history/health information and response/delivery timelines; confirm actual practice before making promises.
- `docs/archive/powered-vitality-landing.html` is historical source, clearly archived and excluded from the proposed `dist` publish directory. The allowlisted static build also excludes tooling, Git, tests and documentation. The active homepage is `index.html`.

## No activity performed

At the original local handoff, no push, PR or deployment had occurred. Ryan subsequently approved a separate Free-plan test version, with production unchanged. Live form activation, new credentials, plan changes, charges, signing and client-data transmission remain unauthorized.

The build enforces preview-only submission mode for Deploy Previews/branch deploys and strips Netlify form-registration attributes from preview output. Source retains the actual form definition for a separately approved activation.
