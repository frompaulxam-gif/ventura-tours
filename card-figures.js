/* Illustrative scenario; the assumptions are disclosed beneath the cards. */
(() => {
  const enquiriesPerDay = 20;
  const workingDays = 22;
  const minutesSavedPerEnquiry = 3;
  const bookingRequestRate = 0.05;
  const monthlyEnquiries = enquiriesPerDay * workingDays;
  const figures = [
    { value: monthlyEnquiries * minutesSavedPerEnquiry / 60, suffix: 'h', label: 'TIME SAVED' },
    { value: 100, suffix: '%', label: 'ENQUIRIES HANDLED' },
    { value: bookingRequestRate * 100, suffix: '%', label: 'BOOKING REQUEST RATE' },
    { value: 1, label: 'WORKFLOW TO START' }
  ];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const counters = [];
  document.querySelectorAll('.art-section .art-card').forEach((card, index) => {
    const figure = figures[index];
    if (!figure || !Number.isFinite(figure.value)) return;
    const stat = document.createElement('div');
    stat.className = 'card-stat';
    const value = document.createElement('span');
    value.className = 'card-stat-value';
    value.setAttribute('aria-hidden', 'true');
    const caption = document.createElement('span');
    caption.className = 'card-stat-caption';
    caption.textContent = figure.label;
    const format = n => `${figure.prefix || ''}${n.toLocaleString('en-GB', { maximumFractionDigits: figure.decimals || 0 })}${figure.suffix || ''}`;
    stat.setAttribute('role', 'img');
    stat.setAttribute('aria-label', `${format(figure.value)} ${figure.label}`);
    stat.append(value, caption);
    card.insertBefore(stat, card.querySelector('.card-copy'));
    value.textContent = format(figure.value);
    counters.push({ card, value, figure, format, frame: 0, finished: false });
  });
  function finish(counter) {
    cancelAnimationFrame(counter.frame);
    counter.value.textContent = counter.format(counter.figure.value);
    counter.finished = true;
  }
  function animate(counter) {
    if (counter.finished) return;
    if (reduce.matches) return finish(counter);
    let start;
    counter.value.textContent = counter.format(0);
    function tick(now) {
      if (start === undefined) start = now;
      const progress = Math.min((now - start) / 1400, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const precision = 10 ** (counter.figure.decimals || 0);
      const amount = Math.floor(eased * counter.figure.value * precision) / precision;
      counter.value.textContent = counter.format(amount);
      if (progress < 1) counter.frame = requestAnimationFrame(tick);
      else finish(counter);
    }
    counter.frame = requestAnimationFrame(tick);
  }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const counter = counters.find(c => c.card === entry.target);
    if (counter) animate(counter);
    observer.unobserve(entry.target);
  }), { threshold: 0.6 });
  counters.forEach(counter => observer.observe(counter.card));
  reduce.addEventListener('change', () => {
    if (reduce.matches) counters.forEach(finish);
  });
})();
