'use strict';
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const dialog = $('#signup-dialog'), started = Date.now();
  let lastActivity = started, intro = false, opener = null, filter = 'all';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const session = {
    has(key) { try { return sessionStorage.getItem('lynn-r1:' + key) === '1'; } catch { return false; } },
    set(key) { try { sessionStorage.setItem('lynn-r1:' + key, '1'); } catch {} }
  };
  const dishes = $$('.dish').map(el => ({ id: el.dataset.id, name: el.querySelector('h3').textContent, occasion: el.dataset.occasion }));
  const picks = new Set();
  function invalidate() {
    const hadNote = !$('#meal-summary').hidden;
    $('#meal-summary').hidden = true; $('#summary-text').textContent = ''; $('#copy-status').textContent = '';
    $('.copy-fallback')?.remove(); $('#plan-error').textContent = '';
    if (hadNote) $('#plan-status').textContent = 'Your plan changed. Make your note again before copying.';
  }
  function showDishes() {
    const query = $('#dish-search').value.trim().toLocaleLowerCase('en-GB'); let visible = 0;
    $$('.dish').forEach(el => {
      const matches = (filter === 'all' || el.dataset.occasion === filter) && el.querySelector('h3').textContent.toLocaleLowerCase('en-GB').includes(query);
      el.hidden = !matches; if (matches) visible++;
    });
    $('#no-matches').hidden = visible > 0;
    $('#filter-status').textContent = visible + (visible === 1 ? ' published dish' : ' published dishes') + ' shown.';
  }
  function setFilter(next) {
    filter = next; $$('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter))); showDishes();
  }
  $$('[data-filter]').forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
  $('#dish-search').addEventListener('input', showDishes);
  $('#reset-search').addEventListener('click', () => { $('#dish-search').value = ''; setFilter('all'); $('#dish-search').focus(); });
  $$('[data-jump-filter]').forEach(link => link.addEventListener('click', () => {
    $('#dish-search').value = ''; setFilter(link.dataset.jumpFilter);
    requestAnimationFrame(() => $('[data-filter="' + filter + '"]').focus({ preventScroll: true }));
  }));
  function renderPicks() {
    const list = $('#picked-dishes'); list.replaceChildren();
    if (!picks.size) { const p = document.createElement('p'); p.className = 'empty'; p.textContent = 'No dishes yet. Add a few favourites from the selection above.'; list.append(p); }
    for (const id of picks) {
      const dish = dishes.find(d => d.id === id), row = document.createElement('div'), name = document.createElement('p'), category = document.createElement('small'), remove = document.createElement('button');
      row.className = 'pick'; name.textContent = dish.name; category.textContent = dish.occasion === 'brunch' ? 'Brunch · Just Eat selection' : 'Evening starter · posted 4 October'; name.append(category);
      remove.type = 'button'; remove.textContent = 'Remove'; remove.setAttribute('aria-label', 'Remove ' + dish.name + ' from my shortlist');
      remove.addEventListener('click', () => { picks.delete(id); invalidate(); renderPicks(); $('#picked-dishes').focus(); $('#plan-status').textContent = dish.name + ' removed.'; });
      row.append(name, remove); list.append(row);
    }
    $('#nav-count').textContent = String(picks.size);
    $$('[data-add]').forEach(button => { const selected = picks.has(button.dataset.add); button.textContent = selected ? 'Remove' : 'Add to shortlist'; button.setAttribute('aria-pressed', String(selected)); button.setAttribute('aria-label', (selected ? 'Remove ' : 'Add ') + dishes.find(d => d.id === button.dataset.add).name + (selected ? ' from' : ' to') + ' my local shortlist'); });
  }
  $$('[data-add]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.add, dish = dishes.find(d => d.id === id); if (!dish) return;
    const selected = picks.has(id); selected ? picks.delete(id) : picks.add(id); invalidate(); renderPicks();
    $('#add-status').textContent = dish.name + (selected ? ' removed. ' : ' added. ') + picks.size + (picks.size === 1 ? ' dish' : ' dishes') + ' in your local shortlist.';
  }));
  $('#plan-fields').addEventListener('input', invalidate); $('#plan-fields').addEventListener('change', invalidate);
  $('#make-note').addEventListener('click', () => {
    invalidate();
    if (!picks.size) { $('#plan-error').textContent = 'Add at least one dish from the selection first.'; $('#food').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' }); const button = $$('[data-add]').find(el => !el.closest('.dish').hidden); (button || $('[data-filter="all"]')).focus({ preventScroll: true }); return; }
    const occasion = $('#occasion').value, day = $('#visit-day').value, people = $('#people'), raw = people.value.trim(), count = Number(raw);
    if (!occasion) { $('#plan-error').textContent = 'Choose brunch, dinner or still deciding.'; $('#occasion').focus(); return; }
    if (day === 'Tuesday') { $('#plan-error').textContent = 'LYNN’s published bio says closed Tuesday. Choose another day or leave the day undecided.'; $('#visit-day').focus(); return; }
    if (occasion === 'dinner' && day && !['Friday','Saturday'].includes(day)) { $('#plan-error').textContent = 'LYNN’s published dinner days are Friday and Saturday. Choose one of those, or leave the day undecided.'; $('#visit-day').focus(); return; }
    const selected = [...picks].map(id => dishes.find(d => d.id === id));
    if (occasion !== 'deciding' && selected.some(d => d.occasion !== occasion)) { $('#plan-error').textContent = 'Your list mixes brunch and evening starters. Remove dishes from the other selection, or choose Still deciding.'; $('#occasion').focus(); return; }
    if (people.validity.badInput || (raw !== '' && (!Number.isInteger(count) || count < 1 || count > 50))) { $('#plan-error').textContent = 'Enter a whole number from 1 to 50, or leave the group size empty. This is a preview field limit, not the restaurant’s capacity.'; people.focus(); return; }
    const title = { brunch: 'Brunch', dinner: 'Friday or Saturday dinner', deciding: 'Still deciding' }[occasion];
    let text = 'LYNN — MY MEAL NOTE\n\nOccasion: ' + title + '\n';
    if (day) text += 'Day in mind: ' + day + '\n';
    if (raw !== '') text += 'Planning for: ' + count + (count === 1 ? ' person' : ' people') + '\n';
    for (const kind of ['brunch','dinner']) { const group = selected.filter(d => d.occasion === kind); if (group.length) text += '\n' + (kind === 'brunch' ? 'BRUNCH — JUST EAT SELECTION' : 'EVENING STARTERS — POSTED 4 OCTOBER 2026') + '\n' + group.map(d => '• ' + d.name).join('\n') + '\n'; }
    const notes = $('#notes').value.trim(); if (notes) text += '\nQuestions for LYNN:\n' + notes + '\n';
    text += '\nConfirm the current menu, ingredients, allergens and prices with LYNN. This local note is not an order or a table reservation. Reserve separately through LYNN’s SevenRooms page.';
    $('#summary-text').textContent = text; $('#meal-summary').hidden = false; $('#plan-status').textContent = ''; $('#meal-summary').focus();
  });
  $('#clear-plan').addEventListener('click', () => { picks.clear(); $('#occasion').selectedIndex = 0; $('#visit-day').selectedIndex = 0; $('#people').value = ''; $('#notes').value = ''; invalidate(); renderPicks(); $('#add-status').textContent = ''; $('#plan-status').textContent = 'Your shortlist and meal details have been cleared.'; $('#picked-dishes').focus(); });
  $('#copy-note').addEventListener('click', async () => {
    const text = $('#summary-text').textContent; if ($('#meal-summary').hidden || !text) return;
    try { if (!navigator.clipboard?.writeText) throw new Error(); await navigator.clipboard.writeText(text); $('#copy-status').textContent = 'Copied. Nothing was sent, ordered or reserved.'; }
    catch { $('.copy-fallback')?.remove(); const field = document.createElement('textarea'); field.className = 'copy-fallback'; field.readOnly = true; field.setAttribute('aria-label','Select and copy my meal note'); field.value = text; $('#copy-status').after(field); field.focus(); field.select(); $('#copy-status').textContent = 'Automatic copying is unavailable. Your note is selected below; copy it with your keyboard or device menu.'; }
  });
  renderPicks(); showDishes();
  function resetEmail() {
    $('#email').value = '';
    $('#email').disabled = false;
    $('#signup-submit').disabled = false;
    $('#email-status').textContent = '';
    $('#email-status').className = '';
  }
  function openSignup(source) {
    if (intro || dialog.open || typeof dialog.showModal !== 'function') return;
    opener = source || document.activeElement;
    resetEmail();
    dialog.showModal();
    $('.dialog-close').focus();
  }
  function closeSignup(restore = true) {
    session.set('signup-dismissed');
    $('#email').value = '';
    dialog.close();
    if (restore && opener?.isConnected) opener.focus();
    opener = null;
    lastActivity = Date.now();
  }
  $$('.signup-open').forEach(button => button.addEventListener('click', () => openSignup(button)));
  $('.dialog-close').addEventListener('click', () => closeSignup());
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeSignup(); });
  $('#back-to-food').addEventListener('click', () => {
    closeSignup(false);
    $('#food').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' });
    $('[data-filter="all"]').focus({ preventScroll: true });
  });
  $('#email-clear').addEventListener('click', () => { resetEmail(); $('#email').focus(); });
  $('#email').addEventListener('input', () => {
    $('#email-status').textContent = '';
    $('#email-status').className = '';
  });
  $('#email').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); $('#signup-submit').click(); }
  });
  $('#signup-submit').addEventListener('click', () => {
    const field = $('#email');
    const email = field.value.trim();
    if (!email || !field.checkValidity() || !/^\S+@\S+\.\S+$/.test(email)) {
      $('#email-status').textContent = email ? 'Enter a valid email address, such as you@example.com.' : 'Enter an email address to try the preview.';
      $('#email-status').className = 'error';
      field.focus();
      return;
    }
    field.value = '';
    field.disabled = true;
    $('#signup-submit').disabled = true;
    $('#email-status').textContent = 'Preview complete. Your email address has been cleared. Nothing was sent or saved, and you are not subscribed.';
    $('#email-status').className = 'success';
    $('#email-status').focus();
    session.set('signup-dismissed');
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('button,a,input,textarea,select,[tabindex="0"]')].filter(el => !el.disabled && !el.hidden);
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === $('#email-status'))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === $('#email-status'))) {
      event.preventDefault(); first.focus();
    }
  });

  // Intro animates only the measured header photograph, with no overlay or hidden content.
  const brand = $('.brand'), logo = $('.brand-window'), image = $('.brand-window img');
  function finishIntro() {
    brand.classList.remove('revealing');
    intro = false;
    session.set('intro-seen');
  }
  function failImage() { brand.classList.add('image-failed'); finishIntro(); }
  function startIntro() {if(document.querySelector('.ao-journey')){finishIntro();return;}
    if (!image.naturalWidth) { failImage(); return; }
    if (session.has('intro-seen') || reduced.matches || location.hash || scrollY > 10 || document.visibilityState !== 'visible') { finishIntro(); return; }
    const box = logo.getBoundingClientRect(), head = $('header').getBoundingClientRect(), nav = $('nav').getBoundingClientRect();
    const inside = box.width > 0 && box.left >= head.left && box.right <= head.right && box.top >= head.top + 5 && box.bottom <= head.bottom;
    const separate = box.right + 6 <= nav.left || box.bottom + 6 <= nav.top;
    if (!inside || !separate) { finishIntro(); return; }
    intro = true;
    brand.classList.add('revealing');
    logo.addEventListener('animationend', finishIntro, { once: true });
    setTimeout(finishIntro, 1000);
  }
  image.addEventListener('error', failImage, { once: true });
  if (image.complete) requestAnimationFrame(startIntro);
  else { image.addEventListener('load', startIntro, { once: true }); setTimeout(finishIntro, 1800); }
  addEventListener('resize', finishIntro);
  addEventListener('hashchange', finishIntro);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') finishIntro(); });
  reduced.addEventListener('change', finishIntro);

  ['pointerdown', 'pointermove', 'keydown', 'scroll'].forEach(type => addEventListener(type, () => { lastActivity = Date.now(); }, { passive: true }));
  setInterval(() => {if(document.querySelector('.ao-stage')?.getBoundingClientRect().bottom>0)return;
    if (session.has('signup-dismissed') || intro || dialog.open || document.visibilityState !== 'visible' || Date.now() - started < 20000 || Date.now() - lastActivity < 5000) return;
    if (document.activeElement?.closest('input,textarea,select,fieldset,dialog,#meal-summary')) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (max > 0 && scrollY / max >= .3) openSignup(null);
  }, 1000);

  // All handlers bind before controls become available. No form or transmission exists.
  $('#plan-fields').disabled = false;
  $('#filter-fields').disabled = false;
  $$('[data-add]').forEach(button => { button.disabled = false; });
  if (typeof dialog.showModal === 'function') {
    $('#email-fields').disabled = false;
    $$('.signup-open').forEach(button => { button.disabled = false; });
  }
})();
