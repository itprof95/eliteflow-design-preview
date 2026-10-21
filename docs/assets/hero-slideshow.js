(() => {
  'use strict';
  const hero = document.querySelector('[data-hero-slideshow]');
  if (!hero) return;
  const slides = [...hero.querySelectorAll('[data-hero-slide]')];
  if (slides.length < 2) return;

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const loads = new Map();
  const fading = new Map();
  let active = 0;
  let timer;
  let warmup;
  let focused = hero.contains(document.activeElement);
  let revision = 0;

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
        // Decode before fading in; keep the current image if loading fails.
        const ready = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
        ready.then(() => resolve(img.naturalWidth > 0));
      };
      const failed = () => {
        finish();
        slides[index].dataset.failed = 'true';
        resolve(false);
      };
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

  function stop() {
    window.clearTimeout(timer);
    timer = undefined;
  }

  function canRotate() {
    return !preference.matches && !document.hidden && !focused;
  }

  function schedule() {
    stop();
    hero.classList.toggle('hero-motion-paused', preference.matches || document.hidden || focused);
    if (canRotate()) timer = window.setTimeout(() => show(active + 1), 5000);
  }

  function render() {
    slides.forEach((slide, index) => {
      const current = index === active;
      if (current) {
        window.clearTimeout(fading.get(slide));
        fading.delete(slide);
        slide.classList.remove('is-leaving');
      } else if (slide.classList.contains('is-active') && !preference.matches) {
        // Keep the completed zoom while the outgoing photo fades away.
        slide.classList.add('is-leaving');
        fading.set(slide, window.setTimeout(() => {
          slide.classList.remove('is-leaving');
          fading.delete(slide);
        }, 1000));
      }
      slide.classList.toggle('is-active', current);
    });
  }

  async function show(requested) {
    stop();
    const ticket = ++revision;
    const direction = requested < active ? -1 : 1;
    for (let attempt = 0; attempt < slides.length; attempt++) {
      const index = ((requested + attempt * direction) % slides.length + slides.length) % slides.length;
      if (index === active) break;
      if (await load(index)) {
        if (ticket !== revision || !canRotate()) return;
        active = index;
        render();
        schedule();
        return;
      }
      if (ticket !== revision) return;
    }
    schedule();
  }

  function warmImages() {
    window.clearTimeout(warmup);
    if (preference.matches || document.hidden) return;
    // First image has priority. Fetch only one later image at a time.
    warmup = window.setTimeout(async () => {
      for (let index = 1; index < slides.length; index++) {
        if (preference.matches || document.hidden) return;
        await load(index);
      }
    }, 1200);
  }

  function motionChanged() {
    ++revision;
    stop();
    window.clearTimeout(warmup);
    hero.classList.toggle('hero-motion-enabled', !preference.matches);
    if (preference.matches) {
      fading.forEach(timeout => window.clearTimeout(timeout));
      fading.clear();
      slides.forEach(slide => slide.classList.remove('is-leaving'));
      active = 0;
      hero.querySelectorAll('.hero-copy-enter').forEach(element => element.classList.remove('hero-copy-enter'));
      render();
      schedule();
    } else {
      warmImages();
      schedule();
    }
  }

  hero.addEventListener('focusin', () => { focused = true; schedule(); });
  hero.addEventListener('focusout', event => {
    focused = hero.contains(event.relatedTarget);
    schedule();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      ++revision;
      stop();
      window.clearTimeout(warmup);
      hero.classList.add('hero-motion-paused');
    } else {
      warmImages();
      schedule();
    }
  });
  preference.addEventListener?.('change', motionChanged);

  render();
  if (!preference.matches) {
    const copy = hero.querySelector('.local-hero-copy');
    copy.querySelector('.eyebrow').classList.add('hero-copy-enter');
    copy.querySelector('h1').classList.add('hero-copy-enter', 'hero-copy-heading');
    copy.querySelector('p:not(.eyebrow)').classList.add('hero-copy-enter', 'hero-copy-description');
    hero.querySelector('.local-immersive-tag')?.classList.add('hero-copy-enter', 'hero-copy-note');
  }
  motionChanged();
})();
