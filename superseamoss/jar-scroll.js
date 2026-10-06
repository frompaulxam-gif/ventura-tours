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
  const ingredientLayer = document.querySelector('.hero-ingredients');
  const ingredientNodes = [...(ingredientLayer?.querySelectorAll('img') || [])];
  // Reuse the blend preview's photographic cut-outs; an unavailable one is optional.
  Promise.all(ingredientNodes.map(image => image.decode().catch(() => { image.hidden = true; })))
    .then(() => ingredientLayer?.classList.add('is-ready'));
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
      let ingredientAnimations = [];
      let ingredientDrifts = [];
      const pauseDrifts = () => ingredientDrifts.forEach(({ animation }) => animation.pause());
      const cancelIngredients = () => {
        ingredientAnimations.forEach(animation => animation.cancel());
        ingredientAnimations = [];
        ingredientDrifts.forEach(({ animation }) => animation.cancel());
        ingredientDrifts = [];
      };
      const measureIngredients = () => {
        if (!ingredientLayer || !ingredientNodes.length) return;
        cancelIngredients();
        const jar = canvas.getBoundingClientRect();
        const layer = ingredientLayer.getBoundingClientRect();
        const page = hero.getBoundingClientRect();
        const heading = document.querySelector('#hero-heading').getBoundingClientRect();
        const note = document.querySelector('.hero-note')?.getBoundingClientRect();
        const compact = page.width <= 1000;
        const phone = page.width <= 700;
        const size = Math.max(72, Math.min(compact ? 160 : 300, jar.width * .48, page.width * .32));
        const originX = jar.left + jar.width * .5;
        const originY = jar.top + jar.height * .57;
        const foliageSize = size * .86;
        const headroom = jar.top - heading.bottom;
        const topPairBesideHeading = headroom <= foliageSize * 1.3 + 44 && page.width >= 1200;
        let foliageLane = page.width;
        if (topPairBesideHeading) {
          const range = document.createRange();
          for (const line of document.querySelectorAll('#hero-heading > span')) {
            range.selectNodeContents(line);
            const text = range.getBoundingClientRect();
            foliageLane = Math.min(foliageLane, text.left - page.left, page.right - text.right);
          }
        }
        // Fruit follows the two diagonals. The botanical pair fills the space above.
        const destinations = compact ? [
          [page.left + page.width * .13, phone ? heading.bottom + size / 2 + 12 : jar.top + jar.height * .30],
          [page.left + page.width * .18, jar.top + jar.height * .54],
          [page.left + page.width * .85, jar.top + jar.height * .51],
          [page.left + page.width * .84, jar.top + jar.height * .24]
        ] : [
          [originX - jar.width * .98, jar.top + jar.height * .04],
          [originX - jar.width * .62, jar.top + jar.height * (topPairBesideHeading ? .78 : .44)],
          [originX + jar.width * .64, jar.top + jar.height * (topPairBesideHeading ? .62 : .40)],
          [originX + jar.width * .98, jar.top - jar.height * .12]
        ];
        if (headroom > foliageSize * 1.3 + 44) {
          destinations.push(
            [originX - jar.width * .18, heading.bottom + headroom * .58],
            [originX + jar.width * .13, heading.bottom + headroom * .36]
          );
        } else if (page.width >= 1200) {
          // Short desktop screens have open space beside the two-line headline.
          destinations.push(
            [page.left + page.width * .07, heading.bottom - foliageSize * .55],
            [page.right - page.width * .07, heading.bottom - foliageSize * .80]
          );
        } else {
          destinations.push(
            [page.left + page.width * (phone ? .50 : .24), heading.bottom + foliageSize / 2 + 14],
            [page.left + page.width * (phone ? .80 : .76), heading.bottom + foliageSize / 2 + 14]
          );
        }
        ingredientNodes.forEach((node, index) => {
          const itemSize = index > 3 ? (topPairBesideHeading ? Math.min(foliageSize, Math.max(64, (foliageLane - 28) / 1.24)) : foliageSize) : size;
          // Reserve space for rotation and the small settling movement.
          const extent = itemSize * .62;
          const [destinationX, destinationY] = destinations[index];
          let x = Math.max(page.left + extent + 12, Math.min(page.right - extent - 12, destinationX));
          const aboveLid = phone && (index === 0 || index > 3);
          let y = index > 3 && topPairBesideHeading ? destinationY : Math.max(heading.bottom + (aboveLid ? itemSize / 2 + 12 : extent + 20), destinationY);
          if (index > 3 && topPairBesideHeading) {
            x = index === 4 ? page.left + foliageLane / 2 : page.right - foliageLane / 2;
          }
          if (note?.width && x - extent < note.right && x + extent > note.left && y + extent > note.top && y - extent < note.bottom) {
            const aboveNote = note.top - extent - 18;
            if (aboveNote >= heading.bottom + extent + 20) y = aboveNote;
            else x = note.right + extent + 18;
          }
          const anchor = node.parentElement;
          anchor.style.left = `${originX - layer.left}px`;
          anchor.style.top = `${originY - layer.top}px`;
          anchor.style.width = anchor.style.height = `${itemSize}px`;
          anchor.style.marginLeft = anchor.style.marginTop = `${-itemSize / 2}px`;
          const side = x < originX ? -1 : 1;
          const angle = [-7, 6, 8, -5, -9, 9][index];
          const dx = x - originX;
          const dy = y - originY;
          const arc = Math.min(54, itemSize * .20);
          const turn = (x, y, scale, rotation) => `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotation}deg)`;
          const besideHeading = index > 3 && topPairBesideHeading;
          // Sample one continuous curve so the ingredients do not stop at waypoints.
          const firstX = besideHeading ? dx : dx * .28;
          const firstY = besideHeading ? 0 : Math.max(dy, dy * .65 - arc);
          const secondX = besideHeading ? dx : dx * 1.06;
          const secondY = besideHeading ? dy * .10 : dy;
          const keyframes = Array.from({ length: 41 }, (_, frame) => {
            const t = frame / 40;
            const u = 1 - t;
            const curveX = 3 * u * u * t * firstX + 3 * u * t * t * secondX + t * t * t * dx;
            const curveY = 3 * u * u * t * firstY + 3 * u * t * t * secondY + t * t * t * dy;
            const scale = .62 + .38 * (1 - u * u * u) + .025 * Math.sin(Math.PI * t);
            const rotation = angle + (-side * 22 - angle) * u * u;
            return { transform: turn(curveX, curveY, scale, rotation), opacity: Math.min(1, t / .10), offset: t };
          });
          // Alternate left and right before revealing the two upper botanicals.
          const delay = 60 + [0, 100, 150, 50, 200, 250][index];
          const animation = anchor.animate(keyframes, { duration: 640, delay, easing: 'cubic-bezier(.22,.8,.3,1)', fill: 'both' });
          animation.pause();
          animation.currentTime = 0;
          animation.finished.catch(() => {});
          ingredientAnimations.push(animation);
          // A separate, time-driven float continues after the scroll reveal finishes.
          const lift = phone ? 8 : 15;
          const driftX = (phone ? 3 : 6) * side;
          const tilt = (index > 3 ? 3 : 2) * side;
          const drift = node.animate([
            { transform: 'translate(0px, 0px) rotate(0deg)', easing: 'ease-in-out' },
            { transform: `translate(${driftX}px, ${-lift}px) rotate(${tilt}deg)`, offset: .5, easing: 'ease-in-out' },
            { transform: 'translate(0px, 0px) rotate(0deg)' }
          ], { duration: [5600, 6900, 6300, 6100, 7600, 8200][index], iterations: Infinity, fill: 'both' });
          drift.pause();
          drift.currentTime = 0;
          drift.finished.catch(() => {});
          ingredientDrifts.push({ animation: drift, readyAt: delay + 640 * .90 });
        });
      };
      const drawIngredients = progress => {
        // Curved entrances, gentle turns and settling all reverse with the scroll.
        const time = clamp((progress - .12) / .76) * 950;
        ingredientAnimations.forEach(animation => { animation.currentTime = time; });
      };
      const syncDrifts = progress => {
        const time = clamp((progress - .12) / .76) * 950;
        ingredientDrifts.forEach(({ animation, readyAt }) => {
          if (time >= readyAt) {
            if (animation.playState !== 'running') animation.play();
          } else {
            animation.pause();
            if (progress <= .12) animation.currentTime = 0;
          }
        });
      };
      const measure = () => {
        const bounds = track.getBoundingClientRect();
        startY = window.scrollY + bounds.top;
        distance = Math.max(1, bounds.height - hero.clientHeight);
        measureIngredients();
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
          pauseDrifts();
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
        if (lastDrawn !== current) { draw(current); drawIngredients(current); lastDrawn = current; }
        syncDrifts(current);
        if (current !== target) pending = requestAnimationFrame(render);
        else previousTime = 0;
      }
      function schedule() {
        if (!stopped && !pending && visible) pending = requestAnimationFrame(render);
      }
      const resize = () => { measureNeeded = true; lastDrawn = -1; schedule(); };
      addEventListener('scroll', schedule, { passive: true });
      const motionStateChanged = () => {
        if (document.hidden || document.body.classList.contains('paused')) pauseDrifts();
        schedule();
      };
      document.addEventListener('seamoss:motion', motionStateChanged);
      document.addEventListener('visibilitychange', motionStateChanged);
      document.addEventListener('seamoss:ready', resize);
      const visibility = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible) schedule();
        else { cancelAnimationFrame(pending); pending = 0; previousTime = 0; pauseDrifts(); }
      });
      visibility.observe(track);
      const geometry = new ResizeObserver(resize);
      geometry.observe(track);
      geometry.observe(hero);
      stop = () => {
        stopped = true;
        cancelAnimationFrame(pending);
        cancelIngredients();
        removeEventListener('scroll', schedule);
        document.removeEventListener('seamoss:motion', motionStateChanged);
        document.removeEventListener('visibilitychange', motionStateChanged);
        document.removeEventListener('seamoss:ready', resize);
        visibility.disconnect();
        geometry.disconnect();
        track.classList.remove('sequence-active');
        model.classList.remove('frame-ready');
      };
      measure();
      current = clamp((window.scrollY - startY) / distance);
      draw(current);
      drawIngredients(current);
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
