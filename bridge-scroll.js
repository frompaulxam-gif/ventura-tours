/* Pull the bridge headings apart as the section enters the viewport. */
(() => {
  const bridge = document.getElementById('breathing-room');
  if (!bridge) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const left = bridge.querySelector('.bridge-left');
  const right = bridge.querySelector('.bridge-right');
  const ring = bridge.querySelector('.processing-ring');
  let frame = 0, distance = 0;
  function update() {
    frame = 0;
    const rect = bridge.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (innerHeight - rect.top - rect.height / 2) / (innerHeight * .55)));
    const disabled = reduced.matches || document.body.dataset.reduced === 'true' || innerWidth <= 760;
    bridge.style.setProperty('--bridge-shift', `${disabled ? 0 : distance * (1 - progress)}px`);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function measure() {
    bridge.style.setProperty('--bridge-shift', '0px');
    const a = left.getBoundingClientRect(), b = right.getBoundingClientRect(), c = ring.getBoundingClientRect();
    distance = Math.max(0, Math.min(72, innerWidth * .06, c.left - a.right - 24, b.left - c.right - 24));
    schedule();
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', measure);
  reduced.addEventListener('change', schedule);
  new MutationObserver(schedule).observe(document.body, { attributes: true, attributeFilter: ['data-reduced'] });
  document.fonts.ready.then(measure);
  measure();
})();
