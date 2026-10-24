(() => {
  'use strict';
  const HOSTED = !['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname);
  const KEY = `paulqc:${document.documentElement.dataset.boardId}:submissions`;
  let data = {submissions: [], removed: []}, clips = [], videos = [], lastRemoved;
  const status = document.querySelector('#results-status');
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  function remember() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} }
  async function post(action, row) {
    try {
      if (HOSTED) { remember(); render(); return; }
      const response = await fetch(`api/submissions/${action}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: row.name, ts: row.ts})});
      if (!response.ok) throw new Error(); data = await response.json();
    } catch { status.textContent = 'updated in this browser'; }
    remember(); render();
  }
  function render() {
    const root = document.querySelector('#saved-reviews'); root.replaceChildren();
    const rows = [...data.submissions].sort((a, b) => b.ts.localeCompare(a.ts));
    status.textContent = rows.length ? `${rows.length} saved review${rows.length === 1 ? '' : 's'}` : 'no saved reviews yet. tap save review on the video page.';
    rows.forEach(row => {
      const article = node('article', undefined, 'saved-review');
      article.append(node('h2', row.name), node('p', new Date(row.ts).toLocaleString('en-GB'), 'meta'));
      const choices = clips.filter(c => row.clips[c.id]?.reallyLiked || row.clips[c.id]?.liked || row.clips[c.id]?.disliked || row.clips[c.id]?.comment?.trim());
      const likedClips = choices.filter(c => row.clips[c.id]?.liked && !row.clips[c.id]?.disliked).length;
      const rejected = choices.filter(c => row.clips[c.id]?.disliked).length;
      const noted = choices.filter(c => row.clips[c.id]?.comment?.trim()).length;
      const videoChoices = videos.filter(v => ['really-like', 'like', 'dislike'].includes(row.videos?.[v.id]) || row.videoComments?.[v.id]?.trim());
      const likedVideos = videoChoices.filter(v => row.videos[v.id] === 'like').length;
      const dislikedVideos = videoChoices.filter(v => row.videos[v.id] === 'dislike').length;
      const videoNotes = videoChoices.filter(v => row.videoComments?.[v.id]?.trim()).length;
      article.append(node('p', `${Object.values(row.videos||{}).filter(v=>v==='really-like').length} videos really like · ${choices.filter(c=>row.clips[c.id]?.reallyLiked).length} clips really like · ${likedVideos} video${likedVideos === 1 ? '' : 's'} liked · ${dislikedVideos} video${dislikedVideos === 1 ? '' : 's'} disliked · ${videoNotes} video comment${videoNotes === 1 ? '' : 's'} · ${likedClips} clip${likedClips === 1 ? '' : 's'} liked · ${rejected} clip${rejected === 1 ? '' : 's'} disliked · ${noted} clip comment${noted === 1 ? '' : 's'}`, 'result-summary'));
      if (videoChoices.length) {
        const section = node('div', undefined, 'video-ratings'), list = node('ul');
        section.append(node('h3', 'whole videos'));
        videoChoices.forEach(video => {
          const li = node('li');
          const link = node('a', `sound ${video.sound} / v${video.variant} · ${video.label}`);
          link.href = `index.html#video-${video.id}`;
          const vote = row.videos[video.id];
          const heading = node('div', undefined, 'video-result-heading');
          heading.append(link, node('span', vote === 'really-like' ? 'really like' : vote === 'like' ? 'liked' : vote === 'dislike' ? 'disliked' : 'comment only', vote === 'really-like' ? 'status-really-liked' : vote === 'like' ? 'status-liked' : vote === 'dislike' ? 'status-disliked' : ''));
          li.append(heading);
          if (row.videoComments?.[video.id]) li.append(node('p', row.videoComments[video.id], 'video-result-note'));
          list.append(li);
        });
        section.append(list); article.append(section);
      }
      if (choices.length) {
        const table = node('table'), head = node('thead'), tr = node('tr');
        ['clip', 'choice', 'comment'].forEach(text => tr.append(node('th', text))); head.append(tr); table.append(head);
        const body = node('tbody');
        choices.forEach(clip => {
          const value = row.clips[clip.id], line = node('tr'), info = node('td');
          const image = node('img'); image.src = clip.frame; image.alt = `clip ${clip.number}`; image.className = 'results-thumb'; image.width = 42;
          const link = node('a', `sound ${clip.sound} / v${clip.variant} / clip ${clip.number}`); link.href = `index.html#video-${clip.video}`;
          info.append(image, link, node('span', `${clip.folder} · ${clip.timelineIn.toFixed(3)}s to ${clip.timelineOut.toFixed(3)}s`, 'clip-source'), node('span', clip.source, 'clip-source'));
          line.append(info, node('td', value.disliked ? 'disliked' : value.reallyLiked ? 'really like' : value.liked ? 'liked' : 'comment only', value.disliked ? 'status-disliked' : value.reallyLiked ? 'status-really-liked' : value.liked ? 'status-liked' : ''));
          const note = node('td'); if (value.comment) note.append(node('div', value.comment, 'note-cell')); line.append(note); body.append(line);
        });
        table.append(body); article.append(table);
      }
      if (row.overallComment) article.append(node('p', row.overallComment, 'overall-note'));
      const actions = node('div', undefined, 'review-actions');
      const download = node('a', 'download this review');
      download.href = URL.createObjectURL(new Blob([JSON.stringify(row, null, 2)], {type: 'application/json'})); download.download = 'venture-saved-review.json';
      const remove = node('button', 'remove saved review'); remove.type = 'button';
      remove.addEventListener('click', async () => {
        lastRemoved = row; data.submissions = data.submissions.filter(r => !(r.name === row.name && r.ts === row.ts));
        data.removed ||= []; data.removed.push(row); remember(); render();
        document.querySelector('#undo-remove').style.display = 'inline-block';
        await post('remove', row);
      });
      actions.append(download, remove); article.append(actions); root.append(article);
    });
  }
  document.querySelector('#undo-remove').addEventListener('click', async () => {
    if (!lastRemoved) return;
    data.submissions = data.submissions.filter(r => r.name.toLowerCase() !== lastRemoved.name.toLowerCase());
    data.submissions.unshift(lastRemoved); remember(); render();
    await post('restore', lastRemoved); lastRemoved = null; document.querySelector('#undo-remove').style.display = 'none';
  });
  (async () => {
    try {
      const manifest = await (await fetch('clip-review-manifest.json', {cache: 'no-store'})).json();
      clips = manifest.clips; videos = manifest.videos;
      try { data = JSON.parse(localStorage.getItem(KEY)) || data; } catch {}
      try {
        if (HOSTED) { render(); return; }
        const response = await fetch('api/submissions', {cache: 'no-store'});
        if (response.ok) { data = await response.json(); remember(); }
      } catch {}
      render();
    } catch { status.textContent = 'could not load saved reviews. reload to try again.'; }
  })();
})();
