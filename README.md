# Granda Strength public website

The approved responsive coaching site uses static HTML, self-hosted Barlow fonts and local photography. Production is https://grandastrength.netlify.app. Netlify builds `main` with `python3 tools/build_site.py` and publishes only `dist/`.

The application defaults to simulation. Deploy-preview and branch-deploy contexts always simulate and strip Netlify registration. Only `CONTEXT=production PV_APPLICATION_MODE=netlify` produces real application capture. Payment, enrollment and private intake remain separate; consultation invitations are sent personally by Ryan.

## Local checks

```sh
python3 tools/build_site.py
python3 tools/verify_release.py
node tests/application-runtime.mjs
```

For a production artifact, run `CONTEXT=production PV_APPLICATION_MODE=netlify python3 tools/build_site.py`. Serve a built artifact with `PV_PREVIEW_ROOT=/absolute/path/to/dist PV_PREVIEW_PORT=8768 python3 tools/preview_server.py`. This server binds loopback and rejects all POSTs. The older mobile-flow and production-build browser scripts document the retired four-step application and are not current acceptance tests.

Read docs/RELEASE-2026-11-04.md for integration details and verification limits. No secrets belong in this repository; .netlify and dist remain ignored.
