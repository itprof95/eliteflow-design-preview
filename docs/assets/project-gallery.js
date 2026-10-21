(() => {
  'use strict';
  const photos = [...document.querySelectorAll('[data-project-photo]')];
  const viewer = document.querySelector('#project-photo-viewer');
  // Direct image links remain usable when the dialog API or JavaScript is unavailable.
  if (!photos.length || !viewer || typeof viewer.showModal !== 'function') return;
  const image = viewer.querySelector('img');
  const title = viewer.querySelector('#project-photo-title');
  const count = viewer.querySelector('.project-viewer-count');
  const error = viewer.querySelector('.project-viewer-error');
  let current = 0;
  let opener;

  function display(index) {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    title.textContent = photo.dataset.title;
    count.textContent = `Photo ${current + 1} of ${photos.length}`;
    error.hidden = true;
    image.alt = photo.querySelector('img').alt;
    image.src = photo.href;
  }

  photos.forEach((photo, index) => {
    photo.setAttribute('aria-haspopup', 'dialog');
    photo.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = photo;
      display(index);
      document.documentElement.classList.add('project-photo-open');
      viewer.showModal();
    });
  });
  viewer.querySelector('.project-viewer-close').addEventListener('click', () => viewer.close());
  viewer.querySelector('[data-project-previous]').addEventListener('click', () => display(current - 1));
  viewer.querySelector('[data-project-next]').addEventListener('click', () => display(current + 1));
  viewer.addEventListener('close', () => {
    document.documentElement.classList.remove('project-photo-open');
    opener?.focus({preventScroll: true});
  });
  image.addEventListener('error', () => { error.hidden = false; });
})();
