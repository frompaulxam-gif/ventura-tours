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
  const neighbours = {};
  const frameCount = 80;
  const lastFrame = frameCount - 1;
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
  function cleanEdges(img, kind) {
    const frame = document.createElement('canvas');
    frame.width = img.naturalWidth;
    frame.height = img.naturalHeight;
    const paint = frame.getContext('2d', { willReadFrequently: true });
    paint.drawImage(img, 0, 0);
    const pixels = paint.getImageData(0, 0, frame.width, frame.height);
    const original = pixels.data.slice();
    const d = pixels.data, w = frame.width, h = frame.height;
    const radius = kind === 'mobile' ? 6 : 5;
    const search = kind === 'mobile' ? 8 : 6;
    if (!neighbours[kind]) {
      const offsets = [];
      for (const step of [1, 2, 3, 4, 6, 8]) {
        if (step > search) continue;
        offsets.push([-step, 0], [step, 0], [0, -step], [0, step],
          [-step, -step], [step, -step], [-step, step], [step, step]);
      }
      offsets.sort((a, b) => a[0] * a[0] + a[1] * a[1] - b[0] * b[0] - b[1] * b[1]);
      neighbours[kind] = offsets;
    }
    const boundary = [[-radius, 0], [radius, 0], [0, -radius], [0, radius],
      [-radius, -radius], [radius, -radius], [-radius, radius], [radius, radius]];
    // Probe only suspected spill pixels near the keyed boundary. The alpha
    // channel is never eroded or feathered, preserving every thin root tip.
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = y * w + x, p = n * 4;
      const r = original[p], g = original[p + 1], b = original[p + 2];
      const spill = clamp((g - r + 20) / 8) * clamp((r - b - 18) / 18);
      if (original[p + 3] < 20 || r < 25 || !spill) continue;
      let edge = original[p + 3] < 128;
      for (const [dx, dy] of boundary) {
        if (edge) break;
        const sx = x + dx, sy = y + dy;
        edge = sx < 0 || sx >= w || sy < 0 || sy >= h || original[(sy * w + sx) * 4 + 3] < 128;
      }
      if (!edge) continue;
      // Borrow warm material ratios from the nearest uncontaminated opaque
      // neighbour, retaining this pixel's red-channel texture and all alpha.
      let greenRatio = .84, blueRatio = .62;
      for (const [dx, dy] of neighbours[kind]) {
        const sx = x + dx, sy = y + dy;
        if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;
        const q = (sy * w + sx) * 4;
        const sr = original[q], sg = original[q + 1], sb = original[q + 2];
        if (original[q + 3] < 240 || sr < 45 || sr - sg < 18 || sb / sr < .3 || sb / sr > .85) continue;
        greenRatio = Math.max(.7, Math.min(.88, sg / sr));
        blueRatio = Math.max(.4, Math.min(.76, sb / sr));
        break;
      }
      d[p + 1] = g + (r * greenRatio - g) * spill;
      d[p + 2] = b + (r * blueRatio - b) * spill;
    }
    paint.putImageData(pixels, 0, 0);
    return frame;
  }
  function tick(now) {
    const dt = Math.min(64, now - prev);
    prev = now;
    current += (target - current) * (1 - Math.exp(-dt / 75));
    if (Math.abs(target - current) < .0001) current = target;
    const opening = clamp(current / .78);
    const i = reduced.matches ? lastFrame : Math.round(opening * lastFrame);
    if (!failed && i !== last && frames[i]) {
      // Edge cleanup is cached during loading; playback does no pixel work.
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
      for (let batch = 0; batch < frameCount; batch += 8) {
        await Promise.all(Array.from({ length: Math.min(8, frameCount - batch) }, async (_, k) => {
          const i = batch + k;
          const img = new Image();
          img.decoding = 'async';
          const folder = kind === 'mobile' ? 'mobile-frames' : 'scroll-frames';
          img.src = new URL(`assets/hero-scroll/${folder}/${String(i).padStart(3, '0')}.webp?v=source-fix10`, document.baseURI).href;
          await img.decode();
          sets[kind][i] = cleanEdges(img, kind);
          if (kind === mode) loading?.progress(++prepared, frameCount);
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
