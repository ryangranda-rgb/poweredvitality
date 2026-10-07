# Application-only launch

Ryan authorized this bounded production scope; the parent approved the factual notice and narrowed public policies. User confirmed there are no current paying clients. Exact previous privacy/terms/refund/disclaimer files are retained under `docs/archive/public-policies-before-application-launch/` and excluded from publishing.

The live application captures adults' contact information and bounded nonmedical choices. It requests no faith preference, health detail, file, photo or open-ended health text. Price transparency remains. Netlify stores applications in Ryan's authenticated account; Google/Gmail handles owner notification and Ryan's manual application correspondence. The notice identifies Powered Vitality LLC, Union City, California, and the owner email, without publishing a home street address.

Production activation is `PV_APPLICATION_MODE=netlify` in `context.production.environment`; preview and branch builds always force simulation and strip form registration. Production publishes only the allowlisted pages and assets. `/onboard` is a form-free unavailable page. Agreement, signatures, recurring consent, payment and private health intake remain unavailable. Application navigation never confirms fit, consultation attendance, signing or payment. Capacity review stays at 3 active clients.

## Platform checks

- Parent enabled Netlify Forms and confirmed readback.
- Focused UI helper confirmed exactly 1 owner alert after reload: email `ryangrandafit@gmail.com` on new submissions from any form. No other recipient is authorized.
- Existing team is Free with 1 member and Owner role. No plan change, paid service or credential is introduced. Free credit plans have a hard limit/no auto recharge; Forms submissions are free, and production deployment/traffic consume included credits.
- Real receipt and owner notification still require the single authorized synthetic test after the tested production artifact registers `coaching-application`. Label the applicant `TEST ONLY — not a real prospect`, confirm adulthood, use only the authorized owner email, retain the application ID/timestamp/deploy evidence and private record, and exclude it from all lead/client counts. Do not repeat or permanently delete the record.

## Verification and rollback

Local browser QA covers the 4-step mobile flow plus the production artifact, system fonts/no off-origin requests, DNT behavior, factual notices, unavailable enrollment/onboarding, mocked HTTP success/error, uncertain network outcomes and stable sending references with no automatic re-POST. Those tests do not prove a real Netlify receipt.

After release, verify actual production HTML/network behavior (including no preview toolbar/analytics), registered schema, private synthetic record and owner Gmail delivery before describing the shareable link as ready.

Original rollback point: main commit `201582946d3644fcd82fe9032a7880187b94c232`, published deploy `6ac53f154aba9f0008fd47e8`. No existing agreement is erased; history and exact archived sources remain.

## Separate future work

Ryan reviews every application, chooses consultation times and confirms the Zoom invitation manually. Paid enrollment requires the attended consultation, Ryan's confirmation, finalized agreement/recurring consent and the agreed plan-start date with actual Stripe payment verification. Private readiness intake, client access, religious preferences and personalized plan/check-in delivery require separately approved private handling. No automatic fitness decision, legal approval, customer email, marketing message or acceptance is enabled by this application launch.
