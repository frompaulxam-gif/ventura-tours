const player = document.querySelector('audio');
const pads = [...document.querySelectorAll('button')];
const status = document.querySelector('#play-status');
let activePad;
let request = 0;

function clearPad() {
  activePad?.removeAttribute('data-playing');
  activePad = null;
}

async function play(pad) {
  const current = ++request;
  const name = pad.textContent;
  status.textContent = '';
  player.pause();
  clearPad();
  activePad = pad;
  pad.setAttribute('data-playing', '');
  try {
    if (player.dataset.clip === name && !player.error) player.currentTime = 0;
    else {
      player.src = clips[name];
      player.dataset.clip = name;
    }
    await player.play();
  } catch {
    if (current !== request) return;
    clearPad();
    status.textContent = 'Couldn’t play ' + name + '. Tap to try again.';
  }
}

pads.forEach(pad => pad.addEventListener('click', () => play(pad)));
player.addEventListener('ended', () => { if (player.ended) clearPad(); });
document.addEventListener('keydown', event => {
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
  const pad = pads.find(item => item.getAttribute('aria-keyshortcuts') === event.key);
  if (pad) { event.preventDefault(); pad.click(); }
});
window.addEventListener('pagehide', () => { ++request; player.pause(); clearPad(); });
const offline = document.querySelector('#offline');
async function prepareOffline() {
  try {
    const registration = await navigator.serviceWorker.register('./sw.js');
    const worker = registration.installing;
    if (worker) worker.addEventListener('statechange', () => {
      if (worker.state === 'redundant' && !registration.active) offline.textContent = 'Open online again to save the sounds.';
    });
    await navigator.serviceWorker.ready;
    offline.textContent = 'Ready offline';
  } catch {
    offline.textContent = 'Offline storage unavailable';
  }
}
prepareOffline();
