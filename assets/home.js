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
