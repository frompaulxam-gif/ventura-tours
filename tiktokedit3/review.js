(() => {
  'use strict';
  const manifest = JSON.parse(document.getElementById('review-manifest').textContent);
  const storageKey = 'paulqc:' + manifest.boardId + ':clip-feedback';
  const isServer = false;
  let state = {boardId:manifest.boardId,items:{},videos:{},overall:{note:'',updatedAt:''}};
  let localOK = true, dirty = {}, saving = false, retryTimer, saveTimer;
  const status = document.getElementById('save-status');
  try { const saved=JSON.parse(localStorage.getItem(storageKey)); if(saved?.boardId===manifest.boardId) state={...state,...saved}; } catch(e) { localOK=false; }
  const stamp = () => new Date().toISOString();
  const itemValue = key => {
    const value={liked:false,disliked:false,note:'',...state.items[key]};
    if(value.disliked) value.liked=false;
    return value;
  };
  const videoValue = key => ({verdict:null,note:'',...state.videos[key]});
  function persistBrowser() {
    try {localStorage.setItem(storageKey, JSON.stringify(state));localOK=true;} catch(e) {localOK=false;}
  }
  function updateStatus(text) {status.textContent=text;}
  function changed(section,key,value) {
    value.updatedAt=stamp();
    if(section==='overall') {state.overall=value;dirty.overall=value;} else {state[section][key]=value;(dirty[section] ||= {})[key]=value;}
    state.updatedAt=value.updatedAt;
    persistBrowser();renderCounts();
    updateStatus(isServer?'saving…':localOK?'saved in this browser':'download feedback to save');
    if(isServer) {clearTimeout(saveTimer);saveTimer=setTimeout(sync,250);}
  }
  async function sync() {
    if(saving || !Object.keys(dirty).length) return;
    saving=true;
    const patch=dirty;dirty={};
    try {
      const response=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({boardId:manifest.boardId,...patch})});
      if(!response.ok) throw Error('save failed');
      updateStatus(Object.keys(dirty).length?'saving…':'saved locally');
    } catch(e) {
      for(const section of ['items','videos']) if(patch[section]) dirty[section]={...patch[section],...dirty[section]};
      if(patch.overall && !dirty.overall) dirty.overall=patch.overall;
      updateStatus(localOK?'saved in browser · retrying file save':'file save unavailable · download feedback');
      clearTimeout(retryTimer);retryTimer=setTimeout(()=>{retryTimer=undefined;sync();},3000);
    } finally {saving=false;if(Object.keys(dirty).length && !retryTimer) sync();}
  }
  function renderCounts() {
    const rejected=Object.values(state.items).filter(v=>v.disliked).length;
    const likedClips=Object.values(state.items).filter(v=>v.liked && !v.disliked).length;
    const comments=Object.values(state.items).filter(v=>v.note?.trim()).length+Object.values(state.videos).filter(v=>v.note?.trim()).length+(state.overall.note?.trim()?1:0);
    const likedVideos=Object.values(state.videos).filter(v=>v.verdict==='like').length;
    const dislikedVideos=Object.values(state.videos).filter(v=>v.verdict==='dislike').length;
    document.getElementById('feedback-count').textContent=`videos: ${likedVideos} liked · ${dislikedVideos} disliked / clips: ${likedClips} liked · ${rejected} disliked / ${comments} comment${comments===1?'':'s'}`;
  }
  function renderItem(key) {
    const value=itemValue(key);
    const frame=document.querySelector(`.clip-frame[data-key="${CSS.escape(key)}"]`);
    if(frame) {
      frame.setAttribute('aria-pressed',String(Boolean(value.disliked)));
      frame.dataset.liked=String(Boolean(value.liked));
    }
    const like=document.querySelector(`.clip-like[data-key="${CSS.escape(key)}"]`);
    if(like) {
      like.setAttribute('aria-pressed',String(Boolean(value.liked)));
      like.textContent=value.liked?'♥ liked':'♡ like';
    }
    const note=document.querySelector(`.note-toggle[data-key="${CSS.escape(key)}"]`);
    if(note) note.classList.toggle('has-note',Boolean(value.note?.trim()));
  }
  function hydrate() {
    document.querySelectorAll('.clip-frame').forEach(button=>renderItem(button.dataset.key));
    Object.keys(manifest.videos).forEach(renderVideo);
    document.querySelectorAll('.video-note').forEach(input=>input.value=state.videos[input.dataset.video]?.note || '');
    const overall=document.getElementById('overall-note');if(overall) overall.value=state.overall.note || '';
    renderCounts();if(document.body.dataset.view==='results') renderResults();
  }
  function renderVideo(key) {
    const value=videoValue(key);
    document.querySelectorAll(`.video-vote[data-video="${CSS.escape(key)}"]`).forEach(button=>button.setAttribute('aria-pressed',String(value.verdict===button.dataset.verdict)));
  }
  function entries() {
    return Object.entries(manifest.items).filter(([key])=>itemValue(key).liked || itemValue(key).disliked || itemValue(key).note?.trim()).map(([key,item])=>({...item,...itemValue(key),videoTitle:manifest.videos[item.video].title}));
  }
  function exportData() {
    return {boardId:manifest.boardId,exportedAt:stamp(),clips:entries(),videos:Object.entries(manifest.videos).filter(([key])=>videoValue(key).verdict || videoValue(key).note?.trim()).map(([key,video])=>({...video,...videoValue(key)})),overall:state.overall.note || ''};
  }
  function plainText() {
    const data=exportData(),lines=[manifest.title+' · feedback',''];
    data.clips.forEach(item=>{lines.push(`${item.videoTitle} · clip ${item.clip} · ${item.timelineIn.toFixed(2)}s to ${item.timelineOut.toFixed(2)}s${item.disliked?' · disliked':item.liked?' · liked':''}`);if(item.note?.trim()) lines.push(item.note);lines.push('');});
    data.videos.forEach(video=>{lines.push(video.title+' · whole video'+(video.verdict==='like'?' · liked':video.verdict==='dislike'?' · disliked':''));if(video.note?.trim())lines.push(video.note);lines.push('');});
    if(data.overall) lines.push('overall',data.overall,'');
    if(!data.clips.length && !data.videos.length && !data.overall) lines.push('no feedback yet');
    return lines.join('\n');
  }
  function renderResults() {
    const target=document.getElementById('feedback-results');target.replaceChildren();
    const data=exportData();
    function add(title,note,verdict,image) {
      const card=document.createElement('div');card.className='feedback-item';
      if(image) {const img=document.createElement('img');img.src=image;img.alt=title;card.append(img);}
      const text=document.createElement('div'),heading=document.createElement('h3');heading.textContent=title;text.append(heading);
      if(verdict) {const result=document.createElement('div');result.className='status'+(verdict==='like'?' liked':'');result.textContent=verdict==='like'?'liked':'disliked';text.append(result);}
      if(note) {const para=document.createElement('p');para.className='comment';para.textContent=note;text.append(para);}
      card.append(text);target.append(card);
    }
    data.clips.forEach(item=>add(`${item.videoTitle} · clip ${item.clip} · ${item.timelineIn.toFixed(2)}s`,item.note,item.disliked?'dislike':item.liked?'like':null,item.thumbnail));
    data.videos.forEach(video=>add(video.title+' · whole video',video.note,video.verdict,video.poster));
    if(data.overall) add('overall',data.overall,false);
    if(!target.childElementCount) {const p=document.createElement('p');p.className='empty';p.textContent='no feedback yet. rate a video, tap clip frames or add comments on the video page.';target.append(p);}
  }
  document.querySelectorAll('.clip-frame').forEach(button=>button.addEventListener('click',()=>{
    const key=button.dataset.key,value=itemValue(key);
    changed('items',key,{...value,liked:false,disliked:!value.disliked});renderItem(key);
  }));
  document.querySelectorAll('.clip-like').forEach(button=>button.addEventListener('click',()=>{
    const key=button.dataset.key,value=itemValue(key);
    changed('items',key,{...value,liked:!value.liked,disliked:false});renderItem(key);
  }));
  document.querySelectorAll('.video-vote').forEach(button=>button.addEventListener('click',()=>{
    const key=button.dataset.video,value=videoValue(key);
    changed('videos',key,{...value,verdict:value.verdict===button.dataset.verdict?null:button.dataset.verdict});renderVideo(key);
  }));
  document.querySelectorAll('.note-toggle').forEach(button=>button.addEventListener('click',()=>{
    const key=button.dataset.key,article=button.closest('article'),panel=article.querySelector('.clip-note'),input=panel.querySelector('textarea');
    article.querySelectorAll('.note-toggle').forEach(b=>b.setAttribute('aria-expanded',String(b===button)));
    panel.hidden=false;panel.dataset.key=key;input.value=itemValue(key).note || '';
    const label=`clip ${manifest.items[key].clip} comment`;
    panel.querySelector('label').textContent=label;input.setAttribute('aria-label',`${label} for ${manifest.videos[manifest.items[key].video].title}`);input.focus();
  }));
  document.querySelectorAll('.clip-note-input').forEach(input=>input.addEventListener('input',()=>{const key=input.closest('.clip-note').dataset.key;changed('items',key,{...itemValue(key),note:input.value});renderItem(key);}));
  document.querySelectorAll('.close-note').forEach(button=>button.addEventListener('click',()=>{const article=button.closest('article'),panel=button.closest('.clip-note'),trigger=article.querySelector(`.note-toggle[data-key="${CSS.escape(panel.dataset.key)}"]`);panel.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus();}));
  document.querySelectorAll('.video-note').forEach(input=>input.addEventListener('input',()=>changed('videos',input.dataset.video,{...videoValue(input.dataset.video),note:input.value})));
  document.getElementById('overall-note')?.addEventListener('input',event=>changed('overall',null,{note:event.target.value}));
  document.getElementById('copy-feedback').addEventListener('click',async event=>{
    try {await navigator.clipboard.writeText(plainText());event.target.textContent='copied';setTimeout(()=>event.target.textContent='copy feedback',1800);} catch(e) {document.getElementById('copy-fallback').hidden=false;const input=document.getElementById('copy-text');input.value=plainText();input.focus();input.select();}
  });
  document.getElementById('download-feedback').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(exportData(),null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='clip feedback.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  document.querySelectorAll('video').forEach(video=>video.addEventListener('play',()=>document.querySelectorAll('video').forEach(other=>{if(other!==video) other.pause();})));
  addEventListener('pagehide',()=>{if(isServer && Object.keys(dirty).length) navigator.sendBeacon('/api/feedback',new Blob([JSON.stringify({boardId:manifest.boardId,...dirty})],{type:'application/json'}));});
  addEventListener('storage',event=>{if(event.key===storageKey && !Object.keys(dirty).length && !saving) {try {state=JSON.parse(event.newValue)||state;hydrate();}catch(e){}}});
  async function initialise() {
    hydrate();
    if(!isServer) {document.getElementById('file-mode')?.removeAttribute('hidden');updateStatus(localOK?'saved in this browser':'download feedback to save');return;}
    try {
      const response=await fetch('/api/feedback',{cache:'no-store'});if(!response.ok) throw Error('load failed');const remote=await response.json();
      for(const section of ['items','videos']) for(const [key,value] of Object.entries(remote[section]||{})) if(!state[section][key] || value.updatedAt>state[section][key].updatedAt) state[section][key]=value;
      if(remote.overall?.updatedAt>state.overall.updatedAt) state.overall=remote.overall;
      for(const section of ['items','videos']) for(const [key,value] of Object.entries(state[section])) if(!remote[section]?.[key] || value.updatedAt>remote[section][key].updatedAt) (dirty[section] ||= {})[key]=value;
      if(state.overall.updatedAt && (!remote.overall?.updatedAt || state.overall.updatedAt>remote.overall.updatedAt)) dirty.overall=state.overall;
      persistBrowser();hydrate();updateStatus('saved locally');if(Object.keys(dirty).length) sync();
    } catch(e) {updateStatus(localOK?'saved in browser · file save unavailable':'file save unavailable · download feedback');}
  }
  initialise();
})();
