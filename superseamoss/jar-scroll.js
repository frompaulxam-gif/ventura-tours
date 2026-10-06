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
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!art || !canvas || !stage || !intro || !source || !location) {
    loading?.ready();
    return;
  }
  const frames = [];
  const clamp = n => Math.max(0, Math.min(1, n));
  const fade = (p, start, end) => {
    const t = clamp((p - start) / (end - start));
    return t * t * (3 - 2 * t);
  };
  let target = 0;
  let current = 0;
  let last = -1;
  let prev = performance.now();
  let failed = false;
  let prepared = 0;

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
      // Draw the supplied frame whole, without moving any element inside it.
      ctx.clearRect(0, 0, 960, 540);
      ctx.drawImage(frames[i], 0, 0);
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
  async function loadFrame(i) {
    if (frames[i]) return;
    const img = new Image();
    img.decoding = 'async';
    img.src = new URL(`assets/hero-scroll/scroll-frames/${String(i).padStart(3, '0')}.webp`, document.baseURI).href;
    await img.decode();
    frames[i] = img;
    loading?.progress(++prepared, 96);
  }
  async function load() {
    if (reduced.matches) {
      await loadFrame(95);
    } else {
      // Preserve the reference's numerical sequence and batches of eight.
      for (let batch = 0; batch < 96; batch += 8) {
        await Promise.all(Array.from({ length: Math.min(8, 96 - batch) }, (_, k) => loadFrame(batch + k)));
      }
    }
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
    art.querySelector('.jar-poster').hidden = true;
    canvas.hidden = true;
    art.querySelector('video').hidden = false;
  }
  if (!ctx) {
    fallback();
    loading?.ready();
    return;
  }
  addEventListener('scroll', scroll, { passive: true });
  addEventListener('resize', scroll);
  document.addEventListener('seamoss:ready', scroll);
  reduced.addEventListener('change', () => {
    scroll();
    if (!reduced.matches && frames.filter(Boolean).length < 96 && !failed) load().catch(fallback);
  });
  scroll();
  load().catch(fallback).finally(() => loading?.ready());
  requestAnimationFrame(tick);
})();
