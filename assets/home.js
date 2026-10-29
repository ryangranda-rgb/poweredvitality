// The main contact action stays available without covering a visible hero action.
const quickContact = document.querySelector('.mobile-actions');
const heroActions = document.querySelector('.hero .actions');
if (quickContact && heroActions && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(([entry]) => {
    const redundant = entry.isIntersecting;
    quickContact.classList.toggle('is-redundant', redundant);
    quickContact.setAttribute('aria-hidden', String(redundant));
    quickContact.inert = redundant;
  }, { threshold: 0.25 });
  observer.observe(heroActions);
}

// Without JavaScript all sample panels remain readable; enhance to one panel at a time.
const coachingDemo = document.querySelector('.coaching-demo');
if (coachingDemo) {
  const tabs = [...coachingDemo.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  if (tabs.length && panels.every(Boolean)) {
    const showPanel = (index, moveFocus = false) => {
      tabs.forEach((tab, i) => {
        const selected = i === index;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panels[i].hidden = !selected;
        panels[i].setAttribute('role', 'tabpanel');
        panels[i].setAttribute('aria-labelledby', tab.id);
        panels[i].tabIndex = 0;
      });
      if (moveFocus) tabs[index].focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => showPanel(i));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        showPanel(next, true);
      });
    });
    showPanel(0);
    coachingDemo.querySelector('.demo-tabs').hidden = false;
  }
}

// Visual polish only. Content stays visible when JS or motion is unavailable.
const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const siteHeader = document.querySelector('.site-header');
if (siteHeader && motionOK) {
  let condensed = window.scrollY > 56;
  const syncHeader = () => {
    const next = condensed ? window.scrollY > 12 : window.scrollY > 56;
    if (next === condensed) return;
    condensed = next;
    siteHeader.classList.toggle('is-condensed', next);
  };
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });
}

if (motionOK && 'IntersectionObserver' in window) {
  const revealSelector = [
    '.identity-strip',
    '.section-heading',
    '.inclusions-grid article',
    '.coaching-demo',
    '.stories-heading',
    '.progress-card',
    '.testimonial-card',
    '.coaching-gallery',
    '.stories-footer',
    '.coach-portrait',
    '.about-copy',
    '.pricing-grid > div',
    '.contact-card',
    '.faq-grid > div'
  ].join(',');
  const pending = [];
  const viewLimit = window.innerHeight * 0.94;
  document.querySelectorAll(revealSelector).forEach(node => {
    if (node.getBoundingClientRect().top < viewLimit) return;
    node.classList.add('reveal');
    pending.push(node);
  });
  if (pending.length) {
    const show = node => node.classList.add('is-in');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    pending.forEach(node => observer.observe(node));
    // A fast fling can jump an element past the viewport between frames.
    const catchSkipped = () => {
      pending.forEach(node => {
        if (!node.classList.contains('is-in') && node.getBoundingClientRect().bottom < 0) show(node);
      });
    };
    window.addEventListener('scroll', catchSkipped, { passive: true });
    document.addEventListener('focusin', event => {
      const target = event.target.closest?.('.reveal');
      if (target) show(target);
    });
  }
}
