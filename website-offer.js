(() => {
  const popup = document.querySelector('.website-offer-popup');
  if (!popup || typeof popup.showModal !== 'function') return;
  const key = 'ventura-website-offer-seen-v1';
  try { if (sessionStorage.getItem(key)) return; } catch { /* Still works with storage disabled. */ }

  popup.querySelector('.website-offer-close').addEventListener('click', () => popup.close());
  let backdropPress = false;
  const outside = event => {
    const rect = popup.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  popup.addEventListener('pointerdown', event => { backdropPress = event.target === popup && outside(event); });
  popup.addEventListener('click', event => {
    if (backdropPress && event.target === popup && outside(event)) popup.close();
    backdropPress = false;
  });

  const show = () => {
    // Let a visitor finish typing or close another dialog before presenting the offer.
    if (document.hidden || document.querySelector('dialog[open]') || document.activeElement?.matches('input, textarea, select, [contenteditable="true"]')) {
      window.setTimeout(show, 1000);
      return;
    }
    popup.showModal();
    try { sessionStorage.setItem(key, '1'); } catch { /* Storage is optional. */ }
  };
  window.setTimeout(show, 5000);
})();
