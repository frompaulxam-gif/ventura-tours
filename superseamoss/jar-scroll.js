(() => {
  const track = document.querySelector('.seamoss-hero-track');
  const stage = track?.querySelector('.seamoss-hero');
  const art = track?.querySelector('.seamoss-hero-art');
  const canvas = art?.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  const intro = track?.querySelector('.seamoss-hero-intro');
  const source = track?.querySelector('.seamoss-hero-source');
  const location = track?.querySelector('.seamoss-hero-location');
  const loading = window.seamossLoading;
  const narrow = matchMedia('(max-width:768px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!art || !canvas || !stage || !intro || !source || !location) {
    loading?.ready();
    return;
  }
  const sets = { desktop: [], mobile: [] };
  const jobs = {};
  const clamp = n => Math.max(0, Math.min(1, n));
  const fade = (p, start, end) => {
    const t = clamp((p - start) / (end - start));
    return t * t * (3 - 2 * t);
  };
  let mode = '';
  let frames = [];
  let target = 0;
  let current = 0;
  let last = -1;
  let prev = performance.now();
  let failed = false;

  function scroll() {
    target = reduced.matches || failed ? 1 : clamp(-track.getBoundingClientRect().top / (track.offsetHeight - stage.clientHeight));
  }
  function showCopy(el, opacity) {
    el.style.opacity = opacity;
    const hidden = String(opacity < .01);
    if (el.getAttribute('aria-hidden') !== hidden) el.setAttribute('aria-hidden', hidden);
  }
  function tick(now) {
    const dt = Math.min(64, now - prev);
    prev = now;
    current += (target - current) * (1 - Math.exp(-dt / 75));
    if (Math.abs(target - current) < .0001) current = target;
    const opening = clamp(current / .78);
    const i = reduced.matches ? 95 : Math.round(opening * 95);
    if (!failed && i !== last && frames[i]) {
      // Draw the approved source-fix10 frame directly, without pixel or lid corrections.
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frames[i], 0, 0, canvas.width, canvas.height);
      last = i;
      art.dataset.frameReady = 'true';
      canvas.dataset.frame = String(i);
    }
    showCopy(intro, reduced.matches || failed ? 0 : 1 - fade(current, .08, .32));
    showCopy(source, reduced.matches || failed ? 1 : fade(current, .79, .85));
    showCopy(location, reduced.matches || failed ? 1 : fade(current, .88, .95));
    track.dataset.progress = current.toFixed(4);
    requestAnimationFrame(tick);
  }
  async function load(kind) {
    if (jobs[kind]) return jobs[kind];
    jobs[kind] = (async () => {
      let prepared = 0;
      // Load only the active set, in the reference's numerical batches of eight.
      for (let batch = 0; batch < 96; batch += 8) {
        await Promise.all(Array.from({ length: Math.min(8, 96 - batch) }, async (_, k) => {
          const i = batch + k;
          const img = new Image();
          img.decoding = 'async';
          const folder = kind === 'mobile' ? 'mobile-frames' : 'scroll-frames';
          img.src = new URL(`assets/hero-scroll/${folder}/${String(i).padStart(3, '0')}.webp?v=source-fix10`, document.baseURI).href;
          await img.decode();
          sets[kind][i] = img;
          if (kind === mode) loading?.progress(++prepared, 96);
          else prepared++;
        }));
      }
    })();
    return jobs[kind];
  }
  function layout() {
    const next = narrow.matches ? 'mobile' : 'desktop';
    if (next !== mode) {
      mode = next;
      frames = sets[mode];
      canvas.width = mode === 'mobile' ? 720 : 960;
      canvas.height = mode === 'mobile' ? 720 : 540;
      canvas.dataset.frameSet = mode;
      delete canvas.dataset.frame;
      art.dataset.frameReady = 'false';
      last = -1;
      const kind = mode;
      load(kind).catch(() => { if (kind === mode) fallback(); }).finally(() => { if (kind === mode) loading?.ready(); });
    }
    scroll();
  }
  function fallback() {
    failed = true;
    track.dataset.fallback = 'true';
    showCopy(intro, 0);
    showCopy(source, 1);
    showCopy(location, 1);
    scroll();
    art.removeAttribute('role');
    art.removeAttribute('aria-label');
    art.querySelector('.seamoss-hero-poster').hidden = true;
    canvas.hidden = true;
    art.querySelector('video').hidden = false;
  }
  if (!ctx) {
    fallback();
    loading?.ready();
    return;
  }
  addEventListener('scroll', scroll, { passive: true });
  addEventListener('resize', layout);
  narrow.addEventListener('change', layout);
  document.addEventListener('seamoss:ready', scroll);
  reduced.addEventListener('change', scroll);
  layout();
  requestAnimationFrame(tick);
})();
