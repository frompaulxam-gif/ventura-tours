(() => {
  'use strict';
  const cases = {
    admin: { title: 'From inbox to a clear next step', label: 'Incoming request', request: '“Could you update our opening hours on the website? We’ll close at 4pm this Friday.”', fields: ['Task', 'Change', 'Needs checking'], values: ['Update website opening hours', 'Close at 4pm this Friday', 'Which date does “this Friday” mean?'], note: 'You confirm the date before anything is changed.', outcome: 'No digging through the email. The task and the missing detail are in one place.', review: 'Your team confirms the date and assigns the task to the person who manages the website.', confirmed: 'Date confirmed by your team in this example', ready: 'The checked request is ready for your website manager. The website itself has not been changed.' },
    enquiries: { title: 'From customer question to a draft reply', label: 'Incoming enquiry', request: '“We’re interested in a virtual tour of our venue. What do you need to give us a quote?”', fields: ['Customer needs', 'Draft reply', 'Needs checking'], values: ['A quote for a venue tour', 'Thanks for getting in touch. Could you share the venue address and approximate size?', 'Check the wording and information requested'], note: 'Your team reviews the draft before sending it.', outcome: 'A useful first draft, ready to check. No price or availability has been invented.', review: 'Your team checks the wording and confirms the details needed to prepare a quote.', confirmed: 'Wording checked by your team in this example', ready: 'The approved reply is ready to send. This demo has not emailed anyone.' },
    approvals: { title: 'From a draft to a clear approval task', label: 'Incoming update', request: '“The next social post is ready. Can you get the owner to approve the caption before we schedule it?”', fields: ['Task', 'Approval needed', 'Needs checking'], values: ['Review the next social post', 'Owner to approve the caption', 'Where is the draft, and when is it needed?'], note: 'Your team adds the draft and confirms the review date.', outcome: 'Everyone can see what needs approval and what information is missing.', review: 'Your team adds the draft link, agrees a deadline and assigns the approval to the owner.', confirmed: 'Draft and deadline added in this example', ready: 'The review task is ready for the owner. The post stays unpublished until it is approved.' }
  };
  const tabs = [...document.querySelectorAll('[data-case]')];
  let current = 'admin';
  let stage = 1;
  const text = (id, value) => { document.getElementById(id).textContent = value; };
  const next = document.getElementById('demo-next');
  function render() {
    const item = cases[current];
    text('demo-title', item.title); text('request-label', item.label); text('request-text', item.request);
    item.fields.forEach((label, i) => { text(`field-label-${i}`, label); text(`field-value-${i}`, item.values[i]); });
    if (stage === 3) { text('field-label-2', 'Checked by your team'); text('field-value-2', item.confirmed); }
    text('result-heading', stage === 1 ? 'The details, organised for you' : stage === 2 ? 'Your team checks the details' : 'A clear task, ready to go');
    text('result-status', ['','Ready to check','Human review','Ready'][stage]);
    document.getElementById('result-status').classList.toggle('complete', stage === 3);
    text('check-note', stage === 1 ? item.note : stage === 2 ? item.review : item.ready);
    text('demo-outcome', stage === 1 ? item.outcome : stage === 2 ? 'This is where a person checks the details, makes changes and decides what happens next.' : 'One clear next step, with the checks built in. Your setup would be agreed around your own tools.');
    next.textContent = stage === 3 ? 'Replay example ↻' : 'See the next step →';
    document.querySelectorAll('.progress li').forEach((li, i) => {
      li.classList.toggle('done', i < stage); li.classList.toggle('active', i === stage);
      if (i === stage) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
  }
  function select(tab) {
    current = tab.dataset.case; stage = 1;
    tabs.forEach(t => { const selected = t === tab; t.setAttribute('aria-selected', String(selected)); t.tabIndex = selected ? 0 : -1; });
    document.getElementById('example-panel').setAttribute('aria-labelledby', tab.id); render();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', e => {
      let n;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i + tabs.length - 1) % tabs.length;
      if (e.key === 'Home') n = 0; if (e.key === 'End') n = tabs.length - 1;
      if (n !== undefined) { e.preventDefault(); select(tabs[n]); tabs[n].focus(); }
    });
  });
  next.addEventListener('click', () => { stage = stage === 3 ? 1 : stage + 1; render(); });
  const media = matchMedia('(max-width:760px)');
  const orient = () => document.querySelector('[role=tablist]').setAttribute('aria-orientation', media.matches ? 'horizontal' : 'vertical');
  orient(); media.addEventListener('change', orient);
  let draft = '';
  const form = document.getElementById('enquiry-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const business = form.elements.business.value.trim(), task = form.elements.task.value.trim();
    if (!business || !task) { (!business ? form.elements.business : form.elements.task).focus(); return; }
    draft = `Hi Ventura,\n\nI'd like to talk about making a task simpler.\n\nOur business: ${business}\n\nThe task: ${task}\n\nCould we arrange a conversation?`;
    document.getElementById('email-fallback').hidden = false;
    text('copy-status', '');
    window.location.href = `mailto:hello@venturasolutions.co.uk?subject=${encodeURIComponent('A simpler way to handle our admin')}&body=${encodeURIComponent(draft)}`;
  });
  document.getElementById('copy-enquiry').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(draft); text('copy-status', 'Copied. Paste it into your email when you’re ready.'); }
    catch { text('copy-status', 'Copy wasn’t available. Select and copy the text below.'); let output = document.getElementById('draft-text'); if (!output) { output = document.createElement('textarea'); output.id = 'draft-text'; output.readOnly = true; output.setAttribute('aria-label', 'Your enquiry text'); document.getElementById('email-fallback').append(output); } output.value = draft; output.focus(); output.select(); }
  });
})();
