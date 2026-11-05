/* Local presentation only. No form values, storage, analytics or network calls. */
(() => {
  const menu = document.querySelector('.gs-menu');
  if (menu) {
    menu.addEventListener('click', event => { if (event.target.closest('a')) menu.open = false; });
    document.addEventListener('pointerdown', event => { if (!menu.contains(event.target)) menu.open = false; });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); }
    });
  }
})();
