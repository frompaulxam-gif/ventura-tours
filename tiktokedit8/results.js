'use strict';
const escapeText = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let feedbackData, reviews = [];
function renderResult() {
  const review = reviews[Number(document.querySelector('#result-name').value)];
  document.querySelector('#results').innerHTML = review ? `<p class="source">${escapeText(review.name || 'anonymous')} · ${escapeText(review.updatedAt || review.savedAt || '')}</p>${review.videos.map(video => `<section class="result"><h2>${escapeText(video.videoName)}</h2><p class="${escapeText(video.choice)}">whole video: ${escapeText(video.choice)}</p>${video.comment ? `<p class="note">${escapeText(video.comment)}</p>` : ''}<ol>${video.clips.map(clip => `<li><span class="${escapeText(clip.choice)}">clip ${clip.clipNumber}: ${escapeText(clip.choice)}</span>${clip.comment ? `<p class="note">${escapeText(clip.comment)}</p>` : ''}<p class="source">${escapeText(clip.sourceFilename)} · source ${clip.sourceInSeconds} to ${clip.sourceOutSeconds}s<br>video ${clip.timelineInSeconds} to ${clip.timelineOutSeconds}s · frames ${clip.timelineInFrame} to ${clip.timelineOutFrame}</p></li>`).join('')}</ol></section>`).join('')}<section class="result"><h2>overall comment</h2><p class="note">${escapeText(review.overallComment || '')}</p></section>` : '';
}
(async () => {
  try {
    feedbackData = await window.REVIEW_STORE.read();
    reviews = [
      ...feedbackData.submissions.map(r => ({...r, label: `${r.name || 'anonymous'} · sent`})),
      ...Object.values(feedbackData.drafts).map(r => ({...r.feedback, label: `${r.feedback.name || 'anonymous'} · latest`})),
    ].sort((a,b) => (b.updatedAt || b.savedAt || '').localeCompare(a.updatedAt || a.savedAt || ''));
    document.querySelector('#result-name').innerHTML = reviews.map((r,n) => `<option value="${n}">${escapeText(r.label)}</option>`).join('');
    document.querySelector('#status').textContent = reviews.length ? `${reviews.length} saved reviews` : 'no feedback yet.';
    document.querySelector('#result-name').onchange = renderResult;
    renderResult();
  } catch {
    document.querySelector('#status').textContent = 'could not load feedback. try refreshing.';
  }
})();
document.querySelector('#export').onclick = () => {
  if (!feedbackData) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(feedbackData,null,2)], {type:'application/json'}));
  const a = document.createElement('a');a.href=url;a.download='tiktokedit8-all-feedback.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
