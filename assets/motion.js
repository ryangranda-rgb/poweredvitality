/* CSP-safe motion: IntersectionObserver + rAF parallax.
   Inspired by motion.zajno.com principles (easing, offset/delay, fade, mask, scale, parallax).
   No network, analytics, storage or third-party libraries. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('.hero');
  const header = document.querySelector('[data-header]');
  const parallaxNodes = [...document.querySelectorAll('[data-parallax]')];

  if (!reduce) document.documentElement.classList.add('js-motion');

  const delayVar = (el) => {
    const delay = Number(el.getAttribute('data-reveal-delay') || 0);
    if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`);
  };

  const markIn = (el) => {
    delayVar(el);
    el.classList.add('is-in');
  };

  const revealSelector = '[data-reveal], [data-reveal-mask], [data-scale-in], [data-mask-media]';
  const revealNodes = [...document.querySelectorAll(revealSelector)];

  if (!reduce && 'IntersectionObserver' in window && revealNodes.length) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        markIn(entry.target);
        io.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });

    for (const node of revealNodes) {
      delayVar(node);
      // Hero load sequence should not wait on intersection — CTAs sit near the fold.
      if (hero && hero.contains(node)) {
        markIn(node);
        continue;
      }
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) markIn(node);
      else io.observe(node);
    }
  } else {
    revealNodes.forEach(markIn);
  }

  if (hero) {
    requestAnimationFrame(() => hero.classList.add('is-ready'));
  }

  if (header && !reduce) {
    const onScrollHeader = () => {
      header.classList.toggle('is-condensed', window.scrollY > 24);
    };
    onScrollHeader();
    window.addEventListener('scroll', onScrollHeader, { passive: true });
  }

  if (!reduce && parallaxNodes.length) {
    let ticking = false;
    const updateParallax = () => {
      ticking = false;
      const viewH = window.innerHeight || 1;
      for (const node of parallaxNodes) {
        const speed = Number(node.getAttribute('data-parallax') || 0.15);
        const media = node.querySelector('img, [data-zoom-media]') || node;
        const rect = node.getBoundingClientRect();
        const progress = (viewH - rect.top) / (viewH + rect.height);
        const clamped = Math.min(1, Math.max(0, progress));
        const shift = (clamped - 0.5) * speed * 120;
        const zoom = 1.08 - clamped * 0.04;
        media.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0) scale(${zoom.toFixed(4)})`;
      }
    };
    const requestTick = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateParallax);
    };
    updateParallax();
    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick, { passive: true });
  }
})();
