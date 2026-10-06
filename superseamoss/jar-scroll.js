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
  function prepareFrame(img, i, kind) {
    const frame = document.createElement('canvas');
    frame.width = img.naturalWidth;
    frame.height = img.naturalHeight;
    const paint = frame.getContext('2d', { willReadFrequently: true });
    paint.drawImage(img, 0, 0);
    if (i >= 24) {
      const pixels = paint.getImageData(0, 0, frame.width, frame.height);
      const d = pixels.data;
      for (let p = 0; p < d.length; p += 4) {
        const r = d[p], g = d[p + 1], b = d[p + 2], a = d[p + 3] / 255;
        // The supplied dissolve retains its green-screen RGB in translucent
        // ingredients. Remove that spill without changing the supplied alpha.
        const spill = clamp((20 - (r - g)) / 20) * clamp((r - b - 18) / 20);
        if (a > .08 && r > 55 && spill > 0) {
          const red = Math.min(255, Math.max(0, (r - (1 - a) * 24) / a));
          const blue = Math.min(255, Math.max(0, (b - (1 - a) * 28) / a));
          const green = .72 * red + .28 * blue;
          d[p] = r + (red - r) * spill;
          d[p + 1] = g + (green - g) * spill;
          d[p + 2] = b + (blue - b) * spill;
        }
      }
      paint.putImageData(pixels, 0, 0);
    }
    if (i < 18) {
      // Seat the closed cap over the exposed thread. Ease this small correction
      // away before the existing sliding-lid movement; later frames are intact.
      const scale = kind === 'mobile' ? 1 : .75;
      const x = Math.round((kind === 'mobile' ? 210 : 490) * scale);
      const y = Math.round(210 * scale);
      const w = Math.round(300 * scale), h = Math.round(105 * scale);
      const down = 18 * scale * (1 - fade(i, 0, 18));
      const cap = document.createElement('canvas');
      cap.width = w; cap.height = h;
      cap.getContext('2d').drawImage(frame, x, y, w, h, 0, 0, w, h);
      paint.clearRect(x, y, w, h);
      paint.drawImage(cap, x, y + down);
    }
    return frame;
  }
  function tick(now) {
    const dt = Math.min(64, now - prev);
    prev = now;
    current += (target - current) * (1 - Math.exp(-dt / 75));
    if (Math.abs(target - current) < .0001) current = target;
    const opening = clamp(current / .78);
    const i = reduced.matches ? 95 : Math.round(opening * 95);
    if (!failed && i !== last && frames[i]) {
      // Frames are corrected once during loading, never during scroll playback.
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
          img.src = new URL(`assets/hero-scroll/${folder}/${String(i).padStart(3, '0')}.webp?v=contained7`, document.baseURI).href;
          await img.decode();
          sets[kind][i] = prepareFrame(img, i, kind);
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
