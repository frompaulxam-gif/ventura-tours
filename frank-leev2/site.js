'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const dialog = $('#signup-dialog');
  const started = Date.now();
  let lastActivity = started, intro = false, opener = null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const session = {
    has(key) { try { return sessionStorage.getItem('frank-lee-r1:' + key) === '1'; } catch { return false; } },
    set(key) { try { sessionStorage.setItem('frank-lee-r1:' + key, '1'); } catch { /* Session flags are optional. */ } }
  };

  function invalidate() {
    const wasVisible = !$('#ask-summary').hidden;
    $('#ask-summary').hidden = true;
    $('#summary-text').textContent = '';
    $('#copy-status').textContent = '';
    $('.copy-fallback')?.remove();
    $('#plan-error').textContent = '';
    if (wasVisible) $('#plan-status').textContent = 'Your list changed. Make it again before copying.';
  }
  $('#plan-fields').addEventListener('input', invalidate);
  $('#plan-fields').addEventListener('change', invalidate);
  $$('[data-pick]').forEach(link => link.addEventListener('click', () => {
    const item = $$('input[name="meat"]').find(input => input.value === link.dataset.pick);
    if (!item) return;
    item.checked = true;
    invalidate();
    $('#plan-status').textContent = item.value + ' is selected in your ask list.';
    requestAnimationFrame(() => item.focus({ preventScroll: true }));
  }));

  $('#make-list').addEventListener('click', () => {
    invalidate();
    const selected = $$('input[name="meat"]:checked').map(input => input.value);
    if (!selected.length) {
      $('#plan-error').textContent = 'Choose at least one part of the range to ask about.';
      $('input[name="meat"]').focus();
      return;
    }
    const people = $('#people'), raw = people.value.trim(), count = Number(raw);
    if (people.validity.badInput || (raw !== '' && (!Number.isInteger(count) || count < 1 || count > 50))) {
      $('#plan-error').textContent = 'Enter a whole number from 1 to 50, or leave the people field empty.';
      people.focus();
      return;
    }
    const questions = $('#questions').value.trim();
    let text = 'FRANK LEE & SON — MY COUNTER QUESTIONS\n\nAsk about: ' + selected.join(', ') + '\n';
    text += 'Cooking plan: ' + $('#meal').value + '\n';
    if (raw !== '') text += 'Cooking for: ' + count + (count === 1 ? ' person' : ' people') + '\n';
    if (questions) text += '\nRecipe or questions:\n' + questions + '\n';
    text += '\nPlease confirm today’s available cuts, the quantity for my meal, price and any preparation or ingredient questions.\n\nThis is my discussion list, not an order or stock reservation.';
    $('#summary-text').textContent = text;
    $('#plan-status').textContent = '';
    $('#ask-summary').hidden = false;
    $('#ask-summary').focus();
  });

  $('#clear-list').addEventListener('click', () => {
    $$('input[name="meat"]').forEach(input => { input.checked = false; });
    $('#meal').selectedIndex = 0;
    $('#people').value = '';
    $('#questions').value = '';
    invalidate();
    $('#plan-status').textContent = 'Your ask list has been cleared.';
    $('input[name="meat"]').focus();
  });

  $('#copy-list').addEventListener('click', async () => {
    const text = $('#summary-text').textContent;
    if ($('#ask-summary').hidden || !text) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      $('#copy-status').textContent = 'Copied. Take your list to the counter; nothing was sent.';
    } catch {
      $('.copy-fallback')?.remove();
      const field = document.createElement('textarea');
      field.className = 'copy-fallback';
      field.readOnly = true;
      field.setAttribute('aria-label', 'Select and copy your ask list');
      field.value = text;
      $('#copy-status').after(field);
      field.focus();
      field.select();
      $('#copy-status').textContent = 'Automatic copying is unavailable. Your list is selected below; copy it with your keyboard or device menu.';
    }
  });

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
  $('#back-to-range').addEventListener('click', () => {
    closeSignup(false);
    $('#range').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' });
    $('[data-pick]').focus({ preventScroll: true });
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
    if (document.activeElement?.closest('input,textarea,select,fieldset,dialog,#ask-summary')) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (max > 0 && scrollY / max >= .3) openSignup(null);
  }, 1000);

  // All handlers bind before controls become available. No form or transmission exists.
  $('#plan-fields').disabled = false;
  if (typeof dialog.showModal === 'function') {
    $('#email-fields').disabled = false;
    $$('.signup-open').forEach(button => { button.disabled = false; });
  }
})();
