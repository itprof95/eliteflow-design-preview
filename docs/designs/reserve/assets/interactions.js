(() => {
  'use strict';
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || !('IntersectionObserver' in window)) return;
  const hero = document.querySelector('.concept-home > section:first-child');
  if (hero) {
    const intro = hero.querySelector('.local-hero-copy > p:not(.eyebrow),.form-intro,.friendly-overlay-copy > p:not(.eyebrow),.precision-title > p:not(.eyebrow),.tide-overlay-description');
    const copy = [hero.querySelector('.eyebrow'),hero.querySelector('h1'),intro,
      hero.querySelector('.local-immersive-tag,.form-margin-note,.friendly-note,.precision-coordinate,.tide-overlay-about')];
    copy.filter(Boolean).forEach((element,index) => element.classList.add('flow-hero-copy','flow-hero-step-'+index));
    const image = hero.querySelector('figure img');
    if (image) {
      const animateImage = () => { if (!preference.matches) image.classList.add('flow-hero-visual'); };
      if (image.complete && image.naturalWidth) animateImage();
      else image.addEventListener('load',animateImage,{once:true});
    }
  }
  const elements = [...document.querySelectorAll('.concept-sample,.service-card,.editorial-service,.section-heading,.service-detail-photo,.approval-list > div,.design-copy,.review-note')];
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove('flow-pending');
      observer.unobserve(entry.target);
    }
  }, {threshold: 0.08, rootMargin: '0px 0px -24px 0px'});
  for (const element of elements) {
    if (element.getBoundingClientRect().top < window.innerHeight - 24) continue;
    element.classList.add('flow-enter', 'flow-pending');
    observer.observe(element);
  }
  const revealAll = () => {
    document.querySelectorAll('.flow-pending').forEach(element => element.classList.remove('flow-pending'));
    observer.disconnect();
  };
  document.addEventListener('focusin', event => {
    const element = event.target.closest('.flow-pending');
    if (!element) return;
    element.classList.remove('flow-pending');
    observer.unobserve(element);
  });
  preference.addEventListener?.('change', event => { if (event.matches) revealAll(); });
  window.addEventListener('beforeprint', revealAll);
})();
