const players = [...document.querySelectorAll('video')];
const sample = document.querySelector('#sample-film');
const soundButton = document.querySelector('.play-sound');

players.forEach((player) => {
  player.defaultMuted = false;
  player.muted = false;
  player.volume = 1;
  player.addEventListener('play', () => {
    player.muted = false;
    player.volume = 1;
    players.forEach((other) => {
      if (other !== player) other.pause();
    });
  });
  player.addEventListener('error', () => {
    const message = player.closest('figure').querySelector('.video-error');
    message.hidden = false;
  });
});

if (sample && soundButton) {
  soundButton.addEventListener('click', () => {
    if (sample.ended) sample.currentTime = 0;
    sample.muted = false;
    sample.volume = 1;
    sample.play().catch(() => { soundButton.hidden = false; });
  });
  sample.addEventListener('playing', () => { soundButton.hidden = true; });
  sample.addEventListener('pause', () => { soundButton.hidden = false; });
  sample.addEventListener('ended', () => {
    soundButton.textContent = 'Replay with sound';
    soundButton.hidden = false;
  });
  // Try audible autoplay. If the browser requires a gesture, keep the sound button.
  // Never fall back to muted playback.
  sample.play().catch(() => { soundButton.hidden = false; });
}
