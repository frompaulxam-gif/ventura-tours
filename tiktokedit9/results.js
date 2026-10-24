const API='https://tiktokedit9-review.raspy-waterfall-454f.workers.dev';
function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
(async()=>{const container=document.querySelector('#results');try{
  const registry=await (await fetch('rounds.json',{cache:'no-store'})).json(),round=new URLSearchParams(location.search).get('round')||registry.currentRound;
  const manifest=await (await fetch('rounds/'+encodeURIComponent(round)+'/manifest.json')).json();
  document.querySelector('#round-label').textContent=manifest.roundLabel;document.querySelector('#back').href='./?round='+round;
  let rows=[];try{const response=await fetch(API+'/api/submissions?round='+encodeURIComponent(round));if(!response.ok)throw Error();rows=await response.json()}catch{try{rows=JSON.parse(localStorage.getItem('paulqc:'+manifest.id+':submissions'))||[]}catch{}}
  container.replaceChildren();if(!rows.length){container.append(node('p','empty','no saved answers yet. your taps and comments are saved as you go. use send answers to keep a review here.'));return}
  for(const r of rows.sort((a,b)=>String(b.ts).localeCompare(String(a.ts)))){
    const card=node('section','submission');card.append(node('h2','',r.name||'anonymous'));
    const dislikes=Object.values(r.verdicts||{}).filter(v=>v==='dislike').length,favourites=Object.values(r.verdicts||{}).filter(v=>v==='favourite').length,comments=[...Object.values(r.notes||{}),...Object.values(r.videoNotes||{}),r.overall||''].filter(v=>v.trim()).length;
    card.append(node('p','meta',`${Object.values(r.videoVerdicts||{}).filter(v=>v==='really-like').length} videos really like · ${Object.values(r.verdicts||{}).filter(v=>v==='really-like').length} clips really like · ${Object.values(r.videoVerdicts||{}).filter(v=>v==='like').length} videos liked · ${Object.values(r.videoVerdicts||{}).filter(v=>v==='really-like').length} videos really like · ${Object.values(r.verdicts||{}).filter(v=>v==='really-like').length} clips really like · ${Object.values(r.videoVerdicts||{}).filter(v=>v==='dislike').length} videos disliked · ${dislikes} clips disliked · ${favourites} favourites · ${comments} comments · ${new Date(r.ts).toLocaleString('en-GB',{timeZone:'Europe/London'})}`));
    if(r.overall)card.append(node('p','overall-note',r.overall));
    const wrap=node('div','table-wrap'),table=node('table'),head=node('thead'),heading=node('tr');
    for(const label of ['video','clip','source and timing','choice','comment'])heading.append(node('th','',label));head.append(heading);table.append(head);const body=node('tbody');
    for(const v of manifest.videos){
      const verdict=r.videoVerdicts?.[v.id],comment=r.videoNotes?.[v.id]||'';
      if(verdict||comment){const tr=node('tr');tr.append(node('td','',v.name),node('td','','whole video'),node('td','',`reference: ${v.reference} · ${v.variant}`),node('td',verdict==='like'?'favourite-text':verdict==='dislike'?'dislike-text':'',verdict==='really-like'?'really like':verdict==='like'?'liked':verdict==='dislike'?'disliked':'not rated'),node('td','comment-cell',comment));body.append(tr)}
      for(const s of v.shots){const verdict=r.verdicts?.[s.id],comment=r.notes?.[s.id]||'';if(!verdict&&!comment)continue;const tr=node('tr');tr.append(node('td','',v.label),node('td','',String(s.number)),node('td','',`${s.source_name} · ${s.start.toFixed(3)}s to ${s.end.toFixed(3)}s · frames ${s.timeline_frame_in} to ${s.timeline_frame_out} (end exclusive)`),node('td',verdict==='dislike'?'dislike-text':verdict==='favourite'?'favourite-text':'',verdict==='dislike'?'disliked':verdict==='really-like'?'really like':verdict||'not rated'),node('td','comment-cell',comment));body.append(tr)}
    }
    table.append(body);wrap.append(table);card.append(wrap);container.append(card);
  }
}catch{container.textContent='couldn’t load saved answers. refresh to try again.'}})();
