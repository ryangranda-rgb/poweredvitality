"""Create a bounded static publish directory; exclude Git, archives, tests and docs."""
from pathlib import Path
import shutil
import os
import re

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'dist'
PAGES = ['index.html', 'apply.html', 'start.html', 'onboard.html', 'application-privacy.html',
         'privacy-policy.html', 'terms-and-conditions.html', 'refund-policy.html', 'disclaimer.html']

def build():
    config = (ROOT / 'assets/application-config.js').read_text()
    mode = re.search(r"submissionMode:\s*['\"]([^'\"]+)", config)
    if not mode:
        raise RuntimeError('Application submission mode must be explicit.')
    context = os.environ.get('CONTEXT', '')
    requested = os.environ.get('PV_APPLICATION_MODE', mode.group(1))
    if requested not in ('preview', 'netlify'):
        raise RuntimeError('Unknown application submission mode.')
    # A shared source commit must never activate preview/branch submissions.
    # Production activation is an explicit public build setting, not a secret.
    selected = 'preview' if context in ('deploy-preview', 'branch-deploy') else requested
    if selected == 'netlify' and context != 'production':
        raise RuntimeError('Live application capture requires an explicit production build context.')
    preview = selected == 'preview'
    if DEST.exists():
        shutil.rmtree(DEST)
    DEST.mkdir()
    for page in PAGES:
        source_page = 'onboard-unavailable.html' if page == 'onboard.html' and not preview else page
        source = (ROOT / source_page).read_text()
        if preview:
            # Keep the real source definition ready for activation, but ensure a
            # test build cannot register a Netlify form or accept client data.
            source = source.replace('data-netlify="true"', 'data-preview-form="true"')
            source = source.replace('netlify-honeypot="bot-field"', 'data-preview-honeypot="bot-field"')
        else:
            if page == 'index.html':
                source = source.replace('<strong>Test proposal preview.</strong> Applications, signing and payment are not active.', 'Applications are open. Coaching enrollment follows a consultation and completed onboarding.', 1)
            source = source.replace('data-preview-only', 'data-preview-only hidden')
            if page == 'apply.html':
                source = re.sub(r'  <div class="preview-note" id="preview-note">.*?</div></div>\n', '', source)
                source = source.replace('This preview cannot send applications.', 'This form cannot send an application without JavaScript.')
                source = source.replace('When the application is live, Ryan reviews your fit personally', 'Ryan reviews your fit personally')
                source = source.replace('the live application uses Netlify', 'the application uses Netlify')
            if page == 'start.html':
                source = source.replace('<strong>Journey preview.</strong> No application, approval, consultation, signature or payment has been confirmed.', 'This page explains the starting steps. It does not confirm an application, acceptance, consultation, signature or payment.')
                source = source.replace('0 of 6 confirmed', '6 steps · guided by Ryan')
                source = source.replace('Try the application preview. When the live application opens, Ryan will review your fit, then invite you to a 30-minute Zoom consultation before agreement and payment.', 'Complete the application. Ryan reviews your fit personally and, if appropriate, offers times for a 30-minute Zoom consultation before agreement and payment.')
                source = source.replace('Not submitted in this preview', 'Personal review follows submission')
                source = source.replace('Open the application preview', 'Open the application')
                source = source.replace('in this preview', 'on this page').replace('This preview', 'This page')
        (DEST / page).write_text(source)
    shutil.copytree(ROOT / 'assets', DEST / 'assets')
    public_config = re.sub(r"submissionMode:\s*['\"][^'\"]+['\"]", f"submissionMode: '{selected}'", config, count=1)
    (DEST / 'assets/application-config.js').write_text(public_config)
    print(f'Built {selected} application artifact in dist. No deployment performed.')

if __name__ == '__main__':
    build()
