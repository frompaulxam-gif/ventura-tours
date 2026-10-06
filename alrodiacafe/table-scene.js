(() => {
  const hero = document.querySelector('.food-hero');
  const wrapper = document.querySelector('.hero-scroll');
  if (!hero || !wrapper) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = true;
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;
  const stopped = () => reduced.matches || document.body.classList.contains('motion-paused') || document.hidden || !visible;
  function render() {
    frame = 0;
    const paused = stopped();
    hero.classList.toggle('table-motion-still', paused);
    if (paused) return;
    const span = Math.max(1, wrapper.offsetHeight - hero.offsetHeight);
    const progress = Math.max(0, Math.min(1, -wrapper.getBoundingClientRect().top / span));
    hero.style.setProperty('--table-x', `${pointerX}px`);
    hero.style.setProperty('--table-y', `${pointerY}px`);
    hero.style.setProperty('--table-scroll', `${-30 * progress}px`);
    hero.style.setProperty('--table-scale', String(1 + progress * .045));
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(render); }
  hero.addEventListener('pointermove', event => {
    if (stopped() || event.pointerType === 'touch') return;
    const rect = hero.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - .5) * -20;
    pointerY = ((event.clientY - rect.top) / rect.height - .5) * -12;
    schedule();
  });
  hero.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; schedule(); });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  document.addEventListener('alrodia:motion', schedule);
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', schedule);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }).observe(hero);
  schedule();
})();
