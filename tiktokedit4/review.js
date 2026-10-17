(() => {
  'use strict';
  const BOARD = document.documentElement.dataset.boardId;
  const HOSTED = !['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname);
  const KEY = `paulqc:${BOARD}`;
  const SUBMISSIONS = `${KEY}:submissions`;
  const status = document.querySelector('#save-status');
  const answerStatus = document.querySelector('#answer-status');
  let clips = [], videos = [], round = {}, byId = new Map(), draft, timer, writeQueue = Promise.resolve();
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
  };
  const store = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  };
  const empty = () => ({boardId: BOARD, updatedAt: '', clips: {}, videos: {}, videoComments: {}, overallComment: '', name: ''});
  const clipValue = id => ({liked: false, disliked: false, comment: '', ...draft.clips[id]});
  const api = async (path, data) => {
    if (HOSTED) throw new Error('browser storage mode');
    const response = await fetch(path, data === undefined ? {cache: 'no-store', signal: AbortSignal.timeout(2500)} : {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data), signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error(`save failed (${response.status})`);
    return response.json();
  };
  function summary() {
    const values = Object.values(draft.clips);
    const likedClips = values.filter(v => v.liked && !v.disliked).length;
    const rejected = values.filter(v => v.disliked).length;
    const noted = values.filter(v => v.comment.trim()).length;
    const likedVideos = Object.values(draft.videos).filter(v => v === 'like').length;
    const dislikedVideos = Object.values(draft.videos).filter(v => v === 'dislike').length;
    const videoNotes = Object.values(draft.videoComments).filter(v => v.trim()).length;
    document.querySelector('#review-summary').textContent = `${likedVideos} video${likedVideos === 1 ? '' : 's'} liked · ${dislikedVideos} video${dislikedVideos === 1 ? '' : 's'} disliked · ${videoNotes} video comment${videoNotes === 1 ? '' : 's'} · ${likedClips} clip${likedClips === 1 ? '' : 's'} liked · ${rejected} clip${rejected === 1 ? '' : 's'} disliked · ${noted} clip comment${noted === 1 ? '' : 's'}`;
    document.querySelectorAll('.clip-review').forEach(review => {
      const group = clips.filter(c => c.video === review.dataset.video);
      const count = group.filter(c => clipValue(c.id).disliked).length;
      const kept = group.filter(c => clipValue(c.id).liked && !clipValue(c.id).disliked).length;
      review.querySelector('.clip-count').textContent = count || kept ? `${kept} liked · ${count} disliked` : `${group.length} clips`;
    });
  }
  function urlVerdicts() {
    const url = new URL(location.href);
    const values = clips.map(c => clipValue(c.id).disliked ? 'X' : clipValue(c.id).liked ? 'K' : '-').join('');
    if (/[KX]/.test(values)) url.searchParams.set('clips', values);
    else url.searchParams.delete('clips');
    const videoValues = videos.map(v => draft.videos[v.id] === 'like' ? 'K' : draft.videos[v.id] === 'dislike' ? 'X' : '-').join('');
    if (/[KX]/.test(videoValues)) url.searchParams.set('videos', videoValues);
    else url.searchParams.delete('videos');
    history.replaceState(null, '', url);
  }
  function paint(tile) {
    const value = clipValue(tile.dataset.clip);
    tile.querySelector('.frame-button').setAttribute('aria-pressed', String(value.disliked));
    const liked = value.liked && !value.disliked;
    tile.querySelector('.clip-like').setAttribute('aria-pressed', String(liked));
    tile.querySelector('.clip-like').textContent = liked ? '✓ liked' : 'like';
    tile.classList.toggle('is-liked', liked);
    tile.classList.toggle('has-note', Boolean(value.comment.trim()));
  }
  function paintVideo(review) {
    const value = draft.videos[review.dataset.video];
    review.querySelectorAll('[data-vote]').forEach(button => {
      const selected = button.dataset.vote === value;
      button.setAttribute('aria-pressed', String(selected));
      button.textContent = selected ? (value === 'like' ? 'liked' : 'disliked') : button.dataset.vote;
    });
  }
  function persist() {
    clearTimeout(timer);
    const payload = structuredClone(draft);
    if (HOSTED) { status.textContent = 'feedback saved in this browser'; return Promise.resolve(true); }
    writeQueue = writeQueue.catch(() => {}).then(async () => {
      try {
        await api('api/feedback', payload);
        if (draft.updatedAt === payload.updatedAt) status.textContent = 'feedback saved';
        return true;
      } catch {
        status.textContent = 'saved in this browser · use download feedback for a backup';
        return false;
      }
    });
    return writeQueue;
  }
  function changed() {
    draft.updatedAt = new Date().toISOString();
    const browserSaved = store(KEY, draft);
    status.textContent = browserSaved ? 'saving feedback…' : 'saving feedback to this mac…';
    summary(); urlVerdicts();
    clearTimeout(timer); timer = setTimeout(persist, 400);
  }
  function openEditor(review, shot) {
    review.dataset.activeClip = shot.id;
    review.querySelector('.clip-editor').hidden = false;
    review.querySelector('.editor-label').textContent = `clip ${shot.number} comment`;
    review.querySelector('.editor-detail').textContent = `${shot.folder} · ${shot.timelineIn.toFixed(3)}s to ${shot.timelineOut.toFixed(3)}s`;
    const textarea = review.querySelector('.clip-note');
    textarea.value = clipValue(shot.id).comment;
    textarea.setAttribute('aria-label', `comment for clip ${shot.number} in ${shot.label}`);
    review.querySelectorAll('.comment-button').forEach(b => b.setAttribute('aria-expanded', String(b.closest('.clip-tile').dataset.clip === shot.id)));
    textarea.focus({preventScroll: true});
  }
  function plainText() {
    const lines = [`venture / video review / ${round.label}`, `name: ${draft.name.trim() || 'anonymous'}`, ''];
    videos.forEach(video => {
      const vote = draft.videos[video.id];
      const note = draft.videoComments[video.id] || '';
      if (!vote && !note.trim()) return;
      lines.push(`sound ${video.sound}, variant ${video.variant} · ${video.label}`, `file: ${video.file}`);
      if (vote) lines.push(`whole video: ${vote === 'like' ? 'liked' : 'disliked'}`);
      if (note.trim()) lines.push(`video comment: ${note}`);
      lines.push('');
    });
    clips.forEach(shot => {
      const value = clipValue(shot.id);
      if (!value.liked && !value.disliked && !value.comment.trim()) return;
      lines.push(`sound ${shot.sound}, variant ${shot.variant}, clip ${shot.number} (${shot.timelineIn.toFixed(6)}s to ${shot.timelineOut.toFixed(6)}s)`);
      lines.push(`${shot.label} · ${shot.folder} · ${shot.source}`);
      lines.push(`video: ${shot.videoName}`, `source time: ${shot.sourceStart.toFixed(6)}s to ${shot.sourceEnd.toFixed(6)}s`, `frames: ${shot.timelineInFrame} to ${shot.timelineOutFrame} at ${shot.fps}fps`);
      lines.push(`clip choice: ${value.disliked ? 'disliked' : value.liked ? 'liked' : 'unrated'}`);
      if (value.comment.trim()) lines.push(`comment: ${value.comment}`);
      lines.push('');
    });
    if (draft.overallComment.trim()) lines.push(`overall: ${draft.overallComment}`);
    if (!Object.keys(draft.videos).length && !Object.values(draft.videoComments).some(v => v.trim()) && !Object.values(draft.clips).some(v => v.liked || v.disliked || v.comment.trim()) && !draft.overallComment.trim()) lines.push('no feedback yet');
    return lines.join('\n');
  }
  async function init() {
    try {
      const response = await fetch('clip-review-manifest.json', {cache: 'no-store'});
      if (!response.ok) throw new Error('clip manifest unavailable');
      const manifest = await response.json(); clips = manifest.clips; videos = manifest.videos; round = manifest.round;
      byId = new Map(clips.map(c => [c.id, c]));
      videos.forEach(item => {
        const card = document.getElementById('video-' + item.id);
        const player = card.querySelector('video');
        let usingFallback = false;
        player.addEventListener('error', () => {
          if (usingFallback || !item.compatibilityUrl) return;
          usingFallback = true;
          const playing = !player.paused;
          player.src = item.compatibilityUrl;
          player.load();
          if (playing) player.play().catch(() => {});
        });
      });
      draft = {...empty(), ...read(KEY, empty())};
      try {
        const saved = await api('api/feedback');
        if (saved.boardId === BOARD && saved.updatedAt > draft.updatedAt) draft = {...empty(), ...saved};
      } catch { /* Browser draft remains usable with any static local server. */ }
      draft.clips = Object.fromEntries(Object.entries(draft.clips || {}).filter(([id]) => byId.has(id)));
      const videoIds = new Set(videos.map(v => v.id));
      draft.videos = Object.fromEntries(Object.entries(draft.videos || {}).filter(([id, vote]) => videoIds.has(id) && ['like', 'dislike'].includes(vote)));
      draft.videoComments = Object.fromEntries(Object.entries(draft.videoComments || {}).filter(([id, text]) => videoIds.has(id) && typeof text === 'string'));
      // Keep autosave and pagehide requests small; the server adds source records.
      draft = Object.fromEntries(Object.keys(empty()).map(key => [key, draft[key] ?? empty()[key]]));
      const seed = new URL(location.href).searchParams.get('clips');
      const videoSeed = new URL(location.href).searchParams.get('videos');
      if (!draft.updatedAt) {
        let seeded = false;
        if (seed && seed.length === clips.length && /^[KX-]+$/.test(seed)) {
          clips.forEach((c, i) => { if (seed[i] !== '-') draft.clips[c.id] = {liked: seed[i] === 'K', disliked: seed[i] === 'X', comment: ''}; });
          seeded = true;
        }
        if (videoSeed && videoSeed.length === videos.length && /^[KX-]+$/.test(videoSeed)) {
          videos.forEach((v, i) => { if (videoSeed[i] !== '-') draft.videos[v.id] = videoSeed[i] === 'K' ? 'like' : 'dislike'; });
          seeded = true;
        }
        if (seeded) changed();
      }
      store(KEY, draft);
      document.querySelectorAll('.clip-tile').forEach(tile => {
        paint(tile);
        tile.querySelector('.frame-button').addEventListener('click', () => {
          const old = clipValue(tile.dataset.clip);
          draft.clips[tile.dataset.clip] = {...old, liked: false, disliked: !old.disliked};
          paint(tile); changed();
        });
        tile.querySelector('.clip-like').addEventListener('click', () => {
          const old = clipValue(tile.dataset.clip);
          draft.clips[tile.dataset.clip] = {...old, liked: !old.liked, disliked: false};
          paint(tile); changed();
        });
        tile.querySelector('.comment-button').addEventListener('click', () => openEditor(tile.closest('.clip-review'), byId.get(tile.dataset.clip)));
      });
      document.querySelectorAll('.clip-review').forEach(review => {
        paintVideo(review);
        const videoNote = review.querySelector('.video-note');
        videoNote.value = draft.videoComments[review.dataset.video] || '';
        videoNote.addEventListener('input', () => {
          draft.videoComments[review.dataset.video] = videoNote.value;
          changed();
        });
        review.querySelectorAll('[data-vote]').forEach(button => button.addEventListener('click', () => {
          const id = review.dataset.video, vote = button.dataset.vote;
          if (draft.videos[id] === vote) delete draft.videos[id];
          else draft.videos[id] = vote;
          paintVideo(review); changed();
        }));
        review.querySelector('.clip-note').addEventListener('input', event => {
          const id = review.dataset.activeClip;
          if (!id) return;
          draft.clips[id] = {...clipValue(id), comment: event.target.value};
          paint(review.querySelector(`[data-clip="${id}"]`)); changed();
        });
        review.querySelector('.close-editor').addEventListener('click', () => {
          review.querySelector('.clip-editor').hidden = true;
          const active = review.querySelector('.comment-button[aria-expanded=true]');
          review.querySelectorAll('.comment-button').forEach(b => b.setAttribute('aria-expanded', 'false'));
          if (active) active.focus({preventScroll: true});
        });
        review.querySelector('.jump-button').addEventListener('click', () => {
          const shot = byId.get(review.dataset.activeClip);
          if (!shot) return;
          const video = review.previousElementSibling;
          video.currentTime = shot.timelineIn;
          video.play().catch(() => {});
          video.scrollIntoView({block: 'center', behavior: 'smooth'});
        });
      });
      const overall = document.querySelector('#overall-comment'), name = document.querySelector('#reviewer-name');
      overall.value = draft.overallComment; name.value = draft.name;
      overall.addEventListener('input', () => { draft.overallComment = overall.value; changed(); });
      name.addEventListener('input', () => { draft.name = name.value; changed(); });
      document.querySelector('#save-answers').addEventListener('click', async event => {
        const button = event.currentTarget; button.disabled = true; button.textContent = 'saving…';
        const row = {...structuredClone(draft), name: draft.name.trim() || 'anonymous', ts: new Date().toISOString()};
        const local = read(SUBMISSIONS, {submissions: []});
        local.submissions = local.submissions.filter(r => r.name.toLowerCase() !== row.name.toLowerCase());
        local.submissions.unshift(row); store(SUBMISSIONS, local);
        try {
          await persist();
          if (HOSTED) { answerStatus.textContent = 'review saved in this browser. download feedback for the next edit.'; return; }
          const saved = await api('api/submissions', row); store(SUBMISSIONS, saved);
          answerStatus.textContent = 'review saved. you can change anything and save again.';
        } catch { answerStatus.textContent = 'review saved in this browser. download feedback for a backup.'; }
        finally { button.disabled = false; button.textContent = 'save review'; }
      });
      document.querySelector('#copy-answers').addEventListener('click', async () => {
        const text = plainText();
        const fallback = document.querySelector('#copy-fallback');
        const textarea = document.querySelector('#copy-text');
        // Keep a manual copy available even if the browser says clipboard copy succeeded.
        textarea.value = text; fallback.hidden = false;
        try {
          await navigator.clipboard.writeText(text);
          answerStatus.textContent = 'answers copied';
        } catch {
          textarea.focus(); textarea.select();
          answerStatus.textContent = 'select and copy the text below';
        }
      });
      document.querySelector('#download-feedback').addEventListener('click', () => {
        const exportData = {...structuredClone(draft), schemaVersion: 3, round,
          videoReviews: videos.map(v => ({...v, vote: draft.videos[v.id] || null, comment: draft.videoComments[v.id] || ''})),
          clipReviews: clips.map(c => ({...c, ...clipValue(c.id)}))};
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url; link.download = `venture-${round.label.replace(' ', '-')}-feedback.json`; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        answerStatus.textContent = 'feedback download ready';
      });
      addEventListener('pagehide', () => {
        if (!HOSTED && draft.updatedAt) navigator.sendBeacon('api/feedback', new Blob([JSON.stringify(draft)], {type: 'application/json'}));
      });
      summary(); urlVerdicts();
      document.querySelectorAll('.clip-review button,.clip-review textarea,.review-finish button,.review-finish input,.review-finish textarea').forEach(element => { element.disabled = false; });
      status.textContent = 'feedback saves automatically in this browser';
      if (draft.updatedAt) persist();
    } catch (error) { status.textContent = 'could not load clip feedback. reload this page to try again.'; console.error(error); }
  }
  init();
})();
