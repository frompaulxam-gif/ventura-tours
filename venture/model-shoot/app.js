const videos = [...document.querySelectorAll('video')];
videos.forEach(video => {
  video.addEventListener('play', () => videos.forEach(other => { if (other !== video) other.pause(); }));
  video.addEventListener('error', () => { video.closest('figure').querySelector('.video-error').hidden = false; });
});
