(() => {
  const deadline = document.querySelector('[data-deadline]');
  if (!deadline) return;
  // One fixed deadline shared by every visitor. Reloading never extends it.
  const endsAt = Date.parse(deadline.dataset.deadline);
  const timer = document.querySelector('#offer-countdown');
  const label = document.querySelector('#deadline-label');
  let interval;
  let expired = false;
  function update() {
    const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    if (!remaining) {
      clearInterval(interval);
      if (expired) return;
      expired = true;
      label.textContent = 'The free offer has ended';
      timer.textContent = 'Offer ended';
      document.querySelector('#build-price').textContent = '£20';
      document.querySelector('.package-build del').hidden = true;
      document.querySelector('#build-badge').textContent = 'WEBSITE BUILD';
      document.querySelector('.package-build .package-number').textContent = '01 / THE BUILD';
      document.querySelector('#build-description').textContent = 'A website designed for your business.';
      document.querySelector('#build-caption').textContent = 'One-off design and build.';
      document.querySelectorAll('.intro-feature').forEach(item => item.hidden = true);
      document.querySelector('#build-note').textContent = 'Choose monthly or yearly hosting and maintenance alongside your website build.';
      document.querySelectorAll('.plan-start').forEach(item => item.textContent = 'Hosting and maintenance for your website.');
      const cta = document.querySelector('#build-cta');
      cta.innerHTML = 'Let’s talk about your website <span class="button-chevron" aria-hidden="true"></span>';
      cta.href = 'mailto:frompaulxam@gmail.com?subject=Website%20design%20and%20build';
      document.querySelector('#package-summary').innerHTML = '<strong>Website build: £20.</strong><br>Choose £20/month or £150/year for hosting and maintenance.';
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
