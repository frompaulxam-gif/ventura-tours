import registry from './rounds.json';
import manifest from './round-01.json';
const manifests = {'round-01':manifest};
const allowed = new Set(['https://venturasolutions.co.uk','https://www.venturasolutions.co.uk','http://127.0.0.1:8889']);
const text = (v,max=20000) => typeof v==='string' ? v.slice(0,max) : '';
function clean(data,m){
  if(data.boardId!==m.id || !/^[a-zA-Z0-9_-]{20,80}$/.test(data.reviewerId||''))throw Error('invalid review');
  const videos=new Set(m.videos.map(v=>v.id)),shots=new Set(m.videos.flatMap(v=>v.shots.map(s=>s.id)));
  const values=(obj,ids,choices)=>Object.fromEntries(Object.entries(obj||{}).filter(([k,v])=>ids.has(k)&&choices.includes(v)));
  const notes=(obj,ids)=>Object.fromEntries(Object.entries(obj||{}).filter(([k,v])=>ids.has(k)&&typeof v==='string'&&v).map(([k,v])=>[k,text(v)]));
  const updated=new Date(data.updatedAt);if(!Number.isFinite(+updated)||+updated>Date.now()+300000)throw Error('invalid timestamp');
  return {boardId:m.id,roundId:m.round,reviewerId:data.reviewerId,name:text(data.name,100),updatedAt:updated.toISOString(),overall:text(data.overall),videoVerdicts:values(data.videoVerdicts,videos,['like','dislike']),verdicts:values(data.verdicts,shots,['dislike','favourite']),videoNotes:notes(data.videoNotes,videos),notes:notes(data.notes,shots)};
}
function report(m,d){return {schemaVersion:2,boardId:m.id,roundId:m.round,round:m.roundLabel,title:m.title,reviewer:d.name,updatedAt:d.updatedAt,overallComment:d.overall,videos:m.videos.map(v=>({id:v.id,videoName:v.name,label:v.label,reference:v.reference,variant:v.variant,verdict:d.videoVerdicts[v.id]||null,comment:d.videoNotes[v.id]||'',fps:v.fps,width:v.width,height:v.height,durationSeconds:v.duration,clips:v.shots.map(s=>({id:s.id,clipNumber:s.number,sourceFilename:s.source_name,timelineInSeconds:s.start,timelineOutSeconds:s.end,timelineFrameIn:s.timeline_frame_in,timelineFrameOutExclusive:s.timeline_frame_out,frameCount:s.frames,sourceInSeconds:s.source_in,sourceOutSeconds:s.source_out,thumbnailFrame:s.frame_number,verdict:d.verdicts[s.id]||null,comment:d.notes[s.id]||''}))}))}}
export default {async fetch(request,env){
  const u=new URL(request.url),origin=request.headers.get('Origin');
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'};
  if(allowed.has(origin)){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type'}
  const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
  if(request.method==='OPTIONS')return new Response(null,{status:allowed.has(origin)?204:403,headers});
  try{
    const round=u.searchParams.get('round')||registry.currentRound,m=manifests[round];
    if(u.pathname==='/health')return reply({ok:true,board:'tiktokedit9'});
    if(!m)return reply({error:'unknown review round'},404);
    if(request.method==='GET'){
      if(u.pathname==='/api/rounds')return reply(registry);
      if(u.pathname==='/api/manifest')return reply(m);
      if(u.pathname==='/api/draft'){
        const id=u.searchParams.get('reviewer')||'';if(!/^[a-zA-Z0-9_-]{20,80}$/.test(id))return reply(null);
        const row=await env.DB.prepare('SELECT draft FROM feedback WHERE round_id=? AND reviewer_id=?').bind(round,id).first();return reply(row?JSON.parse(row.draft):null);
      }
      if(u.pathname==='/api/submissions'){
        const {results}=await env.DB.prepare('SELECT draft, submitted_at FROM feedback WHERE round_id=? AND submitted_at IS NOT NULL ORDER BY submitted_at DESC').bind(round).all();
        return reply(results.map(r=>({...JSON.parse(r.draft),ts:r.submitted_at})));
      }
      if(u.pathname==='/api/feedback'){
        const {results}=await env.DB.prepare('SELECT report,submitted_at FROM feedback WHERE round_id=? ORDER BY updated_at DESC').bind(round).all();
        return reply({roundId:round,reviews:results.map(r=>({...JSON.parse(r.report),submittedAt:r.submitted_at}))});
      }
    }
    if(request.method==='POST'&&['/api/draft','/api/submit'].includes(u.pathname)){
      if(!allowed.has(origin))return reply({error:'origin rejected'},403);
      if(Number(request.headers.get('Content-Length'))>800000)return reply({error:'review too large'},413);
      const raw=await request.text();if(raw.length>800000)return reply({error:'review too large'},413);
      const data=JSON.parse(raw),selected=manifests[data.roundId];if(!selected)return reply({error:'unknown review round'},404);
      const d=clean(data,selected),r=report(selected,d),submitted=u.pathname==='/api/submit'?new Date().toISOString():null;
      const result=await env.DB.prepare(`INSERT INTO feedback(round_id,reviewer_id,updated_at,draft,report,submitted_at) VALUES(?,?,?,?,?,?) ON CONFLICT(round_id,reviewer_id) DO UPDATE SET updated_at=excluded.updated_at,draft=excluded.draft,report=excluded.report,submitted_at=COALESCE(excluded.submitted_at,feedback.submitted_at) WHERE excluded.updated_at>=feedback.updated_at`).bind(d.roundId,d.reviewerId,d.updatedAt,JSON.stringify(d),JSON.stringify(r),submitted).run();
      return reply({ok:true,updatedAt:d.updatedAt,changed:result.meta.changes});
    }
    return reply({error:'not found'},404);
  }catch(e){return reply({error:e instanceof SyntaxError?'invalid review':e.message==='invalid review'||e.message==='invalid timestamp'?e.message:'could not save feedback'},400)}
}};
