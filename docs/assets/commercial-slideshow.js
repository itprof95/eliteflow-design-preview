/* Automatic commercial photography; the opening image also works without JS. */
(() => {
  'use strict';
  const hero = document.querySelector('[data-commercial-slideshow]');
  if (!hero) return;
  const frame = hero.querySelector('.commercial-slideshow-frame');
  const slides = [...frame.querySelectorAll('[data-commercial-slide]')];
  if (slides.length < 2) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const loads = new Map();
  const fading = new Map();
  let active = 0;
  let timer;
  let warmup;
  let revision = 0;
  let focused = hero.contains(document.activeElement);
  let hovered = false;

  function load(index) {
    if (loads.has(index)) return loads.get(index);
    const img = slides[index].querySelector('img');
    const pending = new Promise(resolve => {
      const finish = () => {
        img.removeEventListener('load', loaded);
        img.removeEventListener('error', failed);
      };
      const loaded = () => {
        finish();
        const decoded = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
        decoded.then(() => resolve(img.naturalWidth > 0));
      };
      const failed = () => { finish(); resolve(false); };
      img.addEventListener('load', loaded, {once:true});
      img.addEventListener('error', failed, {once:true});
      if (img.dataset.src) {
        img.loading = 'eager';
        img.sizes = img.dataset.sizes;
        img.srcset = img.dataset.srcset;
        img.src = img.dataset.src;
        delete img.dataset.src;
      }
      if (img.complete && img.naturalWidth) loaded();
      else if (img.complete && img.getAttribute('src')) failed();
    });
    loads.set(index, pending);
    return pending;
  }
  function stop() { clearTimeout(timer); timer = undefined; }
  function canRotate() {
    return !preference.matches && !document.hidden && !focused && !hovered &&
      !hero.contains(document.activeElement);
  }
  function schedule() {
    stop();
    if (canRotate()) timer = setTimeout(next, 5000);
  }
  function render() {
    slides.forEach((slide, index) => {
      const current = index === active;
      if (current) {
        clearTimeout(fading.get(slide));
        fading.delete(slide);
        slide.classList.remove('is-leaving');
      } else if (slide.classList.contains('is-active') && !preference.matches) {
        // Keep the old photograph behind the incoming fade, avoiding a dark flash.
        slide.classList.add('is-leaving');
        fading.set(slide, setTimeout(() => {
          slide.classList.remove('is-leaving');
          fading.delete(slide);
        }, 1100));
      }
      slide.classList.toggle('is-active', current);
      slide.setAttribute('aria-hidden', String(!current));
    });
  }
  async function next() {
    stop();
    const ticket = ++revision;
    for (let offset = 1; offset < slides.length; offset++) {
      const index = (active + offset) % slides.length;
      const ready = await load(index);
      if (ticket !== revision || !canRotate()) return;
      if (!ready) continue;
      active = index;
      render();
      break;
    }
    schedule();
  }
  function warmImages() {
    clearTimeout(warmup);
    if (preference.matches || document.hidden) return;
    warmup = setTimeout(async () => {
      for (let index = 1; index < slides.length; index++) {
        if (preference.matches || document.hidden) return;
        await load(index);
      }
    }, 1200);
  }
  function motionChanged() {
    ++revision;
    stop();
    clearTimeout(warmup);
    if (preference.matches) {
      fading.forEach(timeout => clearTimeout(timeout));
      fading.clear();
      slides.forEach(slide => slide.classList.remove('is-leaving'));
      active = 0;
      render();
    } else warmImages();
    schedule();
  }
  hero.addEventListener('focusin', () => { focused = true; schedule(); });
  hero.addEventListener('focusout', event => { focused = hero.contains(event.relatedTarget); schedule(); });
  frame.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    hovered = true;
    schedule();
  });
  frame.addEventListener('pointerleave', () => { hovered = false; schedule(); });
  document.addEventListener('visibilitychange', () => {
    ++revision;
    if (document.hidden) { stop(); clearTimeout(warmup); }
    else { warmImages(); schedule(); }
  });
  preference.addEventListener?.('change', motionChanged);
  render();
  motionChanged();
})();
