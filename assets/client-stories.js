// Links remain usable without JavaScript; supported browsers show the full image in a dialog.
const storyDialog = document.querySelector('.story-dialog');
if (storyDialog && typeof storyDialog.showModal === 'function') {
  const dialogImage = storyDialog.querySelector('.story-dialog-content img');
  const dialogTitle = storyDialog.querySelector('#story-dialog-title');
  const closeButton = storyDialog.querySelector('.story-dialog-close');
  let openingLink;
  document.querySelectorAll('a[data-story-title]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      openingLink = link;
      dialogTitle.textContent = link.dataset.storyTitle;
      dialogImage.src = link.href;
      dialogImage.alt = link.querySelector('img')?.alt || link.dataset.storyTitle;
      storyDialog.showModal();
      closeButton.focus();
    });
  });
  closeButton.addEventListener('click', () => storyDialog.close());
  storyDialog.addEventListener('click', event => {
    if (event.target !== storyDialog) return;
    const bounds = storyDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) storyDialog.close();
  });
  storyDialog.addEventListener('close', () => {
    dialogImage.removeAttribute('src');
    if (openingLink) openingLink.focus();
  });
}
