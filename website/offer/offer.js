(() => {
  const deadline = document.querySelector('[data-deadline]');
  if (!deadline) return;
  // One fixed deadline shared by every visitor. Reloading never extends it.
  const endsAt = Date.parse(deadline.dataset.deadline);
  const timer = document.querySelector('#offer-countdown');
  const label = document.querySelector('#deadline-label');
  let interval;
  function update() {
    const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    if (!remaining) {
      clearInterval(interval);
      label.textContent = 'The free build offer has ended';
      timer.textContent = 'Offer ended';
      document.querySelector('#build-price').textContent = '£20';
      document.querySelector('.package-build del').hidden = true;
      document.querySelector('.package-build .package-description').textContent = 'Website design and build for £20. Get in touch to discuss your website.';
      document.querySelector('#package-summary').innerHTML = 'Website build: £20.<br>Then choose monthly or yearly hosting &amp; maintenance.';
      return;
    }
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;
    timer.textContent = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }
  interval = window.setInterval(update, 1000);
  update();
  document.addEventListener('visibilitychange', update);
})();
