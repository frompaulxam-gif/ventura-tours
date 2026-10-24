'use strict';
(() => {
  const key = 'ventura:tiktokedit2:20261017';
  const submissionsKey = key + ':submissions';
  const cards = [...document.querySelectorAll('.film')];
  const ids = ['nice-shirt-bro', 'lets-match', 'flowers-or-the-bag', 'the-shirt-detective'];
  const names = ['nice shirt bro', 'let’s match', 'flowers or the bag', 'the shirt detective'];
  const read = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) || fallback; } catch { return fallback; } };
  const status = message => { const el = document.querySelector('#status'); if (el) el.textContent = message; };
  const write = (k, value) => { try { localStorage.setItem(k, JSON.stringify(value)); return true; } catch { status('browser storage is unavailable. download your feedback to keep it.'); return false; } };
  const validVote = v => ['L', 'D', 'S'].includes(v) ? v : '';
  const text = v => typeof v === 'string' ? v : '';
  const effective = item => item.vote === 'S' ? 'really like' : item.vote === 'D' ? 'dislike' : item.vote === 'L' ? 'like' : item.note.trim() ? 'changes requested' : 'unrated';
  const plain = data => ['navy stripey · video review', 'name: ' + (data.name || 'anonymous'), '', ...ids.flatMap((id, i) => [names[i] + ': ' + effective(data.items[id]), data.items[id].note || 'no comment', '']), 'overall comments:', data.overall || 'none'].join('\n');
  const snapshot = () => ({ name: state.name, overall: state.overall, items: state.items, savedAt: new Date().toISOString() });
  let state;
  if (cards.length) {
    const draft = read(key, {});
    state = { name: text(draft.name), overall: text(draft.overall), items: {} };
    const shared = new URL(location.href).searchParams.get('votes') || '';
    ids.forEach((id, i) => { state.items[id] = { vote: shared.length === 4 ? validVote(shared[i]) : validVote(draft.items?.[id]?.vote), note: text(draft.items?.[id]?.note) }; });
    function persist() {
      const saved = write(key, state);
      const url = new URL(location.href);
      url.searchParams.set('votes', ids.map(id => state.items[id].vote || '-').join(''));
      history.replaceState(null, '', url);
      if (saved) status('saved in this browser');
    }
    function paint(card) {
      let summary=document.querySelector('#rating-summary');if(!summary){summary=document.createElement('p');summary.id='rating-summary';document.querySelector('#status').before(summary);}
      const votes=Object.values(state.items);summary.textContent=`${votes.filter(v=>v.vote==='S').length} really like · ${votes.filter(v=>v.vote==='L').length} liked · ${votes.filter(v=>v.vote==='D').length} disliked`;
      const item = state.items[card.dataset.id];
      card.querySelectorAll('[data-vote]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.vote === item.vote)));
      card.querySelector('.verdict').textContent = effective(item) === 'changes requested' ? 'changes requested' : '';
    }
    cards.forEach(card => {
      const id = card.dataset.id;
      card.querySelectorAll('[data-vote]').forEach(b=>b.setAttribute('aria-label',(b.dataset.vote==='S'?'really like':b.dataset.vote==='L'?'like':'dislike')+' video '+names[ids.indexOf(id)]));
      const note = card.querySelector('textarea');
      note.value = state.items[id].note;
      card.querySelectorAll('[data-vote]').forEach(button => button.addEventListener('click', () => {
        state.items[id].vote = state.items[id].vote === button.dataset.vote ? '' : button.dataset.vote;
        paint(card); persist();
      }));
      note.addEventListener('input', () => { state.items[id].note = note.value; paint(card); persist(); });
      const video = card.querySelector('video');
      video.addEventListener('play', () => cards.forEach(other => { if (other !== card) other.querySelector('video').pause(); }));
      video.addEventListener('error', () => { card.querySelector('.media-error').hidden = false; });
      card.querySelector('source').addEventListener('error', () => { card.querySelector('.media-error').hidden = false; });
      paint(card);
    });
    ['reviewer', 'overall'].forEach(id => {
      const field = document.getElementById(id), prop = id === 'reviewer' ? 'name' : 'overall';
      field.value = state[prop];
      field.addEventListener('input', () => { state[prop] = field.value; persist(); });
    });
    document.getElementById('save').addEventListener('click', () => {
      const rows = read(submissionsKey, []);
      if (!Array.isArray(rows)) { status('saved feedback could not be read. download a copy of this review.'); return; }
      const data = snapshot(); data.name = data.name.trim() || 'anonymous';
      const index = rows.findIndex(row => text(row.name).toLowerCase() === data.name.toLowerCase());
      if (index >= 0) rows[index] = data; else rows.push(data);
      if (write(submissionsKey, rows)) status('feedback saved. you can revise it and save again.');
    });
    document.getElementById('copy').addEventListener('click', async () => {
      const output = plain(snapshot());
      try {
        if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
        await navigator.clipboard.writeText(output); status('feedback copied');
      } catch {
        const fallback = document.getElementById('copy-fallback');
        fallback.value = output; fallback.hidden = false; fallback.focus(); fallback.select();
        let copied = false; try { copied = document.execCommand('copy'); } catch {}
        status(copied ? 'feedback copied' : 'your feedback is selected below. copy it to share.');
      }
    });
    document.getElementById('export').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob), anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'navy-stripey-feedback.json'; document.body.append(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000); status('feedback downloaded');
    });
  }
  const results = document.getElementById('results');
  if (results) {
    const rows = read(submissionsKey, []);
    if (!Array.isArray(rows) || !rows.length) { results.textContent = 'no saved reviews in this browser yet.'; return; }
    rows.sort((a, b) => text(b.savedAt).localeCompare(text(a.savedAt))).forEach(row => {
      const article = document.createElement('article'); article.className = 'submission';
      const heading = document.createElement('h2'); heading.textContent = text(row.name) || 'anonymous'; article.append(heading);
      const time = document.createElement('time'); time.textContent = new Date(row.savedAt).toLocaleString('en-GB'); article.append(time);
      const table = document.createElement('table');
      const tr = document.createElement('tr'); ['video', 'rating', 'comment'].forEach(label => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; tr.append(th); });
      const head = document.createElement('thead'); head.append(tr); table.append(head);
      const body = document.createElement('tbody');
      ids.forEach((id, i) => {
        const item = { vote: validVote(row.items?.[id]?.vote), note: text(row.items?.[id]?.note) };
        const tr = document.createElement('tr');
        [names[i], effective(item), item.note || '—'].forEach((value, col) => { const td = document.createElement('td'); td.textContent = value; if (col === 2 && item.note) td.className = 'note'; tr.append(td); });
        body.append(tr);
      });
      table.append(body); article.append(table);
      const overall = document.createElement('p'); overall.className = 'overall note'; overall.textContent = text(row.overall); article.append(overall);
      results.append(article);
    });
  }
})();
