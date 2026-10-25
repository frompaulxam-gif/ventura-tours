'use strict';
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const dishes = {"sakura-roll": ["Sakura Roll", "Sushi sets"], "gold-roll": ["Gold Roll", "Sushi sets"], "vegetable-roll": ["Vegetable Roll", "Sushi sets"], "chicken-bento": ["Chicken Katsu Bento", "Bento boxes"], "teriyaki-bento": ["Teriyaki Chicken Bento", "Bento boxes"], "tempura-bento": ["Vegetable Tempura Bento", "Bento boxes"], "chicken-curry": ["Chicken Katsu Curry", "Rice & noodles"], "tonkotsu": ["Tonkotsu Ramen Pork", "Rice & noodles"], "beef-ramen": ["Japanese Style Beef Ramen", "Rice & noodles"], "edamame": ["Edamame", "Starters"], "gyoza": ["Chicken Gyoza", "Starters"], "tempura": ["Ebi Tempura", "Starters"]};
  let category = 'all'; const note = new Map();
  const say = text => { $('#note-status').textContent = text; };
  const invalidate = () => { $('#copy-fallback').hidden = true; $('#copy-fallback').value = ''; say('Note updated. Copy it again when you’re ready.'); };
  function filter() {
    const term = $('#search').value.trim().toLocaleLowerCase(); let count = 0;
    $$('[data-dish]').forEach(card => { card.hidden = !(card.dataset.search.includes(term) && (category === 'all' || category === card.dataset.category)); if (!card.hidden) count++; });
    $('#menu-count').textContent = count + (count === 1 ? ' dish in this selection' : ' dishes in this selection'); $('#no-results').hidden = count > 0;
  }
  $('#search').addEventListener('input', filter);
  $$('[data-filter]').forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; $$('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); filter(); }));
  $('#reset-search').addEventListener('click', () => { category = 'all'; $('#search').value = ''; $$('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === 'all'))); filter(); $('#search').focus(); });
  function renderNote() {
    const list = $('#note-items'); list.replaceChildren(); let units = 0;
    note.forEach((row, key) => {
      units += row.quantity;
      const li = document.createElement('li'); li.className = 'note-row';
      const strong = document.createElement('strong'); strong.textContent = dishes[row.id][0];
      const sub = document.createElement('small'); sub.textContent = dishes[row.id][1];
      const controls = document.createElement('div'); controls.className = 'row-controls';
      const label = document.createElement('label'); label.textContent = 'Quantity';
      const input = document.createElement('input'); input.type = 'number'; input.min = '1'; input.max = '10'; input.step = '1'; input.value = row.valid === false ? row.raw : row.quantity; if (row.valid === false) input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-label', 'Quantity of ' + dishes[row.id][0]);
      input.addEventListener('input', () => {
        const n = Number(input.value); const valid = input.value.trim() !== '' && Number.isInteger(n) && n >= 1 && n <= 10;
        input.setAttribute('aria-invalid', String(!valid)); row.valid = valid; row.raw = input.value;
        if (valid) { row.quantity = n; $('#note-count').textContent = [...note.values()].reduce((sum, item) => sum + item.quantity, 0); }
        invalidate(); if (!valid) say('Use a whole quantity from 1 to 10 before copying.');
      });
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove'; remove.setAttribute('aria-label', 'Remove ' + dishes[row.id][0]);
      remove.addEventListener('click', () => { note.delete(key); renderNote(); invalidate(); $('#copy-note').focus(); });
      label.append(input); controls.append(label, remove); li.append(strong, sub, controls); list.append(li);
    });
    $('#empty-note').hidden = note.size > 0; $('#note-count').textContent = units;
  }
  $$('[data-add]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.add, key = id;
    const existing = note.get(key);
    if ([...note.values()].some(row => !row.valid)) { say('Fix the highlighted quantity in your note first.'); $('#meal').scrollIntoView({ block: 'start' }); return; }
    if (existing?.quantity >= 10) { say('This item is already at the note limit of 10.'); return; }
    if (existing) existing.quantity++; else note.set(key, { id, quantity: 1, valid: true });
    renderNote(); invalidate(); say(dishes[id][0] + ' added to your note.');
  }));
  $('#meal-context').addEventListener('input', invalidate);
  $('#clear-note').addEventListener('click', () => { note.clear(); $('#meal-context').value = ''; renderNote(); invalidate(); say('Meal note cleared.'); });
  $('#copy-note').addEventListener('click', async () => {
    if (!note.size) { say('Add a dish before copying your meal note.'); return; }
    if ([...note.values()].some(row => !row.valid)) { say('Use a whole quantity from 1 to 10 before copying.'); $('#note-items input[aria-invalid="true"]')?.focus(); return; }
    const text = 'Sakura · my meal shortlist\n80–84 High Street, Leicester LE1 5YP\n\n' + [...note.values()].map(row => row.quantity + ' × ' + dishes[row.id][0] + ' — ' + dishes[row.id][1]).join('\n') + ($('#meal-context').value.trim() ? '\n\nRemember: ' + $('#meal-context').value.trim() : '') + '\n\nPlanning note only. Check current prices, ingredients, allergies and availability with the restaurant/provider. This is not an order.';
    try { if (!navigator.clipboard?.writeText) throw new Error('unavailable'); await navigator.clipboard.writeText(text); say('Meal note copied. Nothing has been sent to the restaurant.'); }
    catch { const field = $('#copy-fallback'); field.value = text; field.hidden = false; field.focus(); field.select(); say('Select and copy your meal note below.'); }
  });
  // Native modal supplies focus containment. Every close clears transient email text.
  const dialog = $('#news-dialog'), email = $('#news-email'); let returnFocus = null, dialogOpen = false;
  const safeSession = { get(key) { try { return sessionStorage.getItem(key); } catch { return 'skip'; } }, set(key, value) { try { sessionStorage.setItem(key, value); } catch {} } };
  function clearNews() { email.value = ''; email.removeAttribute('aria-invalid'); $('#news-status').textContent = ''; }
  function openNews(trigger) {
    if (dialogOpen || typeof dialog.showModal !== 'function') return;
    returnFocus = trigger || document.activeElement; clearNews(); dialog.showModal(); dialogOpen = true; safeSession.set('sakura:news-seen', '1'); email.focus();
  }
  $('#open-news').addEventListener('click', event => openNews(event.currentTarget));
  $('#close-news').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { clearNews(); dialogOpen = false; returnFocus?.focus(); });
  $('#news-clear').addEventListener('click', () => { clearNews(); email.focus(); });
  function submitNews() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { email.setAttribute('aria-invalid', 'true'); $('#news-status').textContent = 'Enter an email address such as you@example.com to try this demo.'; email.focus(); return; }
    email.value = ''; email.removeAttribute('aria-invalid'); $('#news-status').textContent = 'Demo complete. The address was cleared. You have not been subscribed.'; email.focus();
  }
  $('#news-submit').addEventListener('click', submitNews);
  email.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); submitNews(); } });
  email.addEventListener('input', () => { email.removeAttribute('aria-invalid'); $('#news-status').textContent = ''; });
  let lastAction = Date.now(); ['pointerdown', 'keydown', 'input', 'scroll'].forEach(name => document.addEventListener(name, () => { lastAction = Date.now(); }, { passive: true }));
  const started = Date.now();
  const autoTimer = setInterval(() => {
    if (safeSession.get('sakura:news-seen')) { clearInterval(autoTimer); return; }
    const pageTravel = document.documentElement.scrollHeight - innerHeight, active = document.activeElement;
    const mealRect = $('#meal').getBoundingClientRect();
    if (Date.now() - started < 20000 || Date.now() - lastAction < 5000 || pageTravel <= 0 || scrollY / pageTravel < .3 || dialogOpen || document.visibilityState !== 'visible' || /INPUT|TEXTAREA|SELECT/.test(active?.tagName || '') || (mealRect.top < innerHeight && mealRect.bottom > 0) || $('#brand-window').classList.contains('intro-play')) return;
    openNews($('#open-news')); clearInterval(autoTimer);
  }, 1000);
  // Intro is confined to the original header image and bounded by actual layout measurements.
  const mark = $('#brand-window'), sourceImage = $('#brand-source'), introKey = 'sakura:intro-seen'; let introTimer;
  function stopIntro() { mark.classList.remove('intro-play'); clearTimeout(introTimer); }
  function intro() {
    if (location.hash || safeSession.get(introKey) || matchMedia('(prefers-reduced-motion: reduce)').matches || !sourceImage.naturalWidth) return;
    const m = mark.getBoundingClientRect(), h = $('#header').getBoundingClientRect(), n = $('nav').getBoundingClientRect();
    if (m.left < h.left || m.right > h.right || m.top < h.top || m.bottom + 6 > h.bottom || m.right > innerWidth || (n.top < m.bottom && n.left < m.right && n.right > m.left)) return;
    safeSession.set(introKey, '1'); mark.classList.add('intro-play'); introTimer = setTimeout(stopIntro, 800);
  }
  sourceImage.addEventListener('error', stopIntro); mark.addEventListener('animationend', stopIntro); window.addEventListener('resize', stopIntro); window.addEventListener('hashchange', stopIntro);
  if (sourceImage.complete) requestAnimationFrame(intro); else sourceImage.addEventListener('load', intro, { once: true });
})();
