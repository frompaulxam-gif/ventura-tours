/* Let the demo orb's colour field follow the pointer without moving its outline. */
(() => {
  'use strict';
  const stage = document.querySelector('.orb-stage');
  const orb = stage?.querySelector('.liquid-orb');
  const mist = orb?.querySelector('.orb-mist');
  if (!mist) return;

  // Keep the mist's existing rotation on a separate layer so both motions compose.
  const drift = document.createElement('div');
  drift.className = 'orb-pointer-drift';
  mist.before(drift);
  drift.append(mist);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  let visible = false;
  let frameId = 0;
  let last = 0;
  let x = 0, y = 0, targetX = 0, targetY = 0;
  const allowed = () => visible && !document.hidden && hover.matches &&
    !reduce.matches && document.body.dataset.reduced !== 'true';
  const clamp = value => Math.max(-1, Math.min(1, value));

  function draw() {
    drift.style.transform = `translate3d(${x.toFixed(3)}px, ${y.toFixed(3)}px, 0)`;
  }
  function frame(now) {
    frameId = 0;
    if (!allowed()) return;
    const dt = last ? Math.min((now - last) / 1000, .05) : 1 / 60;
    last = now;
    const ease = 1 - Math.exp(-dt * 7);
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    if (Math.abs(targetX - x) + Math.abs(targetY - y) < .02) {
      x = targetX; y = targetY; last = 0;
    } else {
      frameId = requestAnimationFrame(frame);
    }
    draw();
  }
  function wake() {
    if (allowed() && !frameId) { last = 0; frameId = requestAnimationFrame(frame); }
  }
  function release() { targetX = 0; targetY = 0; wake(); }
  stage.addEventListener('pointermove', event => {
    if (!allowed() || event.pointerType === 'touch') return;
    const rect = orb.getBoundingClientRect();
    const reach = Math.min(rect.width * .12, 32);
    targetX = clamp((event.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * reach;
    targetY = clamp((event.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * reach;
    wake();
  }, { passive: true });
  stage.addEventListener('pointerleave', release);
  stage.addEventListener('pointercancel', release);
  window.addEventListener('blur', release);
  window.addEventListener('scroll', release, { passive: true });

  function update() {
    if (!allowed()) {
      cancelAnimationFrame(frameId); frameId = 0; last = 0;
      if (reduce.matches || !hover.matches || !visible) {
        x = 0; y = 0; draw();
      }
      targetX = x; targetY = y;
    } else {
      release();
    }
  }
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting; update();
  }).observe(stage);
  new MutationObserver(update).observe(document.body, {
    attributes: true, attributeFilter: ['data-reduced']
  });
  reduce.addEventListener('change', update);
  hover.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
})();
