document.getElementById('year').textContent = new Date().getFullYear();
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const intro = document.querySelector('#intro');
const greeting = intro.querySelector('.greeting');
const main = document.querySelector('main');
const skipLink = document.querySelector('.skip-link');
const replay = document.querySelector('.replay-intro');
const isOfferRoute = /\/offer(?:\/index\.html)?\/?$/.test(window.location.pathname);
const isOfferArrival = (isOfferRoute && !window.location.hash) || window.location.hash === '#offer';
const previousScrollRestoration = history.scrollRestoration;
let offerPending = isOfferArrival;
let offerTimer;
let timers = [];
let restoreFocus = false;
function cancelOfferScroll() {
  if (!offerPending) return;
  offerPending = false;
  window.clearTimeout(offerTimer);
  history.scrollRestoration = previousScrollRestoration;
}
function scheduleOfferScroll(immediate) {
  if (!offerPending) return;
  window.clearTimeout(offerTimer);
  offerTimer = window.setTimeout(() => {
    cancelOfferScroll();
    const offer = document.querySelector('#offer');
    offer.scrollIntoView({ behavior: reduceMotion.matches ? 'instant' : 'smooth', block: 'start' });
    offer.focus({ preventScroll: true });
  }, immediate ? 0 : 1750); // 850ms curtain reveal, then 900ms to see the homepage.
}
function clearTimers() {
  timers.forEach(window.clearTimeout);
  timers = [];
}
function finishIntro(immediate = false) {
  restoreFocus = restoreFocus || intro.contains(document.activeElement);
  clearTimers();
  document.body.classList.remove('intro-running');
  main.inert = false;
  skipLink.removeAttribute('tabindex');
  if (immediate || reduceMotion.matches) {
    intro.hidden = true;
    intro.classList.remove('leaving');
  } else {
    intro.classList.add('leaving');
    timers.push(window.setTimeout(() => { intro.hidden = true; intro.classList.remove('leaving'); }, 850));
  }
  if (restoreFocus) { document.querySelector('.wordmark').focus({ preventScroll: true }); restoreFocus = false; }
  scheduleOfferScroll(immediate || reduceMotion.matches);
}
function playIntro(fromButton = false) {
  if (fromButton) cancelOfferScroll();
  if (reduceMotion.matches) return;
  clearTimers();
  restoreFocus = fromButton;
  if (fromButton) window.scrollTo({ top: 0, behavior: 'instant' });
  intro.hidden = false;
  intro.classList.remove('leaving');
  greeting.textContent = 'Hello';
  document.body.classList.add('intro-running');
  main.inert = true;
  skipLink.setAttribute('tabindex', '-1');
  if (fromButton) intro.querySelector('button').focus({ preventScroll: true });
  const sequence = [['Kumusta', 500], ['Bonjour', 750], ['Hola', 990], ['Ciao', 1210], ['こんにちは', 1430], ['Hello', 1700]];
  sequence.forEach(([word, at]) => timers.push(window.setTimeout(() => { greeting.textContent = word; }, at)));
  timers.push(window.setTimeout(() => finishIntro(), 2220));
}
intro.querySelector('.skip-intro').addEventListener('click', () => { restoreFocus = true; finishIntro(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !intro.hidden) finishIntro(true); });
replay.addEventListener('click', () => playIntro(true));
reduceMotion.addEventListener('change', event => { if (event.matches) finishIntro(true); replay.hidden = event.matches; });
replay.hidden = reduceMotion.matches;
if (isOfferArrival) {
  // Start at the portrait even when this URL is reloaded from the offer section.
  history.scrollRestoration = 'manual';
  window.scrollTo({ top: 0, behavior: 'instant' });
  window.addEventListener('pageshow', () => {
    if (reduceMotion.matches && offerPending) scheduleOfferScroll(true);
    else if (offerPending) window.scrollTo({ top: 0, behavior: 'instant' });
  }, { once: true });
  // Respect visitors who choose to explore before the automatic scroll begins.
  const cancelOnManualScroll = () => { if (!main.inert) cancelOfferScroll(); };
  window.addEventListener('wheel', cancelOnManualScroll, { passive: true });
  window.addEventListener('touchmove', cancelOnManualScroll, { passive: true });
  document.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) cancelOnManualScroll();
  });
  document.addEventListener('click', event => {
    if (event.target.closest('a')) cancelOfferScroll();
  });
}
if (reduceMotion.matches && isOfferArrival) {
  if (document.readyState === 'complete') finishIntro(true);
  // Otherwise pageshow above opens the offer without motion or a waiting period.
} else playIntro();

const previewDialog = document.querySelector('.preview-dialog');
const dialogImage = previewDialog.querySelector('.preview-dialog-image');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const galleries = [];
let dialogGallery = null;
let dialogIndex = 0;
let dialogRequest = 0;
let previewTrigger = null;
const twoDigits = number => String(number).padStart(2, '0');

async function loadFrame(frame) {
  if (!frame.getAttribute('src')) frame.src = frame.dataset.src;
  frame.loading = 'eager';
  try { await frame.decode(); return true; } catch { return frame.complete && frame.naturalWidth > 0; }
}

async function showDialogFrame(index, announce = false) {
  const request = ++dialogRequest;
  const gallery = dialogGallery;
  index = (index + gallery.frames.length) % gallery.frames.length;
  const frame = gallery.frames[index];
  if (!await loadFrame(frame) || request !== dialogRequest || !previewDialog.open) return;
  dialogIndex = index;
  dialogImage.src = frame.src;
  dialogImage.alt = frame.alt;
  previewDialog.querySelector('.preview-dialog-stage').scrollTop = 0;
  previewDialog.querySelector('.preview-dialog-label').textContent = frame.dataset.label;
  previewDialog.querySelector('.preview-dialog-count').textContent = `${twoDigits(index + 1)} / ${twoDigits(gallery.frames.length)}`;
  if (announce) previewDialog.querySelector('.preview-announcement').textContent = `${frame.dataset.label}, ${index + 1} of ${gallery.frames.length}`;
}

function openPreview(gallery, trigger) {
  galleries.forEach(item => item.stop());
  dialogGallery = gallery;
  dialogIndex = gallery.index;
  previewTrigger = trigger;
  const frame = gallery.frames[gallery.index];
  previewDialog.querySelector('.preview-dialog-stage').classList.remove('is-zoomed');
  previewDialog.querySelector('.preview-zoom').textContent = 'Zoom in';
  previewDialog.querySelector('.preview-zoom').setAttribute('aria-pressed', 'false');
  dialogImage.src = frame.src;
  dialogImage.alt = frame.alt;
  previewDialog.querySelector('.preview-dialog-stage').scrollTop = 0;
  previewDialog.querySelector('#preview-title').textContent = gallery.element.dataset.projectName;
  previewDialog.querySelector('.preview-website').href = gallery.element.dataset.url;
  previewDialog.querySelector('.preview-dialog-label').textContent = frame.dataset.label;
  previewDialog.querySelector('.preview-dialog-count').textContent = `${twoDigits(gallery.index + 1)} / ${twoDigits(gallery.frames.length)}`;
  previewDialog.querySelector('.preview-announcement').textContent = '';
  document.body.classList.add('project-preview-open');
  previewDialog.showModal();
  gallery.frames.forEach(loadFrame);
}

document.querySelectorAll('.project').forEach(element => {
  const frames = [...element.querySelectorAll('.preview-frame')];
  const cover = element.querySelector('.project-cover');
  const video = element.querySelector('.preview-video');
  const playButton = element.querySelector('.preview-play');
  const label = element.querySelector('.preview-label');
  let hoverTimer;
  let playRequest = 0;
  let wantsPlay = false;
  let request = 0;
  const gallery = {
    element, frames, index: 0,
    stop() {
      window.clearTimeout(hoverTimer);
      playRequest++;
      wantsPlay = false;
      video.pause();
      element.classList.remove('is-playing', 'is-loading-preview');
      playButton.setAttribute('aria-pressed', 'false');
      playButton.setAttribute('aria-label', `Play ${element.dataset.projectName} animation`);
      playButton.title = 'Play preview';
      playButton.firstElementChild.textContent = '▶';
      label.textContent = frames[gallery.index].dataset.label;
      if (video.readyState > 0) video.currentTime = 0;
    },
    async play(manual = false) {
      if (document.hidden || previewDialog.open || (!manual && !canAutoPlay())) return;
      galleries.forEach(item => item.stop());
      wantsPlay = true;
      const currentRequest = ++playRequest;
      label.removeAttribute('aria-live');
      element.classList.add('is-loading-preview');
      label.textContent = 'Loading animation…';
      if (!video.getAttribute('src')) {
        video.src = video.dataset.src;
        video.load();
      }
      video.muted = true;
      if (video.readyState > 0) video.currentTime = 0;
      try {
        await video.play();
        if (currentRequest !== playRequest || !wantsPlay) return;
        element.classList.remove('is-loading-preview');
        element.classList.add('is-playing');
        label.textContent = video.dataset.label || 'Opening animation';
        playButton.setAttribute('aria-pressed', 'true');
        playButton.setAttribute('aria-label', `Pause ${element.dataset.projectName} animation`);
        playButton.title = 'Pause animation';
        playButton.firstElementChild.textContent = 'Ⅱ';
      } catch {
        if (currentRequest === playRequest) gallery.stop();
      }
    },
    async show(index, userInitiated = false) {
      const currentRequest = ++request;
      gallery.stop();
      index = (index + frames.length) % frames.length;
      if (!await loadFrame(frames[index]) || currentRequest !== request) return;
      gallery.index = index;
      frames.forEach((frame, i) => {
        frame.classList.toggle('is-active', i === index);
        frame.setAttribute('aria-hidden', String(i !== index));
      });
      label.textContent = frames[index].dataset.label;
      element.querySelector('.preview-count').textContent = `${twoDigits(index + 1)} / ${twoDigits(frames.length)}`;
      if (userInitiated) label.setAttribute('aria-live', 'polite');
    }
  };
  const canAutoPlay = () => finePointer.matches && !reduceMotion.matches && !navigator.connection?.saveData;
  cover.addEventListener('pointerenter', () => {
    if (canAutoPlay()) hoverTimer = window.setTimeout(() => gallery.play(), 180);
  });
  cover.addEventListener('pointerleave', () => gallery.stop());
  playButton.addEventListener('click', () => wantsPlay ? gallery.stop() : gallery.play(true));
  for (const [selector, step] of [['.preview-prev', -1], ['.preview-next', 1]]) {
    element.querySelector(selector).addEventListener('click', () => gallery.show(gallery.index + step, true));
  }
  cover.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    openPreview(gallery, cover);
  });
  video.addEventListener('error', () => gallery.stop());
  galleries.push(gallery);
});

// Stop off-screen clips, including ones started with touch or keyboard.
const previewVisibility = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) galleries.find(gallery => gallery.element === entry.target)?.stop();
  });
}, { threshold: 0 });
galleries.forEach(gallery => previewVisibility.observe(gallery.element));

previewDialog.querySelector('.preview-close').addEventListener('click', () => previewDialog.close());
previewDialog.querySelector('.dialog-prev').addEventListener('click', () => showDialogFrame(dialogIndex - 1, true));
previewDialog.querySelector('.dialog-next').addEventListener('click', () => showDialogFrame(dialogIndex + 1, true));
previewDialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showDialogFrame(dialogIndex + (event.key === 'ArrowRight' ? 1 : -1), true);
  }
});
previewDialog.addEventListener('click', event => { if (event.target === previewDialog) previewDialog.close(); });
previewDialog.addEventListener('close', () => {
  dialogRequest++;
  document.body.classList.remove('project-preview-open');
  previewTrigger?.focus({ preventScroll: true });
});
const stopPreviews = () => galleries.forEach(gallery => gallery.stop());
document.addEventListener('visibilitychange', stopPreviews);
reduceMotion.addEventListener('change', stopPreviews);

previewDialog.querySelector('.preview-zoom').addEventListener('click', event => {
  const stage = previewDialog.querySelector('.preview-dialog-stage');
  const zoomed = stage.classList.toggle('is-zoomed');
  event.currentTarget.textContent = zoomed ? 'Zoom out' : 'Zoom in';
  event.currentTarget.setAttribute('aria-pressed', String(zoomed));
  stage.scrollTop = 0;
});
