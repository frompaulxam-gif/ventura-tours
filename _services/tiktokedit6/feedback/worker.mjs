import registry from './rounds.json';
import round01 from './round-01.json';
import {ReviewFeedback} from './model.mjs';
const manifests={'round-01':round01};
const origins=new Set(['https://venturasolutions.co.uk','https://www.venturasolutions.co.uk','http://127.0.0.1:8787','http://127.0.0.1:8896']);
const str=(v,max=20000)=>typeof v==='string'?v.slice(0,max):'';
function clean(d,m){
 if(!d||typeof d!=='object')throw Error('invalid feedback');
 const date=new Date(d.touchedAt||d.ts);if(!Number.isFinite(+date)||+date>Date.now()+300000)throw Error('invalid timestamp');
 const videos=new Set(m.videos.map(v=>String(v.id))),clips=new Set(m.videos.flatMap(v=>v.shots.map(s=>s.id)));
 const vals=(o,ids,valid)=>Object.fromEntries(Object.entries(o||{}).filter(([k,v])=>ids.has(k)&&valid(v)));
 const notes=(o,ids)=>Object.fromEntries(Object.entries(vals(o,ids,v=>typeof v==='string')).map(([k,v])=>[k,str(v)]));
 return {notes:notes(d.notes,clips),disliked:vals(d.disliked,clips,v=>v===true),liked:vals(d.liked,clips,v=>v===true),videoRatings:vals(d.videoRatings,videos,v=>['like','dislike'].includes(v)),videoComments:notes(d.videoComments,videos),overall:str(d.overall),name:str(d.name,100),touchedAt:date.toISOString()};
}
export default {async fetch(request,env){
 const u=new URL(request.url),origin=request.headers.get('Origin'),headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'};
 if(origins.has(origin))Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS'});
 const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
 if(request.method==='OPTIONS')return new Response(null,{status:origins.has(origin)?204:403,headers});
 try{
  if(u.pathname==='/health')return reply({ok:true,board:'tiktokedit6'});
  const round=u.searchParams.get('round')||registry.current,m=manifests[round];if(!m)return reply({error:'unknown round'},404);
  if(request.method==='GET'&&['/api/state','/api/feedback'].includes(u.pathname)){
   const {results}=await env.DB.prepare('SELECT reviewer_id,draft,report,submission FROM feedback WHERE round_id=? ORDER BY updated_at DESC').bind(round).all();
   if(u.pathname==='/api/feedback')return reply({roundId:round,reviews:results.map(r=>JSON.parse(r.report))});
   const row=results.find(r=>r.reviewer_id===u.searchParams.get('reviewer'));
   return reply({boardId:m.id,draft:row?JSON.parse(row.draft):null,submissions:results.filter(r=>r.submission).map(r=>JSON.parse(r.submission))});
  }
  if(request.method==='POST'&&['/api/draft','/api/submission'].includes(u.pathname)){
   if(!origins.has(origin))return reply({error:'origin rejected'},403);
   if(Number(request.headers.get('Content-Length'))>800000)return reply({error:'review too large'},413);
   const raw=await request.text();if(raw.length>800000)return reply({error:'review too large'},413);
   const p=JSON.parse(raw),selected=manifests[p.roundId];if(!selected||p.boardId!==selected.id||!/^[a-zA-Z0-9_-]{20,80}$/.test(p.reviewerId||''))return reply({error:'invalid review'},400);
   const submit=u.pathname==='/api/submission',d=clean(submit?p.submission:p.draft,selected),report=ReviewFeedback.build(selected,d);
   const row=submit?{...d,name:d.name.trim()||'Anonymous',ts:new Date().toISOString(),feedback:report}:null;
   // Submissions only change on an explicit save; autosaves preserve the last submitted answer.
   await env.DB.prepare(`INSERT INTO feedback(round_id,reviewer_id,draft,report,updated_at,submission) VALUES(?,?,?,?,?,?) ON CONFLICT(round_id,reviewer_id) DO UPDATE SET draft=CASE WHEN excluded.updated_at>=feedback.updated_at THEN excluded.draft ELSE feedback.draft END,report=CASE WHEN excluded.updated_at>=feedback.updated_at THEN excluded.report ELSE feedback.report END,updated_at=MAX(feedback.updated_at,excluded.updated_at),submission=COALESCE(excluded.submission,feedback.submission)`).bind(p.roundId,p.reviewerId,JSON.stringify(d),JSON.stringify(report),d.touchedAt,row?JSON.stringify(row):null).run();
   return reply({ok:true});
  }
  return reply({error:'not found'},404);
 }catch(e){return reply({error:['invalid feedback','invalid timestamp'].includes(e.message)?e.message:'could not save feedback'},400);}
}};
