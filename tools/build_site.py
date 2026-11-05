"""Build the approved static site; only production can capture applications."""
from pathlib import Path
import os
import re
import shutil

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'dist'
PAGES = ['index.html', 'apply.html', 'what-you-get.html', 'start.html',
         'application-confirmation.html', 'onboard.html', 'application-privacy.html',
         'privacy-policy.html', 'terms-and-conditions.html', 'terms.html', 'refund-policy.html', 'disclaimer.html']

def build():
    config = (ROOT / 'assets/application-config.js').read_text()
    mode = re.search(r"submissionMode:\s*['\"]([^'\"]+)", config)
    if not mode:
        raise RuntimeError('Application submission mode must be explicit.')
    context = os.environ.get('CONTEXT', '')
    requested = os.environ.get('PV_APPLICATION_MODE', mode.group(1))
    if requested not in ('preview', 'netlify'):
        raise RuntimeError('Unknown application submission mode.')
    selected = 'preview' if context in ('deploy-preview', 'branch-deploy') else requested
    if selected == 'netlify' and context != 'production':
        raise RuntimeError('Live capture requires an explicit production context.')
    if DEST.exists():
        shutil.rmtree(DEST)
    DEST.mkdir()
    for page in PAGES:
        source_page = 'onboard-unavailable.html' if page == 'onboard.html' else page
        source = (ROOT / source_page).read_text()
        if selected == 'preview':
            source = source.replace('data-netlify="true"', 'data-preview-form="true"')
            source = source.replace('netlify-honeypot="bot-field"', 'data-preview-honeypot="bot-field"')
            if 'id="preview-note"' not in source:
                source = source.replace('<body>', '<body><div class="private-notice">Test preview · Applications are simulated; nothing is sent.</div>', 1)
        (DEST / page).write_text(source)
    shutil.copytree(ROOT / 'assets', DEST / 'assets')
    for filename in ['robots.txt', 'sitemap.xml']:
        shutil.copy2(ROOT / filename, DEST / filename)
    public_config = re.sub(r"submissionMode:\s*['\"][^'\"]+['\"]", f"submissionMode: '{selected}'", config, count=1)
    (DEST / 'assets/application-config.js').write_text(public_config)
    print(f'Built {selected} application artifact in dist. No deployment performed.')

if __name__ == '__main__':
    build()
