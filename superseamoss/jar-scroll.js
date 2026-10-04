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
    // Reserve the scroll distance before revealing the page, rather than shifting it later.
    track.classList.add('sequence-active');
    const response = await fetch('assets/jar-sequence/frames.json');
    if (!response.ok) throw new Error('Sequence unavailable');
    const config = await response.json();
    const frames = new Array(config.count);
    const canvas = model.querySelector('canvas');
    canvas.width = config.width;
    canvas.height = config.height;
    const context = canvas.getContext('2d');
    let lastFrame = -1;
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
      const desired = Math.round(progress * (config.count - 1));
      let index = desired;
      if (!frames[index]) {
        for (let offset = 1; offset < config.count; offset++) {
          if (frames[desired - offset]) { index = desired - offset; break; }
          if (frames[desired + offset]) { index = desired + offset; break; }
        }
      }
      if (!frames[index] || index === lastFrame) return;
      context.clearRect(0, 0, config.width, config.height);
      context.drawImage(frames[index], 0, 0, config.width, config.height);
      lastFrame = index;
      canvas.dataset.frame = String(index);
      model.classList.add('frame-ready');
    };
    const schedule = () => {
      if (!stopped && !pending && visible) pending = requestAnimationFrame(render);
    };
    const resize = () => { measureNeeded = true; schedule(); };
    const load = async index => {
      const image = new Image();
      image.decoding = 'async';
      image.src = 'assets/jar-sequence/' + String(index).padStart(3, '0') + '.webp';
      await image.decode();
      frames[index] = image;
    };

    await load(0);
    loading?.progress(1, config.count);
    schedule();
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

    // Decoding happens before the intro opens, not on the first fast swipe through the hero.
    let next = 1;
    let prepared = 1;
    await Promise.all(Array.from({ length: 3 }, async () => {
      while (next < config.count && !stopped) {
        const index = next++;
        try { await load(index); } catch { /* Keep the nearest available frame. */ }
        loading?.progress(++prepared, config.count);
      }
    }));
    schedule();
  }
  start().catch(() => {
    track.classList.remove('sequence-active');
    model.classList.remove('frame-ready');
  }).finally(() => loading?.ready());
})();
