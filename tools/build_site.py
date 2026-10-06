"""Create a bounded static publish directory; exclude Git, archives, tests and docs."""
from pathlib import Path
import shutil
import os
import re

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'dist'
PAGES = ['index.html', 'apply.html', 'start.html', 'onboard.html',
         'privacy-policy.html', 'terms-and-conditions.html', 'refund-policy.html', 'disclaimer.html']

def build():
    config = (ROOT / 'assets/application-config.js').read_text()
    mode = re.search(r"submissionMode:\s*['\"]([^'\"]+)", config)
    if not mode:
        raise RuntimeError('Application submission mode must be explicit.')
    preview = mode.group(1) == 'preview'
    if os.environ.get('CONTEXT') in ('deploy-preview', 'branch-deploy') and not preview:
        raise RuntimeError('Hosted test versions must keep application submission disabled.')
    if DEST.exists():
        shutil.rmtree(DEST)
    DEST.mkdir()
    for page in PAGES:
        source = (ROOT / page).read_text()
        if preview:
            # Keep the real source definition ready for activation, but ensure a
            # test build cannot register a Netlify form or accept client data.
            source = source.replace('data-netlify="true"', 'data-preview-form="true"')
            source = source.replace('netlify-honeypot="bot-field"', 'data-preview-honeypot="bot-field"')
        (DEST / page).write_text(source)
    shutil.copytree(ROOT / 'assets', DEST / 'assets')
    print('Built preview-only static site in dist. No deployment performed.')

if __name__ == '__main__':
    build()
