const reviewEl=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const reviewStorage={get(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}},set(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}};
const reviewVote=value=>({K:'liked',X:'disliked'})[value]||'unmarked';
async function reviewRound(){
  const response=await fetch('rounds.json');if(!response.ok)throw Error('rounds');const registry=await response.json();
  const wanted=new URL(location.href).searchParams.get('round')||registry.current;
  const round=registry.rounds.find(r=>r.id===wanted);if(!round)throw Error('round');
  const r=await fetch(round.manifest);if(!r.ok)throw Error('manifest');
  return {registry,round,manifest:await r.json()};
}
function reviewRoundOptions(registry,round,select){
  for(const item of [...registry.rounds].reverse()){const option=reviewEl('option','',item.label);option.value=item.id;option.selected=item.id===round.id;select.append(option);}
  select.addEventListener('change',()=>{const url=new URL(location.href);url.search='';url.searchParams.set('round',select.value);location.assign(url);});
}
function reviewReport(manifest,state){
  return {schemaVersion:3,roundId:manifest.round_id,round:manifest.round_label,title:manifest.title,reviewer:state.name||'',updated:state.updated||'',overallComment:state.overall||'',videos:manifest.videos.map(v=>({id:v.id,name:v.name||v.label,filename:v.filename,reference:v.reference||'',variant:v.variant||'',videoFile:v.src,sha256:v.sha256,width:v.width,height:v.height,fps:v.fps,vote:reviewVote(state.videoAnswers?.[v.id]),comment:state.videoNotes?.[v.id]||'',clips:v.shots.map(s=>({id:s.id,clipNumber:s.number,vote:reviewVote(state.answers?.[s.id]),comment:state.notes?.[s.id]||'',sourceFilename:s.source_filename,sourcePath:s.source,sourceInSeconds:s.source_start,sourceOutSeconds:s.source_end,videoInSeconds:s.start,videoOutSeconds:s.end,videoInFrame:s.start_frame,videoOutFrameExclusive:s.end_frame,thumbnailFrame:s.frame_number,thumbnailTimeSeconds:s.frame_time}))}))};
}
function reviewDownload(data,filename){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=reviewEl('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
