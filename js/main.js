/* ============================================================
   VENTURA TOURS — v2 choreography
   Act 1 (load): letters rise on burgundy → archway opens on the
     city → title Flip-docks top-centre → header arrives
   Act 2 (scroll): pinned camera tilt down to the skypool → dwell
     → light-blue circle wipe with curved rim text → releases into
     the sky-blue reasons section
   ============================================================ */

(function () {
  const html = document.documentElement;
  const body = document.body;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  /* ---------- split helpers ---------- */

  function splitChars(el) {
    const text = el.textContent;
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', text.replace(/ /g, ' '));
    el.textContent = '';
    const holder = document.createElement('span');
    holder.setAttribute('aria-hidden', 'true');
    text.split(/(\s| )/).forEach((token) => {
      if (!token) return;
      if (/^(\s| )$/.test(token)) {
        holder.appendChild(document.createTextNode(' '));
        return;
      }
      const word = document.createElement('span');
      word.className = 'word';
      token.split('').forEach((ch) => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch;
        word.appendChild(span);
      });
      holder.appendChild(word);
    });
    el.appendChild(holder);
    return el.querySelectorAll('.char');
  }

  /* ---------- static fallback (reduced motion or no GSAP) ---------- */

  function staticInit() {
    body.classList.add('is-static');
    $('#header').classList.add('blend', 'ready');
    initTourPan(true);
  }

  /* ---------- featured tour: drag-to-pan (fake 360) ---------- */

  function initTourPan(isStatic) {
    const pan = $('#tourPan');
    if (!pan) return;
    const img = pan.querySelector('img');
    const cue = pan.parentElement.querySelector('.tour-cue');
    let overflow = 0;
    let x = 0;
    let auto = null;
    let idleTimer = null;

    function measure() {
      overflow = Math.max(0, img.offsetWidth - pan.offsetWidth);
      x = clamp(x || -overflow / 2);
      apply();
    }
    function clamp(v) { return Math.min(0, Math.max(-overflow, v)); }
    function apply() { img.style.transform = 'translateX(' + x + 'px)'; }

    function startAuto() {
      if (isStatic || reduced || !hasGsap || overflow === 0) return;
      stopAuto();
      auto = gsap.to({ p: x }, {
        p: -overflow * 0.72,
        duration: 16,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        onUpdate: function () { x = clamp(this.targets()[0].p); apply(); }
      });
    }
    function stopAuto() { if (auto) { auto.kill(); auto = null; } }

    let dragging = false;
    let lastX = 0;
    pan.addEventListener('pointerdown', (e) => {
      dragging = true;
      lastX = e.clientX;
      stopAuto();
      window.clearTimeout(idleTimer);
      pan.setPointerCapture(e.pointerId);
      if (cue) cue.style.opacity = '0';
    });
    pan.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      stopAuto();
      window.clearTimeout(idleTimer);
      x = clamp(x + (e.key === 'ArrowLeft' ? 48 : -48));
      apply();
      if (cue) cue.style.opacity = '0';
    });
    pan.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      x = clamp(x + (e.clientX - lastX));
      lastX = e.clientX;
      apply();
    });
    const release = () => {
      if (!dragging) return;
      dragging = false;
      idleTimer = window.setTimeout(() => maybeAuto(), 5000);
    };
    pan.addEventListener('pointerup', release);
    pan.addEventListener('pointercancel', release);

    // only auto-pan while the tour section is actually on screen
    let tourVisible = false;
    const maybeAuto = () => { if (tourVisible && !dragging && !auto) startAuto(); };
    if (!isStatic && !reduced && hasGsap && window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: '#tour',
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (t) => {
          tourVisible = t.isActive;
          if (t.isActive) maybeAuto();
          else stopAuto();
        }
      });
    }

    if (img.complete) { measure(); maybeAuto(); }
    else img.addEventListener('load', () => { measure(); maybeAuto(); });
    window.addEventListener('resize', measure);
  }

  /* ---------- boot ---------- */

  if (!hasGsap || reduced) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', staticInit);
    } else {
      staticInit();
    }
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (window.Flip) gsap.registerPlugin(Flip);
  ScrollTrigger.config({ ignoreMobileResize: true });

  html.classList.add('lock');
  // keep keyboard focus out of the below-fold content during the intro
  const inertSections = $$('main > section:not(#hero), main > footer');
  inertSections.forEach((s) => { s.inert = true; });

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  // a bfcache restore resurrects stale animation state — take a clean load
  window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });
  // with restoration permanently manual, honour back/forward ourselves
  window.addEventListener('popstate', () => {
    const t = location.hash ? document.querySelector(location.hash) : null;
    window.scrollTo({ top: t ? t.getBoundingClientRect().top + window.scrollY : 0, behavior: 'instant' });
  });
  // a section deep-link would fight the choreography — park it, honour it after
  const deepLink = /^#(top|tour|process|contact|reasons)$/.test(location.hash) ? location.hash : null;
  if (deepLink) history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo(0, 0);

  const header = $('#header');
  const title = $('#title');
  const heroMedia = $('#heroMedia');
  const heroImg = $('#heroImg');

  $$('.beat-line').forEach((h) => splitChars(h));

  // GSAP owns both translate axes — a partial yPercent tween would silently
  // drop the CSS -50% centring (transforms must be single-sourced)
  gsap.set(title, { autoAlpha: 0, xPercent: -50, yPercent: -36 });
  gsap.set('.rise-centre, .rise-rule, .rise-tag, .rise-headline', { autoAlpha: 0 });
  // the doorway arch — 0.001 offsets keep the serialized inset() in full
  // 4-value form so GSAP's number matching never scrambles mid-tween;
  // oversized 50vw radii clamp to half the width = a true dome throughout
  const narrowScreen = window.innerWidth < 760;
  gsap.set(heroMedia, {
    clipPath: narrowScreen
      ? 'inset(42% 26% 0.001% 26.001% round 50vw 50vw 0vw 0vw)'
      : 'inset(40% 38% 0.001% 38.001% round 50vw 50vw 0vw 0vw)',
    willChange: 'clip-path'
  });
  gsap.set(heroImg, { scale: 1.12 });

  /* ----- readiness gate: fonts + hero image (decode capped) ----- */

  let heroReady = false;
  const readiness = [document.fonts ? document.fonts.ready : Promise.resolve()];
  readiness.push(new Promise((res) => {
    const settle = () => Promise.race([
      heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve(),
      new Promise((r) => window.setTimeout(r, 1500))
    ]).then(res);
    if (heroImg.complete) settle();
    else {
      heroImg.addEventListener('load', settle, { once: true });
      heroImg.addEventListener('error', res, { once: true });
    }
  }));
  Promise.all(readiness).then(() => {
    heroReady = true;
    if (intro.paused()) intro.play();
  });

  /* ----- Act 1: letters rise, arch opens, title Flip-docks ----- */

  function dockTitle() {
    if (window.Flip) {
      const state = Flip.getState(title);
      title.classList.add('docked');
      Flip.from(state, { duration: 1.2, ease: 'power3.inOut', scale: true });
    } else {
      title.classList.add('docked');
    }
  }

  const intro = window.__introTl = window.__revealTl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete: () => {
      window.scrollTo(0, 0); // guard against anything nudging scroll mid-intro
      html.classList.remove('lock');
      void document.body.offsetWidth; // flush layout so the returning
      // scrollbar is accounted for before the pin measures widths
      inertSections.forEach((s) => { s.inert = false; });
      $('#hero').classList.add('is-revealed');
      // the final clip stays INLINE — clearing it here caused a one-frame
      // flash of a partially-clipped state; only the layer hint is released
      gsap.set(heroMedia, { clearProps: 'willChange' });
      // create the pin a few frames later, once the unlock/scrollbar layout
      // has fully settled — pinning mid-settle snapshots stale dimensions
      // and paints the hero at the wrong size for a frame (setTimeout, not
      // rAF: rAF never fires in background tabs)
      window.setTimeout(() => {
        initWipe();
        initReveals();
        ScrollTrigger.refresh();
        // pins exist before the nav becomes interactive
        header.classList.add('ready');
        if (deepLink) {
          const t = $(deepLink === '#top' ? 'main' : deepLink);
          if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
          history.replaceState(null, '', location.pathname + location.search + deepLink);
        }
        driftHero();
      }, 70);
    }
  });

  intro
    .to(title, { autoAlpha: 1, yPercent: -50, duration: 1.3, delay: 0.5 })
    .addLabel('reveal')
    .addPause('reveal', () => { if (heroReady) intro.play(); })
    .to(heroMedia, { opacity: 1, duration: 0.55, ease: 'power1.inOut' }, 'reveal')
    .to('.arch-label', { autoAlpha: 0.85, duration: 0.5, ease: 'power1.out' }, 'reveal+=0.25')
    .to('.arch-label', { autoAlpha: 0, duration: 0.35, ease: 'power1.in' }, 'reveal+=1.0')
    .to(heroMedia, {
      // stage one: rise into the tall doorway… and hold there for a beat
      clipPath: narrowScreen
        ? 'inset(7% 12% 0.001% 12.001% round 50vw 50vw 0vw 0vw)'
        : 'inset(12% 31% 0.001% 31.001% round 50vw 50vw 0vw 0vw)',
      duration: 1.1,
      ease: 'power3.inOut'
    }, 'reveal+=0.6')
    .to(heroMedia, {
      keyframes: [
        // stage two: the doorway swells to full bleed, dome unfurling last.
        // the intermediate value MUST stay non-collapsible (all values
        // slightly distinct) — browsers shorten symmetric inset() strings on
        // serialization, which desyncs GSAP's number matching at the
        // keyframe boundary and flashes a garbage perpendicular clip
        { clipPath: 'inset(0% 0.002% 0.003% 0.001% round 50vw 49.999vw 0.002vw 0.001vw)', duration: 1.05, ease: 'power2.inOut' },
        { clipPath: 'inset(0% 0% 0% 0% round 0vw 0vw 0vw 0vw)', duration: 0.45, ease: 'power2.out' }
      ]
    }, 'reveal+=2.2')
    .to(heroImg, { scale: 1, duration: 3.2, ease: 'power2.out' }, 'reveal+=0.6')
    .add(dockTitle, 'reveal+=2.4')
    .add(() => header.classList.add('blend'), 'reveal+=2.55')
    .to('#heroLine', { autoAlpha: 1, duration: 0.9, ease: 'power1.out' }, 'reveal+=3.55')
    .to('#scrollCue', { autoAlpha: 1, duration: 0.8, ease: 'power1.out' }, 'reveal+=3.75');

  function driftHero() {
    const drift = gsap.to(heroImg, {
      scale: 1.06,
      duration: 22,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      paused: true
    });
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (t) => (t.isActive ? drift.play() : drift.pause())
    });
    if (window.scrollY < window.innerHeight) drift.play();
  }

  /* ----- Act 2: tilt, dwell, circle wipe with curved rim text ----- */

  function stageHeight() {
    const st = $('#hero');
    return st ? st.offsetHeight : window.innerHeight;
  }

  function drawArc(p) {
    // circle(p% ...) resolves against hypot(w, h) / sqrt(2) of the box
    const vw = window.innerWidth;
    const h = stageHeight();
    const viewH = Math.min(window.innerHeight, h);
    const r = (p / 100) * (Math.hypot(vw, h) / Math.SQRT2);
    // the text always rides the rim with a fixed breathing gap, and its
    // size grows with the circle up to a hard cap
    const fs = Math.max(14, Math.min(Math.min(46, vw * 0.034), r * 0.052));
    const Rcap = h - viewH * 0.12; // stop following the apex off-screen
    const R = Math.max(1, Math.min(r - 40 - fs, Rcap));
    const cx = vw / 2, cy = h;
    const arcTextEl = $('#arcSvg').querySelector('.arc-text');
    arcTextEl.style.fontSize = fs + 'px';
    const x1 = cx - R * 0.866, y1 = cy - R * 0.5;
    const x2 = cx + R * 0.866, y2 = cy - R * 0.5;
    const svg = $('#arcSvg');
    svg.setAttribute('viewBox', '0 0 ' + vw + ' ' + h);
    $('#arcPath').setAttribute('d',
      'M ' + x1 + ' ' + y1 + ' A ' + R + ' ' + R + ' 0 0 1 ' + x2 + ' ' + y2);
    // in once the circle can carry the line, out as the rim escapes the top
    const fadeIn = Math.min(1, Math.max(0, (r - 320) / 130));
    const fadeOut = p < 108 ? 1 : Math.max(0, 1 - (p - 108) / 22);
    arcTextEl.style.opacity = (fadeIn * fadeOut).toFixed(3);
  }

  function initWipe() {
    // guard: a replayed intro (seek/bfcache) must never create a second pin
    if (window.__wipeTl) {
      if (window.__wipeTl.scrollTrigger) window.__wipeTl.scrollTrigger.kill(true);
      window.__wipeTl.kill();
      window.__wipeTl = null;
    }
    const circle = $('#wipeCircle');
    const proxy = { p: 0 };
    drawArc(0);

    const tl = window.__panTl = window.__wipeTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: '+=600%', // a long, deliberate scroll — the beats should feel earned
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onToggle: (t) => { circle.style.willChange = t.isActive ? 'clip-path' : 'auto'; }
      }
    });

    tl
      .to('#scrollCue', { autoAlpha: 0, duration: 0.25 }, 0)
      // tilt: city down to the skypool — subtly weighted (1.3 screens of
      // scroll for the full tilt, so it resists a touch from the start).
      // exact 42/142 of the box height: anything less leaves a rounding
      // gap of background at the bottom edge when the tilt completes
      .to('#heroPan', { yPercent: -(4200 / 142), ease: 'none', duration: 6 }, 0)
      .to('#heroLine', { autoAlpha: 0, duration: 0.5 }, 0.15)
      // dwell on the pool — the firmest stop, heavier than the tilt
      .to({}, { duration: 3.2 })
      // blue circle floods up, curved text riding its rim
      .to(proxy, {
        p: 150,
        duration: 4.5,
        ease: 'none',
        onUpdate: () => {
          circle.style.clipPath = 'circle(' + proxy.p.toFixed(2) + '% at 50% 100%)';
          drawArc(proxy.p);
        }
      }, 9.2)
      // the big logo drifts up and fades as the blue floods over,
      // and the small header brand takes over
      .to(title, { autoAlpha: 0, y: -50, duration: 0.8, ease: 'power1.in' }, 9.3)
      .to('#headerBrand', { autoAlpha: 1, duration: 0.5 }, 9.9)
      .to({}, { duration: 0.8 }); // settle before unpin

    // "See every angle" rolls in as the reasons header enters the viewport
    // ---- slide one climbs up INTO the blue as the circle rises, then the
    // whole composition HOLDS so it reads without scrolling ----
    tl.fromTo('.rise-centre', { y: 120, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1.5, ease: 'none' }, 10.5)
      .fromTo('.rise-rule', { y: 140, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1.5, ease: 'none' }, 10.8)
      .fromTo('.rise-tag', { y: 160, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1.5, ease: 'none' }, 11.0)
      .fromTo('.rise-headline', { y: () => window.innerHeight * 0.6, autoAlpha: 1 },
        { y: 0, duration: 2.0, ease: 'none' }, 11.0)
      // reading hold (13.0 → 15.6), then the slide hands off upward
      .to('#wipeRise', { autoAlpha: 0, y: -60, duration: 0.9, ease: 'power1.in' }, 15.6);

    // ---- the three reasons play centre-stage, one beat at a time ----
    const beats = $$('.wipe-beat');
    beats.forEach((b) => {
      gsap.set(b.querySelectorAll('.beat-line .char'), {
        rotationX: -90,
        y: 40,
        opacity: 0,
        transformOrigin: '50% 50% -46px'
      });
      gsap.set([b.querySelector('.eyebrow'), b.querySelector('p')], { y: 16 });
    });
    beats.forEach((b, i) => {
      const at = 16.7 + i * 3.0; // after slide one hands off
      tl.to(b.querySelectorAll('.beat-line .char'), {
        rotationX: 0,
        y: 0,
        opacity: 1,
        duration: 1.0,
        stagger: 0.045,
        ease: 'power2.out'
      }, at)
      .to([b.querySelector('.eyebrow'), b.querySelector('p')], {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power1.out'
      }, at + 0.35);
      // each beat exits upward before the next lands; the last one stays
      if (i < beats.length - 1) {
        tl.to(b, { autoAlpha: 0, y: -44, duration: 0.6, ease: 'power1.in' }, at + 2.4);
      }
    });
    tl.to({}, { duration: 1.4 }, '>'); // hold the final beat before unpin

    window.addEventListener('resize', () => drawArc(proxy.p));
  }

  /* ----- scroll reveals ----- */

  let revealsInited = false;
  function initReveals() {
    if (revealsInited) return;
    revealsInited = true;
    $$('[data-reveal]').forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power1.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none'
        }
      });
    });
  }

  initTourPan(false);
})();
