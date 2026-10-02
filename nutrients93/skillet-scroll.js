/* Frame-by-frame playback avoids video seek latency, especially on mobile Safari. */
(() => {
  const track = document.querySelector('.hero-track');
  const hero = track.querySelector('.hero');
  const stage = track.querySelector('.hero-pan');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d', {alpha: true});
  const label = track.querySelector('.scroll-label');
  const link = track.querySelector('.scroll-link');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const folder = matchMedia('(max-width: 700px)').matches ? 'small' : 'large';
  const frameStep = navigator.connection?.saveData ? 4 : folder === 'small' ? 2 : 1;
  const frameIndices = Array.from({length: Math.ceil(95 / frameStep) + 1}, (_, i) => Math.min(95, i * frameStep));
  const count = frameIndices.length;
  const images = new Array(count);
  const line = document.createElement('div');
  line.className = 'lid-progress';
  line.setAttribute('aria-hidden', 'true');
  hero.append(line);
  let current = 0, target = 0, frameRequest = 0, lastTime = 0;
  let start = 0, distance = 1, ready = false, failed = false, loading = false, lastDrawn = -1;
  const clamp = n => Math.max(0, Math.min(1, n));
  const paused = () => document.body.classList.contains('paused');

  function draw(value) {
    if (!images[0] || !ctx) return;
    const frame = value * (count - 1);
    if (Math.abs(frame - lastDrawn) < .001) return;
    let lower = Math.floor(frame), upper = Math.ceil(frame);
    while (lower > 0 && !images[lower]) lower--;
    while (upper < count - 1 && !images[upper]) upper++;
    if (!images[upper]) upper = lower;
    const blend = upper === lower ? 0 : (frame - lower) / (upper - lower);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Add premultiplied alpha contributions, preserving the transparent backdrop.
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1 - blend;
    ctx.drawImage(images[lower], 0, 0, canvas.width, canvas.height);
    if (blend > .001) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = blend;
      ctx.drawImage(images[upper], 0, 0, canvas.width, canvas.height);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    line.style.transform = `scaleX(${value})`;
    stage.classList.toggle('sequence-playing', value > .0001);
    stage.dataset.frame = frame.toFixed(2);
    label.textContent = value > .99 ? 'KEEP SCROLLING TO DISCOVER' : 'SCROLL TO LIFT THE LID';
    lastDrawn = frame;
  }

  function tick(time) {
    frameRequest = 0;
    if (!ready || paused() || reduced.matches || failed) return;
    const elapsed = lastTime ? Math.min(64, time - lastTime) : 16;
    lastTime = time;
    current += (target - current) * (1 - Math.exp(-elapsed / 85));
    if (Math.abs(target - current) < .00015) current = target;
    draw(current);
    if (current !== target) frameRequest = requestAnimationFrame(tick);
    else lastTime = 0;
  }

  function requestRender() {
    if (!frameRequest && ready && !paused() && !reduced.matches && !failed) {
      frameRequest = requestAnimationFrame(tick);
    }
  }

  function updateTarget() {
    const progress = clamp((scrollY - start) / distance);
    // A short closed hold and open hold make both end poses easy to discover.
    target = clamp((progress - .025) / .88);
    requestRender();
  }

  function measure() {
    start = track.getBoundingClientRect().top + scrollY;
    distance = Math.max(1, track.offsetHeight - hero.offsetHeight, hero.offsetHeight - innerHeight);
    const box = stage.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.min(folder === 'small' ? 640 : 960, Math.round(box.width * ratio));
    canvas.height = Math.round(canvas.width * 3 / 4);
    lastDrawn = -1;
    draw(current);
    updateTarget();
  }

  function setMotion() {
    track.classList.toggle('sequence-active', !reduced.matches && !failed);
    if (reduced.matches) {
      cancelAnimationFrame(frameRequest);
      frameRequest = 0;
      current = target = 0;
      draw(0);
      label.textContent = 'SCROLL TO DISCOVER';
    }
    measure();
  }

  function loadFrame(index, attempt = 0) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = async () => {
        try { await image.decode(); } catch (_) { /* A loaded image remains drawable. */ }
        images[index] = image;
        resolve();
      };
      image.onerror = () => attempt ? reject(new Error('Sequence image unavailable')) : loadFrame(index, 1).then(resolve, reject);
      image.src = `assets/skillet-sequence/${folder}/${String(frameIndices[index]).padStart(3, '0')}.webp`;
    });
  }

  async function loadSequence() {
    if (!ctx || reduced.matches || loading || ready) return;
    loading = true;
    try {
      await loadFrame(0);
      draw(0);
      stage.classList.add('sequence-ready');
      const coarseStep = folder === 'small' ? 4 : 8;
      const anchors = Array.from({length: count - 1}, (_, i) => i + 1)
        .filter(i => i % coarseStep === 0 || i === count - 1);
      async function loadBatch(indices) {
        let next = 0;
        await Promise.all(Array.from({length: 4}, async () => {
          while (next < indices.length) {
            const index = indices[next++];
            try { await loadFrame(index); } catch (_) { /* Blend between the available frames on a weak connection. */ }
          }
        }));
      }
      await loadBatch(anchors);
      ready = true;
      stage.dataset.ready = 'true';
      stage.dataset.frameCount = String(count);
      updateTarget();
      await loadBatch(Array.from({length: count - 1}, (_, i) => i + 1).filter(i => !images[i]));
      lastDrawn = -1;
      requestRender();
    } catch (_) {
      failed = true;
      stage.classList.remove('sequence-ready');
      track.classList.remove('sequence-active');
      label.textContent = 'SCROLL TO DISCOVER';
    } finally {
      loading = false;
    }
  }

  addEventListener('scroll', updateTarget, {passive: true});
  addEventListener('resize', measure, {passive: true});
  document.fonts.ready.then(measure);
  reduced.addEventListener('change', () => { setMotion(); if (!reduced.matches && !ready) loadSequence(); });
  document.querySelector('.motion-toggle').addEventListener('click', () => {
    if (paused()) { cancelAnimationFrame(frameRequest); frameRequest = 0; lastTime = 0; }
    else requestRender();
  });
  link.addEventListener('click', event => {
    if (reduced.matches || failed || paused() || target > .98) return;
    event.preventDefault();
    scrollTo({top: start + distance, behavior: 'smooth'});
  });
  // Returning home always restores the closed frame instead of retaining a saved pose.
  document.querySelectorAll('a[href="#home"]').forEach(home => home.addEventListener('click', () => {
    current = target = 0;
    draw(0);
  }));
  setMotion();
  loadSequence();
})();
