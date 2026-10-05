(() => {
  const model = document.querySelector('.jar-model');
  const track = document.querySelector('.hero-track');
  const hero = document.querySelector('.hero');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const loading = window.seamossLoading;
  if (!model?.dataset.sequence || reducedMotion.matches) {
    loading?.ready();
    return;
  }

  async function start() {
    track.classList.add('sequence-active');
    const canvas = model.querySelector('canvas');
    canvas.width = canvas.height = 768;
    const context = canvas.getContext('2d');
    const assets = ['closed', 'open-body', 'lid'];
    let prepared = 0;
    const [closed, body, lid] = await Promise.all(assets.map(async name => {
      const image = new Image();
      image.decoding = 'async';
      image.src = `assets/real-jar/${name}.webp?v=real1`;
      await image.decode();
      loading?.progress(++prepared, assets.length);
      return image;
    }));
    let lastProgress = -1;
    let pending = 0;
    let startY = 0;
    let distance = 1;
    let measureNeeded = true;
    let visible = true;
    let stopped = false;
    const measure = () => {
      const bounds = track.getBoundingClientRect();
      startY = window.scrollY + bounds.top;
      distance = Math.max(1, bounds.height - hero.clientHeight);
      measureNeeded = false;
    };
    const render = () => {
      pending = 0;
      if (stopped) return;
      if (measureNeeded) measure();
      if (!visible || document.hidden || document.body.classList.contains('paused')) return;
      const progress = Math.max(0, Math.min(1, (window.scrollY - startY) / distance));
      if (progress === lastProgress) return;
      const eased = progress * progress * (3 - 2 * progress);
      const scale = 1 - .24 * eased;
      const lift = 200 * eased;
      context.clearRect(0, 0, 768, 768);
      context.save();
      context.translate(384, 384 + 62 * eased);
      context.scale(scale, scale);
      context.translate(-384, -384);
      // Both layers share the reference photograph's viewpoint and registration.
      context.drawImage(body, 0, 0, 768, 768);
      if (progress < .08) {
        context.globalAlpha = 1 - progress / .08;
        context.drawImage(closed, 0, 0, 768, 768);
        context.globalAlpha = 1;
      }
      context.drawImage(lid, 0, -lift, 768, 768);
      context.restore();
      lastProgress = progress;
      canvas.dataset.frame = String(Math.round(progress * 47));
      canvas.dataset.progress = progress.toFixed(3);
      model.classList.add('frame-ready');
    };
    const schedule = () => {
      if (!stopped && !pending && visible) pending = requestAnimationFrame(render);
    };
    const resize = () => { measureNeeded = true; lastProgress = -1; schedule(); };
    addEventListener('scroll', schedule, { passive: true });
    document.addEventListener('seamoss:motion', schedule);
    document.addEventListener('visibilitychange', schedule);
    const visibility = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) schedule();
    });
    visibility.observe(track);
    const geometry = new ResizeObserver(resize);
    geometry.observe(track);
    geometry.observe(hero);
    const stop = () => {
      stopped = true;
      cancelAnimationFrame(pending);
      removeEventListener('scroll', schedule);
      document.removeEventListener('seamoss:motion', schedule);
      document.removeEventListener('visibilitychange', schedule);
      visibility.disconnect();
      geometry.disconnect();
      track.classList.remove('sequence-active');
      model.classList.remove('frame-ready');
    };
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) stop(); }, { once: true });
    schedule();
  }
  start().catch(() => {
    track?.classList.remove('sequence-active');
    model?.classList.remove('frame-ready');
  }).finally(() => loading?.ready());
})();
