(() => {
  const model = document.querySelector('.jar-model');
  const track = document.querySelector('.hero-track');
  const hero = document.querySelector('.hero');
  const canvas = model?.querySelector('canvas');
  const context = canvas?.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const loading = window.seamossLoading;
  if (!model?.dataset.sequence || !track || !hero || !context) {
    loading?.ready();
    return;
  }
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const p = clamp(value); return p * p * (3 - 2 * p); };
  let stop = () => {};
  let assets;
  let starting = false;

  async function start() {
    if (reducedMotion.matches || starting) return;
    starting = true;
    try {
      let prepared = 0;
      assets ||= await Promise.all(['closed', 'open-body', 'lid'].map(async name => {
        const image = new Image();
        image.decoding = 'async';
        image.src = `assets/real-jar/${name}-wet.webp?v=wet1`;
        await image.decode();
        loading?.progress(++prepared, 3);
        return image;
      }));
      if (reducedMotion.matches) return;
      const [, body, lid] = assets;
      canvas.width = canvas.height = 768;
      track.classList.add('sequence-active');
      let pending = 0;
      let previousTime = 0;
      let startY = 0;
      let distance = 1;
      let measureNeeded = true;
      let visible = true;
      let stopped = false;
      let current = null;
      let lastDrawn = -1;
      const measure = () => {
        const bounds = track.getBoundingClientRect();
        startY = window.scrollY + bounds.top;
        distance = Math.max(1, bounds.height - hero.clientHeight);
        measureNeeded = false;
      };

      function draw(progress) {
        // Soft sideways: match the reference's side path in 768px asset space.
        const opening = smooth((progress - .08) / .8);
        const release = smooth(opening / .2);
        const travel = smooth((opening - .12) / .88);
        const lift = 12 * release + 152 * travel;
        const slide = 88 * travel;
        context.clearRect(0, 0, 768, 768);
        context.save();
        // Fixed framing leaves room for the whole lid without moving the label.
        context.translate(384, 448);
        context.scale(.73, .73);
        context.translate(-384, -384);
        context.drawImage(body, 0, 0, 768, 768);
        // Reflections and droplets come only from the photographs.
        context.save();
        context.translate(384 - slide, 140 - lift);
        context.rotate(-7 * travel * Math.PI / 180);
        context.drawImage(lid, -384, -140, 768, 768);
        context.restore();
        context.restore();
        canvas.dataset.progress = progress.toFixed(4);
        canvas.dataset.frame = String(Math.round(progress * 95));
        canvas.dataset.mode = 'side';
        model.classList.add('frame-ready');
      }
      function render(time) {
        pending = 0;
        if (stopped || !visible || document.hidden || document.body.classList.contains('paused')) {
          previousTime = 0;
          return;
        }
        if (measureNeeded) measure();
        const target = clamp((window.scrollY - startY) / distance);
        if (current === null) current = target;
        // Time-based damping behaves consistently on 60 Hz and 120 Hz displays.
        const elapsed = previousTime ? Math.min(64, time - previousTime) : 16.7;
        previousTime = time;
        current += (target - current) * (1 - Math.exp(-elapsed / 70));
        if (Math.abs(target - current) < .00005) current = target;
        if (lastDrawn !== current) { draw(current); lastDrawn = current; }
        if (current !== target) pending = requestAnimationFrame(render);
        else previousTime = 0;
      }
      function schedule() {
        if (!stopped && !pending && visible) pending = requestAnimationFrame(render);
      }
      const resize = () => { measureNeeded = true; lastDrawn = -1; schedule(); };
      addEventListener('scroll', schedule, { passive: true });
      document.addEventListener('seamoss:motion', schedule);
      document.addEventListener('visibilitychange', schedule);
      document.addEventListener('seamoss:ready', resize);
      const visibility = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible) schedule();
        else { cancelAnimationFrame(pending); pending = 0; previousTime = 0; }
      });
      visibility.observe(track);
      const geometry = new ResizeObserver(resize);
      geometry.observe(track);
      geometry.observe(hero);
      stop = () => {
        stopped = true;
        cancelAnimationFrame(pending);
        removeEventListener('scroll', schedule);
        document.removeEventListener('seamoss:motion', schedule);
        document.removeEventListener('visibilitychange', schedule);
        document.removeEventListener('seamoss:ready', resize);
        visibility.disconnect();
        geometry.disconnect();
        track.classList.remove('sequence-active');
        model.classList.remove('frame-ready');
      };
      measure();
      current = clamp((window.scrollY - startY) / distance);
      draw(current);
      lastDrawn = current;
      schedule();
    } catch (error) {
      stop();
      console.warn('Jar animation unavailable; showing the product photograph.', error);
    } finally {
      starting = false;
      loading?.ready();
    }
  }
  reducedMotion.addEventListener('change', () => reducedMotion.matches ? stop() : start());
  if (reducedMotion.matches) loading?.ready();
  else start();
})();
