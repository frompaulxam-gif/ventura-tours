import manifest from './round-01.json';
const origins=new Set(['https://venturasolutions.co.uk','https://www.venturasolutions.co.uk','http://127.0.0.1:8773']);
const shotIds=new Set(manifest.videos.flatMap(v=>v.shots.map(s=>s.id))),videoIds=new Set(manifest.videos.map(v=>v.number));
const txt=(s,max=20000)=>typeof s==='string'?s.slice(0,max):'';
function clean(d){
  if(!d||typeof d!=='object')throw Error('invalid feedback');
  const maps=(obj,ids,options)=>Object.fromEntries(Object.entries(obj||{}).filter(([id,value])=>ids.has(id)&&options.includes(value)));
  const notes=(obj,ids)=>Object.fromEntries(Object.entries(obj||{}).filter(([id,value])=>ids.has(id)&&typeof value==='string').map(([id,value])=>[id,txt(value)]));
  const date=new Date(d.ts);if(!Number.isFinite(+date)||+date>Date.now()+300000)throw Error('invalid timestamp');
  return {answers:maps(d.answers&&typeof d.answers==='object'?d.answers:d.clicked,shotIds,['S','K','X','-']),videoAnswers:maps(d.videoAnswers,videoIds,['S','K','X','-']),notes:notes(d.notes,shotIds),videoNotes:notes(d.videoNotes,videoIds),overall:txt(d.overall),name:txt(d.name,100),ts:date.toISOString()};
}
function report(d){return {schema_version:2,round_id:manifest.id,round:manifest.round,title:manifest.title,updated_at:d.ts,reviewer:d.name||'anonymous',overall_comment:d.overall,videos:manifest.videos.map(v=>({number:v.number,name:v.name||v.title,filename:v.filename,reference:v.reference,reference_url:v.source,variant:v.variant,choice:({S:'really like',K:'liked',X:'disliked'}[d.videoAnswers[v.number]]||'unrated'),comment:d.videoNotes[v.number]||'',frame_rate:60,clips:v.shots.map(s=>({id:s.id,clip_number:s.number,source_filename:s.source_filename,choice:({S:'really like',X:'disliked',K:'favourite'}[d.answers[s.id]]||'unmarked'),comment:d.notes[s.id]||'',timeline_in_seconds:s.timeline_in,timeline_out_seconds:s.timeline_out,timeline_start_frame:s.timeline_start_frame,timeline_end_frame_exclusive:s.timeline_end_frame_exclusive,source_in_seconds:s.source_in_seconds,source_out_seconds:s.source_out_seconds,speed:s.speed,thumbnail_frame:s.thumbnail_frame}))}))};}
function submission(d){const ids=manifest.videos.flatMap(v=>v.shots.map(s=>s.id));return {name:d.name||'Anonymous',ts:d.ts,ids,answers:ids.map(id=>d.answers[id]||'-').join(''),clicked:d.answers,videoAnswers:d.videoAnswers,videoNotes:d.videoNotes,notes:d.notes,overall:d.overall};}
export default {async fetch(request,env){
 const u=new URL(request.url),origin=request.headers.get('Origin'),headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'};
 if(origins.has(origin)){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Methods']='GET,POST,OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type'}
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(request.method==='OPTIONS')return new Response(null,{status:origins.has(origin)?204:403,headers});
 if(u.pathname==='/health')return reply({ok:true,board:manifest.id,videos:videoIds.size,clips:shotIds.size});
 try{
  const reviewer=u.searchParams.get('reviewer')||'';
  if(request.method==='GET'){
   if(u.pathname==='/api/submissions'){
    const {results}=await env.DB.prepare('SELECT draft FROM feedback WHERE round_id=? AND submitted_at IS NOT NULL ORDER BY submitted_at DESC').bind(manifest.id).all();
    return reply({submissions:results.map(r=>submission(JSON.parse(r.draft)))});
   }
   if(u.pathname==='/api/draft'){
    if(!/^[a-zA-Z0-9_-]{20,80}$/.test(reviewer))return reply(null);
    const row=await env.DB.prepare('SELECT draft FROM feedback WHERE round_id=? AND reviewer_id=?').bind(manifest.id,reviewer).first();return reply(row?JSON.parse(row.draft):null);
   }
   if(u.pathname==='/api/feedback'){
    if(!/^[a-zA-Z0-9_-]{20,80}$/.test(reviewer))return reply({error:'reviewer required'},400);
    const row=await env.DB.prepare('SELECT report FROM feedback WHERE round_id=? AND reviewer_id=?').bind(manifest.id,reviewer).first();return reply(row?JSON.parse(row.report):null);
   }
  }
  if(request.method==='POST'&&['/api/draft','/api/submissions'].includes(u.pathname)){
   if(!origins.has(origin))return reply({error:'origin rejected'},403);
   if(!/^[a-zA-Z0-9_-]{20,80}$/.test(reviewer))return reply({error:'reviewer required'},400);
   if(Number(request.headers.get('Content-Length'))>500000)return reply({error:'feedback too large'},413);
   const body=await request.text();if(body.length>500000)return reply({error:'feedback too large'},413);
   const d=clean(JSON.parse(body)),submitted=u.pathname==='/api/submissions'?new Date().toISOString():null;
   await env.DB.prepare(`INSERT INTO feedback(round_id,reviewer_id,updated_at,draft,report,submitted_at) VALUES(?,?,?,?,?,?) ON CONFLICT(round_id,reviewer_id) DO UPDATE SET updated_at=excluded.updated_at,draft=excluded.draft,report=excluded.report,submitted_at=COALESCE(excluded.submitted_at,feedback.submitted_at) WHERE excluded.updated_at>=feedback.updated_at`).bind(manifest.id,reviewer,d.ts,JSON.stringify(d),JSON.stringify(report(d)),submitted).run();
   return reply(submitted?{submissions:[submission(d)]}:{saved:true,ts:d.ts});
  }
  return reply({error:'not found'},404);
 }catch(error){return reply({error:['invalid feedback','invalid timestamp'].includes(error.message)?error.message:'could not save feedback'},400)}
}};
