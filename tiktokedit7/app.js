const $=s=>document.querySelector(s);
let manifest,registry,round,key,state,shots=[],submissions=[],timer,pending,previewBounds=new Map();
const empty=()=>({answers:{},videoAnswers:{},videoNotes:{},notes:{},overall:'',name:'',updated:''});
const el=reviewEl;
const seconds=n=>Number(n).toFixed(6).replace(/0+$/,'').replace(/\.$/,'');
const timestamp=n=>`${Math.floor(n/60)}:${(n%60).toFixed(2).padStart(5,'0')}`;
function updateVote(button,selected,label){button.setAttribute('aria-pressed',String(selected));button.textContent=selected?(button.dataset.vote==='X'?'× disliked':'✓ liked'):label;}
function videoVotes(video){
  const group=el('div','video-vote');group.setAttribute('role','group');group.setAttribute('aria-label',`whole video feedback for ${video.label}`);
  function update(){for(const b of group.children)updateVote(b,state.videoAnswers[video.id]===b.dataset.vote,b.dataset.vote==='K'?'like video':'dislike video');}
  for(const [value,label] of [['K','like'],['X','dislike']]){const b=el('button',`vote-button ${label}`);b.type='button';b.dataset.vote=value;b.setAttribute('aria-label',`${label} ${video.label} video`);b.addEventListener('click',()=>{state.videoAnswers[video.id]=state.videoAnswers[video.id]===value?'-':value;update();persist();});group.append(b);}
  update();return group;
}
function updateClip(shot,node){
  const vote=state.answers[shot.id],comment=Boolean(state.notes[shot.id]?.trim());
  node.classList.toggle('disliked',vote==='X');node.classList.toggle('liked',vote==='K');node.classList.toggle('has-note',comment);
  const thumb=node.querySelector('.thumb');thumb.setAttribute('aria-pressed',String(vote==='X'));thumb.querySelector('.mark').textContent=vote==='X'?'×':'✓';
  updateVote(node.querySelector('.clip-like'),vote==='K','like');
  node.querySelector('.clip-status').textContent=vote==='X'?'disliked':vote==='K'?'liked':'';
  node.querySelector('.comment-toggle').textContent=comment?'comment ✓':'comment';
}
function summary(){
  const v=Object.values(state.videoAnswers),c=Object.values(state.answers),n=Object.values(state.notes).filter(s=>s.trim()).length+Object.values(state.videoNotes).filter(s=>s.trim()).length+(state.overall.trim()?1:0);
  $('#summary').replaceChildren(el('span','',`videos: ${v.filter(a=>a==='K').length} liked · ${v.filter(a=>a==='X').length} disliked`),el('span','',`clips: ${c.filter(a=>a==='K').length} liked · ${c.filter(a=>a==='X').length} disliked`),el('span','',`${n} ${n===1?'comment':'comments'}`));
}
function persist(){
  state.updated=new Date().toISOString();const ok=reviewStorage.set(key,state);
  const url=new URL(location.href);url.searchParams.set('round',round.id);url.searchParams.set('votes',shots.map(s=>state.answers[s.id]||'-').join(''));url.searchParams.set('videoVotes',manifest.videos.map(v=>state.videoAnswers[v.id]||'-').join(''));url.searchParams.set('at',state.updated);history.replaceState(null,'',url);
  summary();$('#autosave').textContent=ok?'saving…':'saving… browser storage unavailable';clearTimeout(timer);timer=setTimeout(writeDraft,300);
}
async function writeDraft(){
  const saved=reviewStorage.set(key,state);
  $('#autosave').textContent=saved?'saved in this browser':'browser storage unavailable · download your feedback';
  return saved;
}
function previewTick(player){const b=previewBounds.get(player);if(!b)return;if(player.currentTime>=b.end-1/manifest.videos.find(v=>v.id===player.dataset.id).fps){player.pause();player.currentTime=Math.max(b.start,b.end-1/60);previewBounds.delete(player);return;}if(!player.paused)requestAnimationFrame(()=>previewTick(player));}
function renderClip(video,shot,player){
  const node=el('article','shot');node.dataset.id=shot.id;
  const thumb=el('button','thumb');thumb.type='button';thumb.setAttribute('aria-label',`dislike ${video.label}, clip ${shot.number}`);thumb.title='tap to dislike · tap again to undo';
  const image=el('img');image.src=shot.thumb;image.alt=`clip ${shot.number} in ${video.name}`;image.width=540;image.height=Math.round(540*video.height/video.width);image.loading='lazy';thumb.append(image,el('span','mark'));
  thumb.addEventListener('click',()=>{state.answers[shot.id]=state.answers[shot.id]==='X'?'-':'X';updateClip(shot,node);persist();});node.append(thumb);
  const caption=el('div','clip-label');caption.append(el('span','clip-number',`clip ${shot.number}`),el('span','clip-status'));node.append(caption);
  const watch=el('button','watch',`▶ ${timestamp(shot.start)}`);watch.type='button';watch.setAttribute('aria-label',`watch ${video.label}, clip ${shot.number}`);watch.addEventListener('click',()=>{previewBounds.set(player,{start:shot.start,end:shot.end});player.currentTime=shot.start;player.play().then(()=>previewTick(player)).catch(()=>{$('#status').textContent='press play on the video to watch this clip.'});});node.append(watch);
  const like=el('button','clip-like vote-button like');like.type='button';like.dataset.vote='K';like.setAttribute('aria-label',`like ${video.label}, clip ${shot.number}`);like.addEventListener('click',()=>{state.answers[shot.id]=state.answers[shot.id]==='K'?'-':'K';updateClip(shot,node);persist();});node.append(like);
  const note=el('textarea','clip-comment');note.id=`comment-${shot.id}`;note.rows=3;note.maxLength=12000;note.placeholder='add a comment';note.setAttribute('aria-label',`comment on ${video.label}, clip ${shot.number}`);note.value=state.notes[shot.id]||'';note.hidden=!note.value.trim();
  const comment=el('button','comment-toggle');comment.type='button';comment.setAttribute('aria-label',`add or edit comment for ${video.label}, clip ${shot.number}`);comment.setAttribute('aria-controls',note.id);comment.setAttribute('aria-expanded',String(!note.hidden));comment.addEventListener('click',()=>{note.hidden=!note.hidden;comment.setAttribute('aria-expanded',String(!note.hidden));if(!note.hidden)note.focus();});node.append(comment,note);
  note.addEventListener('input',()=>{state.notes[shot.id]=note.value;updateClip(shot,node);persist();});updateClip(shot,node);return node;
}
function renderVideo(video){
  const card=el('section','video-card');card.id=video.id;
  const heading=el('div','video-heading');heading.append(el('h2','',`${video.number}. ${video.name||video.label}`));
  const labels=el('div','video-labels');if(video.reference){const reference=el('a','',`ref: ${video.reference_label||video.label}`);reference.href=video.reference;reference.target='_blank';reference.rel='noreferrer';labels.append(reference);}if(video.variant)labels.append(el('span','',video.variant));heading.append(labels);card.append(heading);
  const player=el('video','player');player.controls=true;player.preload='none';player.playsInline=true;player.src=video.src;player.poster=video.poster;player.dataset.id=video.id;player.style.aspectRatio=`${video.width} / ${video.height}`;player.setAttribute('aria-label',`${video.label} edit`);card.append(player,videoVotes(video));
  const meta=el('div','video-meta');meta.append(el('span','',`${video.duration.toFixed(2)}s · ${video.width===2160?'4k':video.width+' × '+video.height} · ${video.fps}fps`));const download=el('a','','download video');download.href=video.src;download.download=video.filename;meta.append(download);card.append(meta);
  const grid=el('div','shots');for(const shot of video.shots)grid.append(renderClip(video,shot,player));card.append(grid);
  const label=el('label','video-comment-label','video comment');label.htmlFor=`note-${video.id}`;const note=el('textarea','video-comment');note.id=label.htmlFor;note.rows=2;note.maxLength=12000;note.placeholder='what do you think of the whole video?';note.setAttribute('aria-label',`comment on ${video.label} video`);note.value=state.videoNotes[video.id]||'';note.addEventListener('input',()=>{state.videoNotes[video.id]=note.value;persist();});card.append(label,note);
  player.addEventListener('play',()=>{for(const other of document.querySelectorAll('video'))if(other!==player)other.pause();});
  player.addEventListener('timeupdate',()=>{for(const node of grid.children){const shot=video.shots.find(s=>s.id===node.dataset.id);node.classList.toggle('active',player.currentTime>=shot.start&&player.currentTime<shot.end);}});
  player.addEventListener('error',()=>{meta.querySelector('span').textContent='video unavailable · try download';});return card;
}
function plain(){
  const report=reviewReport(manifest,state),lines=[`${manifest.title} · ${manifest.round_label}`,''];
  for(const video of report.videos){lines.push(`${video.name} (${video.filename})`,`reference: ${video.reference}`,`variant: ${video.variant}`,`whole video: ${video.vote}`);if(video.comment.trim())lines.push(`video comment: ${video.comment.trim()}`);
    for(const clip of video.clips){lines.push(`  clip ${clip.clipNumber}: ${clip.vote}`,`  video: ${seconds(clip.videoInSeconds)}s to ${seconds(clip.videoOutSeconds)}s (frames ${clip.videoInFrame} to ${clip.videoOutFrameExclusive}, end exclusive)`,`  source: ${clip.sourceFilename} from ${seconds(clip.sourceInSeconds)}s to ${seconds(clip.sourceOutSeconds)}s`);if(clip.comment.trim())lines.push(`  comment: ${clip.comment.trim()}`);}lines.push('');
  }if(state.overall.trim())lines.push('overall: '+state.overall.trim());return lines.join('\n');
}
async function save(){
  const button=$('#save');button.disabled=true;clearTimeout(timer);await writeDraft();
  const submission={name:state.name.trim()||'Anonymous',ts:new Date().toISOString(),roundId:round.id,ids:shots.map(s=>s.id),answers:shots.map(s=>state.answers[s.id]||'-'),clicked:{...state.answers},videoAnswers:{...state.videoAnswers},videoNotes:{...state.videoNotes},notes:{...state.notes},overall:state.overall};
  submissions=submissions.filter(s=>s.name.toLowerCase()!==submission.name.toLowerCase());submissions.unshift(submission);
  const saved=reviewStorage.set(key+':submissions',{submissions});
  $('#status').textContent=saved?'feedback saved in this browser. download it to share your notes.':'saving failed. use copy or download feedback.';
  button.disabled=false;
}
async function copy(){const text=plain();try{await navigator.clipboard.writeText(text);$('#status').textContent='feedback copied.';}catch{$('#copy-fallback').hidden=false;$('#copy-text').value=text;$('#copy-text').focus();$('#copy-text').select();let copied=false;try{copied=document.execCommand('copy')}catch{}$('#status').textContent=copied?'feedback copied.':'select and copy the feedback below.';}}
async function start(){
  try{
    ({manifest,registry,round}=await reviewRound());key='paulqc:'+manifest.id;shots=manifest.videos.flatMap(v=>v.shots);
    const local=reviewStorage.get(key,empty());submissions=reviewStorage.get(key+':submissions',{submissions:[]}).submissions;
    state={...empty(),...local};
    const shotIds=new Set(shots.map(s=>s.id)),videoIds=new Set(manifest.videos.map(v=>v.id));
    state.answers=Object.fromEntries(Object.entries(state.answers||{}).filter(([id])=>shotIds.has(id)).map(([id,v])=>[id,['K','X','-'].includes(v)?v:'-']));
    for(const [field,ids] of [['videoAnswers',videoIds],['notes',shotIds],['videoNotes',videoIds]])state[field]=Object.fromEntries(Object.entries(state[field]||{}).filter(([id])=>ids.has(id)));
    const url=new URL(location.href),seed=url.searchParams.get('votes'),videoSeed=url.searchParams.get('videoVotes');
    if(!state.updated||(url.searchParams.get('at')||'')>=state.updated){if(seed?.length===shots.length)shots.forEach((s,i)=>{if(['K','X','-'].includes(seed[i]))state.answers[s.id]=seed[i];});if(videoSeed?.length===manifest.videos.length)manifest.videos.forEach((v,i)=>{if(['K','X','-'].includes(videoSeed[i]))state.videoAnswers[v.id]=videoSeed[i];});}
    reviewRoundOptions(registry,round,$('#round'));$('#count').textContent=`${manifest.videos.length} videos · ${shots.length} clips`;$('#results-link').href=`results.html?round=${encodeURIComponent(round.id)}`;
    for(const video of manifest.videos)$('#videos').append(renderVideo(video));
    $('#overall').value=state.overall;$('#name').value=state.name;for(const field of ['overall','name'])$('#'+field).addEventListener('input',e=>{state[field]=e.target.value;persist();});
    $('#save').addEventListener('click',save);$('#copy').addEventListener('click',copy);$('#download').addEventListener('click',()=>{const report=reviewReport(manifest,state);report.savedReviews=submissions;reviewDownload(report,`navy-stripey-${round.id}-feedback.json`);$('#status').textContent='feedback downloaded.';});summary();reviewStorage.set(key,state);
    $('#autosave').textContent=state.updated?'saved in this browser':'';
    window.addEventListener('pagehide',()=>{clearTimeout(timer);reviewStorage.set(key,state);});
  }catch{$('#count').textContent='couldn’t load the videos. refresh the page and try again.';}
}
start();
