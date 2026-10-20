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
