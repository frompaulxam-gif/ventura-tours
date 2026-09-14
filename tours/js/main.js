/* ============================================================
   VENTURA TOURS — v2 choreography
   Act 1 (load): letters rise on charcoal → archway opens on the
     city → title Flip-docks top-centre → header arrives
   Act 2 (scroll): pinned camera tilt down to the skypool → dwell
     → stone circle wipe with curved rim text → releases into
     the stone reasons section
   ============================================================ */

(function () {
  const html = document.documentElement;
  const body = document.body;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function markBootReady() {
    html.dataset.venturaBoot = 'ready';
    window.clearTimeout(window.__venturaFallbackTimer);
  }

  function focusTarget(hash) {
    const target = hash === '#top' ? $('#top') : $(hash);
    if (target) target.focus({ preventScroll: true });
  }

  function moveToTarget(hash, historyMode) {
    const target = hash === '#top' ? $('#top') : $(hash);
    if (!target) return false;
    target.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
    focusTarget(hash);
    const nextUrl = location.pathname + location.search + hash;
    if (historyMode === 'push' && location.hash !== hash) history.pushState(null, '', nextUrl);
    else if (historyMode === 'replace') history.replaceState(null, '', nextUrl);
    return true;
  }

  /* ---------- shared navigation ---------- */

  function initNavigation() {
    const header = $('#header');
    const nav = $('#nav');
    const toggle = $('#navToggle');
    if (!header || !nav || !toggle) return;

    function setOpen(open, returnFocus) {
      nav.classList.toggle('is-open', open);
      header.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      if (!open && returnFocus) toggle.focus();
    }

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('pointerdown', (event) => {
      if (toggle.getAttribute('aria-expanded') === 'true' && !header.contains(event.target)) {
        setOpen(false);
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        event.preventDefault();
        setOpen(false, true);
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 760) setOpen(false);
    });
    window.addEventListener('popstate', () => {
      const hash = /^#(top|tour|process|contact)$/.test(location.hash) ? location.hash : '#top';
      if (html.classList.contains('lock')) {
        window.__venturaPendingTarget = hash;
        window.__venturaPendingHistory = 'none';
        return;
      }
      window.setTimeout(() => moveToTarget(hash, 'none'), 0);
    });

    $$('a[href^="#"]').forEach((link) => {
      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      link.addEventListener('click', (event) => {
        setOpen(false);
        event.preventDefault();
        if (html.classList.contains('lock')) {
          window.__venturaPendingTarget = hash;
          window.__venturaPendingHistory = 'push';
          finishIntroEarly();
        } else {
          moveToTarget(hash, 'push');
        }
      });
    });
  }

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
    if ('scrollRestoration' in history) history.scrollRestoration = 'auto';
    const updateHeader = () => $('#header').classList.toggle('on-content', window.scrollY > 100);
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  /* ---------- boot ---------- */

  const header = $('#header');
  const title = $('#title');
  const heroMedia = $('#heroMedia');
  const heroImg = $('#heroImg');

  const markHeroUnavailable = () => {
    heroMedia.classList.add('is-unavailable');
    heroImg.hidden = true;
  };
  if (heroImg.complete && !heroImg.naturalWidth) markHeroUnavailable();
  else heroImg.addEventListener('error', markHeroUnavailable, { once: true });

  initNavigation();

  if (html.classList.contains('no-js') || !hasGsap || reduced) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', staticInit);
    } else {
      staticInit();
    }
    markBootReady();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  html.classList.add('lock');
  // keep keyboard focus out of the below-fold content during the intro
  const inertSections = $$('main > section:not(#hero), main > footer');
  inertSections.forEach((s) => { s.inert = true; });

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  // Preserve bfcache navigation and the visitor's position; only refresh
  // ScrollTrigger's measurements after a restored page becomes visible.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) window.setTimeout(() => ScrollTrigger.refresh(), 0);
  });
  // a section deep-link would fight the choreography — park it, honour it after
  const deepLink = /^#(top|tour|process|contact)$/.test(location.hash) ? location.hash : null;
  if (deepLink) history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo({ top: 0, behavior: 'instant' });

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
  const timeout = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const readiness = [document.fonts
    ? Promise.race([document.fonts.ready, timeout(1800)])
    : Promise.resolve()];
  readiness.push(new Promise((res) => {
    const settle = () => Promise.race([
      heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve(),
      timeout(1500)
    ]).then(res);
    if (heroImg.complete) settle();
    else {
      heroImg.addEventListener('load', settle, { once: true });
      heroImg.addEventListener('error', res, { once: true });
    }
  }));
  Promise.race([Promise.all(readiness), timeout(2200)]).then(() => {
    heroReady = true;
    if (!introFinished && intro.paused()) intro.play();
  });

  /* ----- Act 1: letters rise, arch opens, title Flip-docks ----- */

  let introFinished = false;
  const introInputs = new AbortController();

  // One synchronous handover owns final styles, pin creation and unlock.
  // No delayed callback can reset scroll or create a second pin later.
  function completeIntro() {
    if (introFinished) return;
    introFinished = true;
    introInputs.abort();
    title.classList.add('docked');
    gsap.set(title, { clearProps: 'top,width', autoAlpha: 1, x: 0, y: 0, xPercent: -50, yPercent: -50, scale: 1 });
    gsap.set(heroMedia, { opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 0vw 0vw 0vw 0vw)', clearProps: 'willChange' });
    gsap.set(heroImg, { scale: 1 });
    gsap.set('.arch-label', { autoAlpha: 0 });
    gsap.set('#heroLine, #scrollCue, .hero-cta', { autoAlpha: 1 });
    $('#hero').classList.add('is-revealed');
    header.classList.add('blend');
    $('#skipIntro').hidden = true;

    // scrollbar-gutter reserves width; unlock and measure in this same task.
    html.classList.remove('lock');
    body.classList.add('intro-complete');
    inertSections.forEach((section) => { section.inert = false; });
    initWipe();
    initReveals();
    ScrollTrigger.refresh();
    header.classList.add('ready');
    if ('scrollRestoration' in history) history.scrollRestoration = 'auto';
    const requestedTarget = window.__venturaPendingTarget || deepLink;
    if (requestedTarget) {
      const target = $(requestedTarget);
      if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
        focusTarget(requestedTarget);
        const mode = window.__venturaPendingHistory;
        if (mode === 'push') history.pushState(null, '', requestedTarget);
        else if (mode !== 'none') history.replaceState(null, '', requestedTarget);
      }
      window.__venturaPendingTarget = null;
      window.__venturaPendingHistory = null;
    }
    driftHero();
  }

  function finishIntroEarly() {
    if (introFinished) return;
    // Suppress timeline callbacks, including the asset pause, then settle once.
    intro.totalProgress(1, true).pause();
    completeIntro();
  }

  const intro = window.__introTl = window.__revealTl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete: completeIntro
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
    .to(title, { top: narrowScreen ? '24svh' : '16.5vh', width: narrowScreen ? 'min(78vw, 360px)' : 'clamp(460px, 46vw, 860px)', duration: 1.2, ease: 'power3.inOut' }, 'reveal+=2.4')
    .add(() => header.classList.add('blend'), 'reveal+=2.55')
    .to('#heroLine', { autoAlpha: 1, duration: 0.9, ease: 'power1.out' }, 'reveal+=3.55')
    .to('#scrollCue', { autoAlpha: 1, duration: 0.8, ease: 'power1.out' }, 'reveal+=3.75');

  // Keep the full choreography on small screens without delaying the main
  // visual for several seconds on mobile connections.
  intro.timeScale(narrowScreen ? 1.9 : 1.3);
  const inputOptions = { signal: introInputs.signal };
  window.addEventListener('wheel', (event) => {
    if (event.ctrlKey || Math.abs(event.deltaY) < 2) return;
    event.preventDefault();
    finishIntroEarly();
  }, { ...inputOptions, passive: false });
  let touchY = null;
  window.addEventListener('touchstart', (event) => {
    touchY = event.touches[0]?.clientY;
  }, { ...inputOptions, passive: true });
  window.addEventListener('touchmove', (event) => {
    if (touchY === null || Math.abs(event.touches[0].clientY - touchY) < 8) return;
    event.preventDefault();
    finishIntroEarly();
  }, { ...inputOptions, passive: false });
  window.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'PageDown', 'End', ' ', 'Escape'].includes(event.key)) {
      event.preventDefault();
      finishIntroEarly();
    }
  }, inputOptions);
  window.addEventListener('resize', finishIntroEarly, inputOptions);
  $('#skipIntro').addEventListener('click', () => {
    finishIntroEarly();
    $('#nav a').focus({ preventScroll: true });
  }, inputOptions);


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
        end: () => '+=' + stageHeight() * (window.innerWidth < 760 ? 3.8 : 4.6),
        scrub: 0.55,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onToggle: (t) => { circle.style.willChange = t.isActive ? 'clip-path' : 'auto'; },
        onUpdate: (t) => { header.classList.toggle('on-content', t.progress > 0.38); }
      }
    });

    tl
      .to('#scrollCue', { autoAlpha: 0, duration: 0.25 }, 0)
      // tilt: city down to the skypool — subtly weighted (1.3 screens of
      // scroll for the full tilt, so it resists a touch from the start).
      // exact 42/142 of the box height: anything less leaves a rounding
      // gap of background at the bottom edge when the tilt completes
      .to('#heroPan', { yPercent: -(4200 / 142), ease: 'none', duration: 6 }, 0)
      .to('#heroLine, .hero-cta', { autoAlpha: 0, duration: 0.5 }, 0.15)
      // dwell on the pool — the firmest stop, heavier than the tilt
      .to({}, { duration: 3.2 })
      // stone circle floods up, curved text riding its rim
      .to(proxy, {
        p: 150,
        duration: 4.5,
        ease: 'none',
        onUpdate: () => {
          circle.style.clipPath = 'circle(' + proxy.p.toFixed(2) + '% at 50% 100%)';
          drawArc(proxy.p);
        }
      }, 9.2)
      // the big logo drifts up and fades as the stone floods over,
      // and the small header brand takes over
      .to(title, { autoAlpha: 0, y: -50, duration: 0.8, ease: 'power1.in' }, 9.3)
      .to('#headerBrand', { autoAlpha: 1, duration: 0.5 }, 9.9)
      .to({}, { duration: 0.8 }); // settle before unpin

    // "See every angle" rolls in as the reasons header enters the viewport
    // ---- slide one climbs up INTO the stone as the circle rises, then the
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

  markBootReady();
  if (deepLink) finishIntroEarly();
})();
