(() => {
  'use strict';
  const cases = {"admin": {"title": "A request. A clear task.", "label": "The request", "request": "“We’re closing at 4pm this Friday. Could you update the website?”", "fields": ["Task", "Update", "Check first"], "values": ["Website opening hours", "Friday · close at 4pm", "Confirm the date"], "note": "Your team confirms the date.", "outcome": "Request organised", "review": "Check the date, then pass it to your website manager.", "confirmed": "Date confirmed in this demo", "ready": "Ready for your website manager. Nothing has been changed."}, "enquiries": {"title": "A question. A useful reply.", "label": "The enquiry", "request": "“Could you give us a quote for a virtual tour of our venue?”", "fields": ["Request", "Draft reply", "Check first"], "values": ["Virtual tour quote", "Please share your venue address and approximate size.", "Review the reply"], "note": "Your team checks the wording.", "outcome": "Reply prepared", "review": "Review the draft before sending it to the customer.", "confirmed": "Reply reviewed in this demo", "ready": "Ready to send. No email has been sent."}, "approvals": {"title": "A draft. A clear decision.", "label": "The update", "request": "“The next social post is ready. Can the owner check the caption?”", "fields": ["Task", "Reviewer", "Check first"], "values": ["Approve the next social post", "Business owner", "Add the draft and deadline"], "note": "Your team adds the missing details.", "outcome": "Approval organised", "review": "Attach the draft and agree when the owner should review it.", "confirmed": "Draft and deadline added in this demo", "ready": "Ready for the owner. The post remains unpublished."}};
  const tabs = [...document.querySelectorAll('[data-case]')];
  let current = 'admin';
  let stage = 1;
  const text = (id, value) => { document.getElementById(id).textContent = value; };
  const next = document.getElementById('demo-next');
  function render() {
    const item = cases[current];
    document.getElementById('example-panel').dataset.stage = stage;
    text('demo-title', item.title); text('request-label', item.label); text('request-text', item.request);
    item.fields.forEach((label, i) => { text(`field-label-${i}`, label); text(`field-value-${i}`, item.values[i]); });
    if (stage === 3) { text('field-label-2', 'Checked by your team'); text('field-value-2', item.confirmed); }
    text('result-heading', stage === 1 ? 'Prepared for you' : stage === 2 ? 'Your team reviews' : 'Ready for the next step');
    text('result-status', ['','Ready to check','Human review','Ready'][stage]);
    document.getElementById('result-status').classList.toggle('complete', stage === 3);
    text('check-note', stage === 1 ? item.note : stage === 2 ? item.review : item.ready);
    text('demo-outcome', stage === 1 ? item.outcome : stage === 2 ? 'You stay in control' : 'Checked and ready');
    next.textContent = stage === 3 ? 'Replay example' : stage === 1 ? 'Review the details' : 'Confirm in demo';
    document.querySelectorAll('.progress li').forEach((li, i) => {
      li.classList.toggle('done', i < stage); li.classList.toggle('active', i === stage);
      if (i === stage) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
  }
  const detail = document.getElementById('example-detail');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let disclosureAnimation;
  function select(tab, withMotion = false) {
    const opening = detail.hidden;
    const fromHeight = opening ? 0 : detail.getBoundingClientRect().height;
    disclosureAnimation?.cancel();
    current = tab.dataset.case; stage = 1;
    tabs.forEach(t => { const selected = t === tab; t.setAttribute('aria-selected', String(selected)); t.tabIndex = selected ? 0 : -1; });
    document.getElementById('example-panel').setAttribute('aria-labelledby', tab.id); render();
    detail.hidden = false;
    if (withMotion && !reducedMotion.matches) {
      const animation = detail.animate([
        { height: `${fromHeight}px`, opacity: opening ? 0 : .65, transform: 'translateY(8px)' },
        { height: `${detail.scrollHeight}px`, opacity: 1, transform: 'translateY(0)' }
      ], { duration: opening ? 420 : 240, easing: 'cubic-bezier(.22,1,.36,1)' });
      disclosureAnimation = animation;
      detail.style.overflow = 'hidden';
      animation.finished.catch(() => {}).finally(() => {
        if (disclosureAnimation === animation) { detail.style.overflow = ''; disclosureAnimation = null; }
      });
    } else {
      detail.style.overflow = '';
    }
    document.querySelector('.case-tabs').dispatchEvent(new CustomEvent('examplechange', { detail: { withMotion } }));
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', event => select(tab, event.detail > 0));
    tab.addEventListener('keydown', e => {
      let n;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i + tabs.length - 1) % tabs.length;
      if (e.key === 'Home') n = 0; if (e.key === 'End') n = tabs.length - 1;
      if (n !== undefined) { e.preventDefault(); tabs.forEach((tab, index) => tab.tabIndex = index === n ? 0 : -1); tabs[n].focus(); }
    });
  });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) disclosureAnimation?.cancel(); });
  next.addEventListener('click', () => { stage = stage === 3 ? 1 : stage + 1; render(); if (!reducedMotion.matches) document.querySelector('.system-result').animate([{opacity:.45,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'}); });
  const media = matchMedia('(max-width:760px)');
  const orient = () => document.querySelector('[role=tablist]').setAttribute('aria-orientation', media.matches ? 'horizontal' : 'vertical');
  orient(); media.addEventListener('change', orient);
  let draft = '';
  const form = document.getElementById('enquiry-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const business = form.elements.business.value.trim(), task = form.elements.task.value.trim();
    if (!business || !task) { (!business ? form.elements.business : form.elements.task).focus(); return; }
    const name = form.elements.contactName.value.trim();
    const email = form.elements.email.value.trim();
    const phone = form.elements.phone.value.trim();
    if (!name) { form.elements.contactName.focus(); return; }
    draft = `Hi Ventura,\n\nI'd like a free conversation about ${task.toLowerCase()}.\n\nName: ${name}\nBusiness: ${business}\nEmail: ${email}\nUK phone: ${phone || 'Email preferred'}\n\nCould we discuss where AI could help?`;
    document.getElementById('email-fallback').hidden = false;
    text('copy-status', '');
    window.location.href = `mailto:hello@venturasolutions.co.uk?subject=${encodeURIComponent('Ventura enquiry — ' + task)}&body=${encodeURIComponent(draft)}`;
  });
  document.getElementById('copy-enquiry').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(draft); text('copy-status', 'Copied. Paste it into your email when you’re ready.'); }
    catch { text('copy-status', 'Copy wasn’t available. Select and copy the text below.'); let output = document.getElementById('draft-text'); if (!output) { output = document.createElement('textarea'); output.id = 'draft-text'; output.readOnly = true; output.setAttribute('aria-label', 'Your enquiry text'); document.getElementById('email-fallback').append(output); } output.value = draft; output.focus(); output.select(); }
  });
})();
