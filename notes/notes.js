'use strict';
const $=id=>document.getElementById(id);
let unpersistedAudio=false;
let deletedNote=null;
const DRAFT_META='jarvis-notes-draft-meta-v2';
function londonDay(value=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value))}
let selectedDay=londonDay(),draftMeta=null,rollingDay=false;
function newDraftMeta(){return {id:crypto.randomUUID(),day:londonDay(),createdAt:new Date().toISOString(),revision:0}}
function rememberDraftMeta(){try{localStorage.setItem(DRAFT_META,JSON.stringify(draftMeta))}catch{}}
function resetDraftMeta(){draftMeta=newDraftMeta();rememberDraftMeta()}
function noteDay(note){return note.day||londonDay(note.createdAt)}
let hasCaptureLock=false,requestingLock=false,releaseCaptureLock=null;
let db,recording=null,stream=null,draftAudio=null,busy=false,recordingBusy=false,stopTimer=null,timer=null,started=0,previewURL=null,notesURLs=[];
const DRAFT='jarvis-notes-text-v1', AUDIO_DRAFT='__audio_draft__',MAX_AUDIO=25*1024*1024;
function feedback(message,error=false){$('feedback').textContent=message;$('feedback').classList.toggle('error',error)}
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('jarvis-phone-notes',1);r.onupgradeneeded=()=>r.result.createObjectStore('notes',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('Storage is busy in another window.'))})}
function transaction(mode,fn){return new Promise((resolve,reject)=>{const tx=db.transaction('notes',mode);let result;try{result=fn(tx.objectStore('notes'))}catch(e){tx.abort();reject(e);return}tx.oncomplete=()=>resolve(result?.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Save interrupted'))})}
function mutateNote(id,change,removeAudioDraft=false){return new Promise((resolve,reject)=>{const tx=db.transaction('notes','readwrite'),store=tx.objectStore('notes'),request=store.get(id);let result;request.onsuccess=()=>{result=change(request.result);if(result)store.put(result);if(removeAudioDraft)store.delete(AUDIO_DRAFT)};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Save interrupted'))})}
function persistDraft(){
 if(!db||!hasCaptureLock||!draftMeta||(!draftMeta.revision&&!hasNoteText($('note-text').value)&&!draftAudio))return Promise.resolve();
 const snapshot={...draftMeta,text:cleanBoxes($('note-text').value),audio:draftAudio,state:'inbox',isDraft:true,revision:Math.max(1,draftMeta.revision),deletedAt:null};
 if(!hasNoteText(snapshot.text)&&!snapshot.audio)snapshot.deletedAt=new Date().toISOString();
 return mutateNote(snapshot.id,current=>{const revision=Math.max(snapshot.revision,(current?.revision||0)+1);if(draftMeta?.id===snapshot.id){draftMeta.revision=Math.max(draftMeta.revision,revision);rememberDraftMeta()}return {...current,...snapshot,revision,syncVersion:current?.syncVersion||0,syncedRevision:current?.syncedRevision||0}});
}
function updateButtons(){const past=selectedDay!==londonDay();$('note-text').hidden=past;$('draft-audio').hidden=past||!draftAudio;$('record').hidden=past;$('save').hidden=past;const active=recordingBusy||recording?.state==='recording';$('save').disabled=!db||busy||active;const mutationDisabled=!hasCaptureLock||!db||busy||!!active;$('undo-delete').disabled=mutationDisabled;document.querySelectorAll('[data-note-mutation]').forEach(button=>{button.disabled=mutationDisabled});$('record').disabled=!db||busy||(!active&&!!draftAudio);$('note-text').readOnly=!hasCaptureLock||!db||busy;$('record').setAttribute('aria-pressed',String(!!active));$('record').querySelector('span').textContent=active?'stop recording':draftAudio?'voice attached':'record voice'}
function showAudio(){if(previewURL)URL.revokeObjectURL(previewURL);previewURL=draftAudio?URL.createObjectURL(draftAudio):null;$('draft-audio').hidden=!draftAudio;if(previewURL)$('draft-player').src=previewURL;else $('draft-player').removeAttribute('src');updateButtons()}
function saveTextDraft(){if(!hasCaptureLock)return;try{localStorage.setItem(DRAFT,$('note-text').value);if(draftMeta){draftMeta.revision++;rememberDraftMeta()}void persistDraft().then(queueSync).catch(()=>feedback('Draft is on this device, but online backup is waiting. Keep this page open.',true));return true}catch{feedback('Draft backup unavailable. Keep this page open until your note is saved.',true);return false}}
function stopRecording(){if(recording?.state==='recording'){recording.stop();clearTimeout(stopTimer);clearInterval(timer);$('recording-line').textContent='finishing your recording…';$('record').disabled=true}}
async function startRecording(){if(recordingBusy)return;if(recording?.state==='recording'){stopRecording();return}if(draftAudio||busy)return;if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){feedback('Voice recording is not available here. You can use the microphone on your iPhone keyboard to dictate text.',true);return}
 recordingBusy=true;updateButtons();feedback('Allow microphone access to record.');
 try{stream=await navigator.mediaDevices.getUserMedia({audio:true});if(document.hidden){stream.getTracks().forEach(t=>t.stop());throw new Error('hidden')}
 const mime=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t));const rec=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);recording=rec;let chunks=[],bytes=0,checkpoints=Promise.resolve();
 rec.ondataavailable=e=>{if(e.data.size){chunks.push(e.data);bytes+=e.data.size;const checkpoint=new Blob(chunks,{type:rec.mimeType||mime||'audio/mp4'});checkpoints=checkpoints.then(()=>transaction('readwrite',s=>s.put({id:AUDIO_DRAFT,audio:checkpoint,partial:true,createdAt:new Date().toISOString()}))).catch(()=>feedback('Recording backup failed. Stop and save before leaving this page.',true));if(bytes>MAX_AUDIO)stopRecording()}};
 rec.onerror=()=>{feedback('Recording was interrupted. Any captured audio will be kept when it finishes.',true);stopRecording()};
 rec.onstop=async()=>{clearTimeout(stopTimer);clearInterval(timer);stream?.getTracks().forEach(t=>t.stop());recording=null;recordingBusy=true;$('recording-line').hidden=true;draftAudio=new Blob(chunks,{type:rec.mimeType||mime||'audio/mp4'});unpersistedAudio=!!draftAudio.size;if(!draftAudio.size){draftAudio=null;feedback('No audio was captured. Try again.',true)}else{try{await checkpoints;await transaction('readwrite',store=>store.put({id:AUDIO_DRAFT,audio:draftAudio,createdAt:new Date().toISOString()}));unpersistedAudio=false;if(draftMeta){draftMeta.revision++;rememberDraftMeta()}await persistDraft();queueSync();feedback('voice attached.')}catch{feedback('Audio is attached, but its draft backup failed. Save now or keep this page open.',true)}}recordingBusy=false;showAudio();releaseIfHidden()};
 rec.start(2000);recordingBusy=false;started=Date.now();$('recording-line').hidden=false;$('recording-line').textContent='recording · 0:00';timer=setInterval(()=>{const seconds=Math.floor((Date.now()-started)/1000);$('recording-line').textContent=`recording · ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} · keep this page open`;},500);stopTimer=setTimeout(stopRecording,5*60*1000);feedback('keep this page open. stop and wait for “voice attached” before leaving. limit: 5 minutes.');updateButtons();
 }catch{stream?.getTracks().forEach(t=>t.stop());recordingBusy=false;recording=null;updateButtons();feedback('Microphone unavailable or permission was declined. Your typed note is still here. You can also dictate using the keyboard microphone.',true);releaseIfHidden()}}
function audioExtension(blob){return blob.type.includes('mp4')?'m4a':blob.type.includes('ogg')?'ogg':'webm'}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
async function copyText(text){try{await navigator.clipboard.writeText(text);feedback('copied. paste into your AI chat when you’re ready.')}catch{$('copy-text').value=text;$('copy-dialog').showModal();$('copy-text').select()}}
async function renderNotes(){const all=await transaction('readonly',s=>s.getAll());deletedNote=all.filter(n=>n.id!==AUDIO_DRAFT&&n.id!==draftMeta?.id&&n.deletedAt).sort((a,b)=>b.deletedAt.localeCompare(a.deletedAt))[0]||null;$('delete-status').hidden=!deletedNote;const days=[...new Set([londonDay(),...all.filter(n=>n.id!==AUDIO_DRAFT&&!n.deletedAt).map(noteDay)])].sort().reverse();$('note-day').replaceChildren();for(const day of days){const option=document.createElement('option');option.value=day;option.textContent=day===londonDay()?'today':new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/London'}).format(new Date(day+'T12:00:00Z'));$('note-day').append(option)}if(!days.includes(selectedDay))selectedDay=londonDay();$('note-day').value=selectedDay;updateButtons();const notes=all.filter(n=>n.id!==AUDIO_DRAFT&&n.id!==draftMeta?.id&&!n.deletedAt&&(hasNoteText(n.text||'')||n.audio)&&noteDay(n)===selectedDay).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));notesURLs.forEach(URL.revokeObjectURL);notesURLs=[];$('notes').replaceChildren();if(!notes.length)return;
 for(const note of notes){const item=document.createElement('article');item.className='note';const body=document.createElement('p');body.className='note-body';body.textContent=displayNote(note.text);item.append(body);
 if(note.audio){const audio=document.createElement('audio');audio.controls=true;audio.preload='metadata';const url=URL.createObjectURL(note.audio);notesURLs.push(url);audio.src=url;item.append(audio)}
 const actions=document.createElement('details');actions.className='note-actions';const summary=document.createElement('summary');summary.textContent='•••';summary.setAttribute('aria-label','Note options');actions.append(summary);if(note.text){const copy=document.createElement('button');copy.type='button';copy.className='quiet';copy.textContent='copy for AI';copy.onclick=()=>copyText(`Help me clarify this note before turning it into a task. Ask only what is missing, with concrete numbered options and a free-text option. Do not execute any action yet.\n\nOriginal note:\n${note.text}`);actions.append(copy)}if(note.audio){const audio=document.createElement('button');audio.type='button';audio.className='quiet';audio.textContent='save audio file';audio.onclick=()=>download(note.audio,`jarvis-note-${note.createdAt.slice(0,10)}.${audioExtension(note.audio)}`);actions.append(audio)}const remove=document.createElement('button');remove.type='button';remove.className='quiet delete-note';remove.textContent='delete note';remove.setAttribute('data-note-mutation','');remove.disabled=!hasCaptureLock||!db||busy||recordingBusy||!!recording;remove.onclick=()=>changeDeleted(note,true);actions.append(remove);item.append(actions);$('notes').append(item)}
}
async function saveNote(event){event.preventDefault();if(!hasCaptureLock||busy||recordingBusy||recording||!db)return;const text=$('note-text').value;if(!hasNoteText(text)&&!draftAudio){feedback('add a thought or record a voice note first.',true);$('note-text').focus();return}if(text.length>10000){feedback('Keep each note under 10,000 characters.',true);return}busy=true;updateButtons();feedback('saving…');const note={id:draftMeta.id,syncVersion:draftMeta.syncVersion||0,text:hasNoteText(text)?cleanBoxes(text):'',audio:draftAudio,createdAt:draftMeta.createdAt,day:draftMeta.day,revision:draftMeta.revision+1,state:'inbox'};let committed=false;
 try{await mutateNote(note.id,current=>({...note,syncVersion:current?.syncVersion||0}),true);committed=true;$('note-text').value='';resetDraftMeta();try{localStorage.removeItem(DRAFT)}catch{}draftAudio=null;unpersistedAudio=false;showAudio();feedback('saved.');await renderNotes();queueSync();navigator.storage?.persist?.().catch(()=>{});}catch{feedback(committed?'Your note was saved, but the inbox could not refresh. Reload to see it.':'Could not save. Your text and recording are still here. Keep this page open and try again.',true)}finally{busy=false;updateButtons();if(committed&&!document.hidden){$('note-text').focus();revealDraft()}releaseIfHidden()}}
function toDataURL(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob)})}
async function backup(){if(!db||busy||recording||recordingBusy){feedback('finish recording or saving before exporting.',true);return}$('backup').disabled=true;try{const rows=await transaction('readonly',s=>s.getAll());const notes=[];for(const n of rows)notes.push({...n,audio:n.audio?await toDataURL(n.audio):null});download(new Blob([JSON.stringify({format:'jarvis-phone-notes',version:1,exportedAt:new Date().toISOString(),draftText:$('note-text').value,notes},null,2)],{type:'application/json'}),`jarvis-notes-${new Date().toISOString().slice(0,10)}.json`);feedback('backup prepared with your notes, recordings and current draft. keep the downloaded file safe.')}catch{feedback('Backup failed. Your notes are still on this device. Try again.',true)}finally{$('backup').disabled=false}}
$('capture').addEventListener('submit',saveNote);$('note-text').addEventListener('input',()=>{resizeDraft();saveTextDraft()});$('record').addEventListener('click',startRecording);$('backup').addEventListener('click',backup);$('copy-close').onclick=()=>$('copy-dialog').close();document.addEventListener('visibilitychange',()=>{if(document.hidden){stopRecording();releaseIfHidden()}else acquireCaptureLock()});window.addEventListener('pagehide',()=>{stopRecording();saveTextDraft()});window.addEventListener('beforeunload',e=>{if(recording||recordingBusy||busy){e.preventDefault();e.returnValue=''}});
async function initialise(){updateButtons();try{db=await openDB();db.onversionchange=()=>{db.close();db=null;updateButtons();feedback('Notes storage changed in another window. Reload this page before saving.',true)};try{draftMeta=JSON.parse(localStorage.getItem(DRAFT_META)||'null')||newDraftMeta();rememberDraftMeta();$('note-text').value=cleanBoxes(localStorage.getItem(DRAFT)||'')}catch{draftMeta=newDraftMeta()}const stored=await transaction('readonly',s=>s.get(draftMeta.id));if(stored&&!stored.isDraft){if(cleanBoxes($('note-text').value)===cleanBoxes(stored.text||'')){$('note-text').value='';try{localStorage.removeItem(DRAFT)}catch{}}resetDraftMeta()}const draft=await transaction('readonly',s=>s.get(AUDIO_DRAFT));draftAudio=draft?.audio||null;showAudio();await rolloverDay();await renderNotes();resizeDraft();revealDraft();if(hasNoteText($('note-text').value)||draftAudio)feedback(draft?.partial?'recovered an interrupted recording. it may be incomplete or unplayable. check playback before saving.':'your unfinished note is back.');else feedback('');}catch{feedback('Device storage is unavailable. Notes cannot be saved here. Try a normal Safari window with storage enabled.',true)}updateButtons();focusDraft();await persistDraft();void connectAndSync();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});}
function releaseIfHidden(){if(!document.hidden||!hasCaptureLock||busy||recording||recordingBusy||syncRunning||unpersistedAudio||!releaseCaptureLock)return;if(!saveTextDraft())return;hasCaptureLock=false;db?.close();db=null;updateButtons();feedback('capture paused while this window is in the background.');const release=releaseCaptureLock;releaseCaptureLock=null;release()}
function acquireCaptureLock(){if(hasCaptureLock||requestingLock||document.hidden)return;if(!navigator.locks){feedback('This browser cannot protect drafts across windows. Open this page in an up-to-date Safari browser.',true);$('backup').disabled=true;return}requestingLock=true;feedback('opening your notes…');navigator.locks.request('jarvis-notes-capture',{mode:'exclusive'},async lock=>{requestingLock=false;if(!lock){feedback('Notes is already open in another window. Finish there, or close it and reload this page.',true);return}if(document.hidden)return;hasCaptureLock=true;$('backup').disabled=false;await initialise();await new Promise(resolve=>{releaseCaptureLock=resolve;releaseIfHidden()});}).catch(()=>{requestingLock=false;feedback('Could not secure the note editor. Close other notes windows and reload.',true)})}
updateButtons();acquireCaptureLock();

function cleanBoxes(value){return (value||'').replace(/^([ \t]*)(?:☐|\[\s?\]) ?/gm,'$1')}
function hasNoteText(value){return cleanBoxes(value).trim().length>0}
function displayNote(value){return cleanBoxes(value).trim()||'voice note'}
function resizeDraft(){const input=$('note-text');input.style.height='auto';input.style.height=Math.max(120,input.scrollHeight)+'px'}
function revealDraft(){resizeDraft();const box=$('notebook');box.scrollTop=box.scrollHeight}
function focusDraft(){
 if(document.hidden||!hasCaptureLock||!db||busy||recordingBusy||recording)return;
 const input=$('note-text');if(input.readOnly)return;
 input.focus({preventScroll:true});
 input.setSelectionRange(input.value.length,input.value.length);
 revealDraft();
}
window.addEventListener('pageshow',event=>{if(event.persisted)focusDraft()});

async function changeDeleted(note,deleted){
 if(!note||note.id===AUDIO_DRAFT||!hasCaptureLock||!db||busy||recordingBusy||recording)return;
 busy=true;updateButtons();let committed=false;
 const updated={...note,deletedAt:deleted?new Date().toISOString():null,revision:(note.revision||1)+1};
 try{
  await mutateNote(updated.id,current=>({...updated,syncVersion:current?.syncVersion||0,revision:Math.max(updated.revision,(current?.revision||0)+1)}));committed=true;
  if(deleted){deletedNote=updated;$('delete-status').hidden=false}
  feedback(deleted?'':'note restored.');
  await renderNotes();queueSync();
 }catch{
  feedback(committed?'Change saved. Reload to refresh your notes.':deleted?'Could not delete. Your note is still saved.':'Could not restore. Tap undo to try again.',true);
 }finally{busy=false;updateButtons();releaseIfHidden()}
}
$('undo-delete').addEventListener('click',()=>changeDeleted(deletedNote,false));

async function rolloverDay(){
 if(rollingDay||!draftMeta||!hasCaptureLock||busy||recordingBusy||recording)return;
 if(draftMeta.day===londonDay())return;
 rollingDay=true;try{if(hasNoteText($('note-text').value)||draftAudio){await saveNote({preventDefault(){}})}else resetDraftMeta();if(draftMeta.day===londonDay()){selectedDay=londonDay();await renderNotes()}}finally{rollingDay=false}
}
$('note-day').addEventListener('change',async()=>{selectedDay=$('note-day').value;await renderNotes();if(selectedDay===londonDay())focusDraft()});
$('go-today').onclick=async()=>{selectedDay=londonDay();await rolloverDay();await renderNotes();focusDraft()};
setInterval(()=>{if(!document.hidden&&db)void rolloverDay()},15000);

// Private cloud storage. The public shell never contains a credential.
const SYNC_API='https://jarvis-notes-api.raspy-waterfall-454f.workers.dev';
const LOGIN_URL='https://jarvis-notes-login.raspy-waterfall-454f.workers.dev';
const SESSION_KEY='jarvis-notes-session-v1', LOGIN_KEY='jarvis-notes-login-v1', AUDIO_CHUNK=1024*1024;
let syncTimer=null,syncRunning=false,syncAgain=false;
const hexBytes=value=>Array.from(new Uint8Array(value),x=>x.toString(16).padStart(2,'0')).join('');
const hashValue=async value=>hexBytes(await crypto.subtle.digest('SHA-256',typeof value==='string'?new TextEncoder().encode(value):value));
function syncStatus(text,error=false){$('sync-status').textContent=text;$('sync-status').classList.toggle('error',error);$('sync-status').classList.toggle('synced',text==='saved online')}
function savedSession(){try{const s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');return s?.token&&s.expires>Date.now()?s:null}catch{return null}}
async function signIn(){
 if(recording||recordingBusy||busy){feedback('finish recording or saving before signing in.',true);return}
 saveTextDraft();const verifier=hexBytes(crypto.getRandomValues(new Uint8Array(32))),state=hexBytes(crypto.getRandomValues(new Uint8Array(32)));
 try{localStorage.setItem(LOGIN_KEY,JSON.stringify({verifier,state,createdAt:Date.now()}));location.assign(LOGIN_URL+'/?challenge='+await hashValue(verifier)+'&state='+state)}catch{feedback('Could not start sign in. Allow storage in this browser and try again.',true)}
}
async function api(path,options={}){const s=savedSession();if(!s)throw Error('signin');const r=await fetch(SYNC_API+path,{...options,cache:'no-store',headers:{...options.headers,Authorization:'Bearer '+s.token},signal:AbortSignal.timeout(45000)});if(r.status===401){localStorage.removeItem(SESSION_KEY);throw Error('signin')}if(r.status===409){const error=await r.json().catch(()=>({}));throw Error(error.error==='Note changed on another device'?'conflict':'upload')}if(!r.ok)throw Error('upload');return r}
function queueSync(){clearTimeout(syncTimer);if(savedSession())syncStatus('waiting to save…');syncTimer=setTimeout(()=>void syncNotes(),1200)}
async function connectAndSync(){
 const params=new URLSearchParams(location.hash.slice(1));
 if(params.has('code')){
  const code=params.get('code'),state=params.get('state');history.replaceState(null,'',location.pathname+location.search);
  try{const login=JSON.parse(localStorage.getItem(LOGIN_KEY)||'null');if(!login||state!==login.state||Date.now()-login.createdAt>20*60*1000)throw Error('state');
   const r=await fetch(SYNC_API+'/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,verifier:login.verifier}),signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('login');const session=await r.json();localStorage.setItem(SESSION_KEY,JSON.stringify(session));localStorage.removeItem(LOGIN_KEY);
  }catch{syncStatus('sign in again',true);return}
 }
 await syncNotes();
}
async function uploadAudio(audio){if(!audio)return null;if(audio.size>MAX_AUDIO)throw Error('audio');const hash=await hashValue(await audio.arrayBuffer()),manifest=await (await api(`/audio/${hash}`)).json();if(manifest.complete&&manifest.size===audio.size)return {hash,size:audio.size,type:audio.type||'audio/mp4'};for(let part=0;part<Math.ceil(audio.size/AUDIO_CHUNK);part++)await api(`/audio/${hash}/${part}`,{method:'PUT',body:audio.slice(part*AUDIO_CHUNK,(part+1)*AUDIO_CHUNK)});return {hash,size:audio.size,type:audio.type||'audio/mp4'}}
async function downloadAudio(meta){if(!meta)return null;const parts=[];for(let i=0;i<Math.ceil(meta.size/AUDIO_CHUNK);i++)parts.push(await (await api(`/audio/${meta.hash}/${i}`)).arrayBuffer());const blob=new Blob(parts,{type:meta.type});if(blob.size!==meta.size||await hashValue(await blob.arrayBuffer())!==meta.hash)throw Error('audio');return blob}
function cloudNote(row,audio){return {id:row.id,text:row.text||'',day:noteDay(row),createdAt:row.createdAt,revision:row.revision||1,isDraft:!!row.isDraft,deletedAt:row.deletedAt||null,audio}}
async function syncNotes(){
 if(syncRunning){syncAgain=true;return}if(!db||!hasCaptureLock)return;if(!savedSession()){syncStatus('sign in to save online');return}if(navigator.onLine===false){syncStatus('saved here · offline');return}
 syncRunning=true;syncAgain=false;syncStatus('saving online…');let changed=false;
 try{
  // Upload only dirty records. An acknowledgement never clears a newer local edit.
  const rows=await transaction('readonly',store=>store.getAll());
  for(const row of rows){if(row.id===AUDIO_DRAFT||row.conflict||row.syncedRevision===(row.revision||1))continue;
   const audio=await uploadAudio(row.audio);const sent=cloudNote(row,audio);
   let ack;try{ack=await (await api('/notes',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({note:sent,expected:row.syncVersion||0})})).json()}catch(e){if(e.message!=='conflict')throw e;await mutateNote(row.id,current=>current?{...current,conflict:true}:null);continue}
   await mutateNote(row.id,current=>current?{...current,syncVersion:ack.version,syncedRevision:sent.revision}:null);
  }
  let after='';do{const page=await (await api('/notes'+(after?'?after='+encodeURIComponent(after):''))).json();
   for(const remote of page.notes){if(remote.id===draftMeta?.id)continue;const local=await transaction('readonly',store=>store.get(remote.id));if(local&&(local.syncedRevision!==(local.revision||1)||local.syncVersion>=remote.serverVersion))continue;
    const audio=remote.audio?await downloadAudio(remote.audio):null;
    await mutateNote(remote.id,current=>{if(current&&(current.syncedRevision!==(current.revision||1)||current.syncVersion>=remote.serverVersion))return null;changed=true;return {...remote,audio,state:'inbox',syncVersion:remote.serverVersion,syncedRevision:remote.revision}});
   }after=page.next||'';
  }while(after);
  if(changed&&!busy&&!recording&&!recordingBusy)await renderNotes();
  const pending=await transaction('readonly',store=>store.getAll());if(pending.some(n=>n.id!==AUDIO_DRAFT&&!n.conflict&&n.syncedRevision!==(n.revision||1)))syncAgain=true;await showConflict();syncStatus(pending.some(n=>n.conflict)?'choose which version to keep':syncAgain?'waiting to save…':'saved online');
 }catch(e){syncStatus(e.message==='signin'?'sign in to save online':e.message==='conflict'?'sync needs review':'saved here · retry upload',true)}finally{syncRunning=false;if(syncAgain){syncAgain=false;queueSync()}releaseIfHidden()}
}
$('sync-status').onclick=()=>savedSession()?syncNotes():signIn();
window.addEventListener('online',queueSync);
setInterval(()=>{if(!document.hidden&&db)void syncNotes()},30000);

let reviewConflict=null;
async function showConflict(){
 const rows=await transaction('readonly',s=>s.getAll()),row=rows.find(n=>n.conflict);
 reviewConflict=row||null;$('sync-review').hidden=!row;if(!row)return;
 $('conflict-local').textContent=(row.deletedAt?'Deleted: ':'')+displayNote(row.text)+(row.audio?' (voice attached)':'');
 const remote=await (await api('/notes/'+encodeURIComponent(row.id))).json();
 reviewConflict={local:row,remote:remote.note};
 $('conflict-online').textContent=(remote.note.deletedAt?'Deleted: ':'')+displayNote(remote.note.text)+(remote.note.audio?' (voice attached)':'');
}
async function resolveConflict(useLocal){
 if(!reviewConflict?.remote||busy||recording||recordingBusy||syncRunning)return;
 busy=true;updateButtons();const {local,remote}=reviewConflict;
 try{
  if(useLocal){const kept=await mutateNote(local.id,current=>({...current,conflict:false,syncVersion:remote.serverVersion,revision:(current.revision||1)+1}));if(draftMeta?.id===local.id){draftMeta.revision=kept.revision;rememberDraftMeta()}}
  else{
   const audio=remote.audio?await downloadAudio(remote.audio):null;
   await mutateNote(local.id,()=>({...remote,audio,state:'inbox',syncVersion:remote.serverVersion,syncedRevision:remote.revision}));
   if(draftMeta?.id===local.id){$('note-text').value='';draftAudio=null;await transaction('readwrite',s=>s.delete(AUDIO_DRAFT));try{localStorage.removeItem(DRAFT)}catch{}resetDraftMeta();showAudio();}
  }
  reviewConflict=null;$('sync-review').hidden=true;await renderNotes();queueSync();
 }catch{feedback('Could not update this note. Both versions are still kept.',true)}finally{busy=false;updateButtons();releaseIfHidden()}
}
$('keep-local').onclick=()=>resolveConflict(true);
$('keep-online').onclick=()=>resolveConflict(false);
