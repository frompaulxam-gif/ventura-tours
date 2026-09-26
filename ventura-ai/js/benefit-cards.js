(() => {
  'use strict';
  const cards = [...document.querySelectorAll('.benefit-card')];
  if (!cards.length || !('IntersectionObserver' in window)) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const played = new WeakSet();
  const active = new Set();
  function animate(element, frames, options) {
    const animation = element.animate(frames, options);
    active.add(animation);
    animation.finished.catch(() => {}).finally(() => active.delete(animation));
  }
  const observer = new IntersectionObserver(entries => {
    const arriving = entries.filter(entry => entry.isIntersecting && !played.has(entry.target));
    entries.forEach(entry => entry.target.dataset.visible = String(entry.isIntersecting));
    arriving.forEach((entry, index) => {
      const card = entry.target;
      played.add(card);
      if (reduced.matches || document.hidden) return;
      const delay = index * 85;
      animate(card, [{ opacity: .35, transform: 'translateY(32px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 650, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      animate(card.querySelector('.benefit-art'), [{ transform: 'translateY(32px) scale(.93)' }, { transform: 'translateY(0) scale(1)' }],
        { duration: 1050, delay: delay + 90, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    });
  }, { threshold: .15 });
  cards.forEach(card => observer.observe(card));
  function settle() { active.forEach(animation => animation.cancel()); active.clear(); }
  reduced.addEventListener('change', () => { if (reduced.matches) settle(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) settle(); });
})();
