const el=reviewEl;
function resultTable(headers,rows){const wrap=el('div','table-wrap'),table=el('table'),head=el('tr'),thead=el('thead'),body=el('tbody');for(const text of headers)head.append(el('th','',text));thead.append(head);table.append(thead);for(const cells of rows){const tr=el('tr');cells.forEach((text,i)=>tr.append(el('td',i===2?'result-notes':'',text)));body.append(tr);}table.append(body);wrap.append(table);return wrap;}
async function load(){
 const root=document.querySelector('#results');
 try{
  const {manifest,registry,round}=await reviewRound(),key='paulqc:'+manifest.id;
  reviewRoundOptions(registry,round,document.querySelector('#round'));document.querySelector('#back').href=`./?round=${encodeURIComponent(round.id)}`;
  const data={draft:reviewStorage.get(key,{}),submissions:reviewStorage.get(key+':submissions',{submissions:[]}).submissions};
  try{const online=await reviewServerState(manifest,key);if(online.draft?.updated>(data.draft.updated||''))data.draft=online.draft;data.submissions=reviewMergeRows(online.submissions||[],data.submissions);reviewStorage.set(key+':submissions',{submissions:data.submissions});}catch{}
  document.querySelector('#download').addEventListener('click',()=>{const report=reviewReport(manifest,data.draft);report.savedReviews=data.submissions||[];reviewDownload(report,`navy-stripey-${round.id}-feedback.json`);});
  root.replaceChildren();
  const draft=data.draft||{},rows=[{...draft,name:'current feedback',ts:draft.updated,ids:manifest.videos.flatMap(v=>v.shots.map(s=>s.id)),answers:manifest.videos.flatMap(v=>v.shots.map(s=>draft.answers?.[s.id]||'-'))},...[...(data.submissions||[])].sort((a,b)=>b.ts.localeCompare(a.ts))];
  for(const row of rows){
   const person=el('section','person');person.append(el('h2','',row.name));
   const videoVotes=row.videoAnswers||{},liked=Object.values(videoVotes).filter(v=>v==='K').length,disliked=Object.values(videoVotes).filter(v=>v==='X').length;
   const k=row.answers.filter(v=>v==='K').length,x=row.answers.filter(v=>v==='X').length;
   person.append(el('p','',`videos: ${liked} liked · ${disliked} disliked · clips: ${k} liked · ${x} disliked${row.ts?' · '+new Date(row.ts).toLocaleString('en-GB',{timeZone:'Europe/London'}):''}`));
   person.append(el('h3','','whole videos'),resultTable(['video','answer','comment'],manifest.videos.map(v=>[v.name,reviewVote(videoVotes[v.id]),row.videoNotes?.[v.id]||''])));
   const all=manifest.videos.flatMap(v=>v.shots.map(s=>({...s,label:v.name})));
   person.append(el('h3','','clips'),resultTable(['video / clip','answer','comment','source / timing'],row.ids.map((id,i)=>{const s=all.find(s=>s.id===id);return[s?`${s.label} · clip ${s.number}`:id,reviewVote(row.answers[i]),row.notes?.[id]||'',s?`${s.source_filename} · ${s.source_start.toFixed(6)}s to ${s.source_end.toFixed(6)}s · video frames ${s.start_frame} to ${s.end_frame} (end exclusive)`:''];})));
   if(row.overall)person.append(el('p','result-notes','overall: '+row.overall));root.append(person);
  }
 }catch{root.replaceChildren(el('p','empty','couldn’t load feedback. refresh the page and try again.'));}
}
load();
