const players = [...document.querySelectorAll('video')];
players.forEach((player) => {
  player.addEventListener('play', () => players.forEach((other) => {
    if (other !== player) other.pause();
  }));
  player.addEventListener('error', () => {
    const message = player.closest('figure').querySelector('.video-error');
    message.hidden = false;
  });
});
