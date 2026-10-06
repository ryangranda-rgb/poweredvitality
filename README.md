# Powered Vitality mobile flow proposal

An isolated feature branch based on the existing site's verified production source, using static HTML/CSS/JavaScript without a framework or app download.

Open the local preview at `http://127.0.0.1:8765/` while the preview server is running. Routes: `/apply`, `/start`, `/onboard`.

Run from the repository root:

```sh
python3 tools/preview_server.py
```

The server binds only to `127.0.0.1`. The static preview server is used because no Netlify CLI is available locally; it does not emulate Netlify Forms. The application defaults to preview-only and makes no submission request. Nothing is sent, signed, approved or charged.

Build the bounded publish artifact with `python3 tools/build_site.py`; `netlify.toml` proposes publishing `dist`, excluding historical source, docs, tests and tooling. No deployment is performed by the build.

Read [docs/ACTIVATION.md](docs/ACTIVATION.md) before enabling any live behavior. Full legal pages remain pending review.
