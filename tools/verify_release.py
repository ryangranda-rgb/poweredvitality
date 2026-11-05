"""Verify the release artifact's public routes, assets and application boundaries."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit,unquote
import hashlib,re,subprocess
ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/'dist'
class Page(HTMLParser):
 def __init__(self,source):
  super().__init__();self.nodes=[];self.ids=[];self.feed(source)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs);self.nodes.append((tag,a))
  if a.get('id'):self.ids.append(a['id'])
checks=0
def verify(ok,message):
 global checks
 checks+=1
 if not ok:raise AssertionError(message)
pages={p.name:Page(p.read_text()) for p in DIST.glob('*.html')}
for name,page in pages.items():
 source=(DIST/name).read_text()
 verify(len(page.ids)==len(set(page.ids)),name+': duplicate ids')
 verify(sum(t=='h1' for t,a in page.nodes)==1,name+': one h1')
 verify(not any(x in source for x in ['review-safety.js','data-instagram-preview','id="instagram-preview"']),name+': no private preview controls')
 verify('$' not in source,name+': no preconsultation price amounts')
 for tag,a in page.nodes:
  if tag in ['input','select','textarea'] and a.get('type')!='hidden' and a.get('name')!='bot-field':
   verify(any(t=='label' and b.get('for')==a.get('id') for t,b in page.nodes),name+': labelled '+a.get('name','field'))
  urls=[a[k] for k in ['src','href'] if a.get(k)]
  for url in urls:
   ref=urlsplit(url)
   if ref.scheme or ref.netloc or url.startswith('data:'):continue
   path=unquote(ref.path)
   dest=(DIST/(path.lstrip('/') if path else name))
   if path=='/':dest=DIST/'index.html'
   if not dest.suffix:dest=dest.with_suffix('.html')
   verify(dest.is_file(),name+': missing '+url)
   if ref.fragment and dest.name in pages:verify(ref.fragment in pages[dest.name].ids,name+': missing anchor '+url)
 verify('buy.stripe.com' not in source and 'calendly.com/' not in re.sub(r'https://calendly.com/legal/privacy-notice','',source),name+': no public payment or booking link')
app=(DIST/'apply.html').read_text();config=(DIST/'assets/application-config.js').read_text()
verify('name="coaching-application"' in app and 'name="form-name" value="coaching-application"' in app,'Netlify form identity')
verify('name="budget"' not in app and 'confirm-email' not in app,'Removed fields')
for field in ['name','email','instagram','adult','goal','barrier','experience','days','readiness','bot-field','application-id','application-version','subject']:
 verify('name="'+field+'"' in app,'Registered field '+field)
for asset in ['hero-crunch-removed-precise.png','ryan-training-monochrome.jpeg']:
 actual=(DIST/'assets/photography'/asset).read_bytes();expected=(ROOT.parent/'granda-strength-preview/dist/assets/photography'/asset)
 # Reproducible CI does not require the owner's private checkout.
 if expected.exists():verify(hashlib.sha256(actual).digest()==hashlib.sha256(expected.read_bytes()).digest(),'Approved photography '+asset)
verify(not (DIST/'docs').exists() and not (DIST/'tools').exists() and not (DIST/'.git').exists(),'Bounded publish output')
if "submissionMode: 'netlify'" in config:
 verify('data-netlify="true"' in app and 'netlify-honeypot="bot-field"' in app,'Production registration')
 verify('Test preview' not in (DIST/'index.html').read_text(),'No production preview notice')
else:
 verify('data-netlify="true"' not in app and 'netlify-honeypot="bot-field"' not in app,'Preview cannot register live form')
 verify('Test preview' in (DIST/'index.html').read_text(),'Preview label')
# All operative guarantee wording stays identical except its old numeric example.
for name in ['terms-and-conditions.html','refund-policy.html']:
 previous=subprocess.check_output(['git','show','93c60338c54de9b2c318312d5e5b8dd0133c084d:'+name],cwd=ROOT,text=True)
 old=re.search(r'<p>30-day guarantee:.*?</p>',previous).group(0).replace(' ($190 on the $570 plan)','')
 verify(old in (DIST/name).read_text(),'Preserved operative guarantee '+name)
print(f'PASS: {checks} release assertions across {len(pages)} pages.')
