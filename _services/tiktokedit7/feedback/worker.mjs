import round01 from '../../../tiktokedit7/rounds/round-01/manifest.json';
import round02 from '../../../tiktokedit7/rounds/round-02/manifest.json';
import {reviewReport} from './model.mjs';
const manifests={'round-01':round01,'round-02':round02};
const origins=new Set(['https://venturasolutions.co.uk','https://www.venturasolutions.co.uk','http://127.0.0.1:8907']);
function clean(value,m){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('invalid feedback');
 const updated=new Date(value.updated);if(!Number.isFinite(+updated)||+updated>Date.now()+300000)throw Error('invalid timestamp');
 const videos=new Set(m.videos.map(v=>v.id)),clips=new Set(m.videos.flatMap(v=>v.shots.map(s=>s.id)));
 const text=(v,max)=>typeof v==='string'?v.slice(0,max):'';
 function fields(object,ids,kind){if(!object||typeof object!=='object'||Array.isArray(object))return {};return Object.fromEntries(Object.entries(object).filter(([id,v])=>ids.has(id)&&(kind==='vote'?['K','X','-'].includes(v):typeof v==='string')).map(([id,v])=>[id,kind==='vote'?v:text(v,12000)]));}
 return {answers:fields(value.answers,clips,'vote'),videoAnswers:fields(value.videoAnswers,videos,'vote'),notes:fields(value.notes,clips,'note'),videoNotes:fields(value.videoNotes,videos,'note'),overall:text(value.overall,30000),name:text(value.name,200),updated:updated.toISOString()};
}
export default {async fetch(request,env){
 const url=new URL(request.url),origin=request.headers.get('Origin'),headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'};
 if(origins.has(origin))Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'});
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(request.method==='OPTIONS')return new Response(null,{status:origins.has(origin)?204:403,headers});
 try{
  if(url.pathname==='/health')return reply({ok:true,board:'tiktokedit7',rounds:Object.keys(manifests)});
  const round=url.searchParams.get('round')||'round-02',m=manifests[round];if(!m)return reply({error:'unknown round'},404);
  if(request.method==='GET'&&url.pathname==='/api/state'){
   const reviewer=url.searchParams.get('reviewer')||'';
   const draft=await env.DB.prepare('SELECT draft FROM drafts WHERE round_id=? AND reviewer_id=?').bind(round,reviewer).first();
   const {results}=await env.DB.prepare('SELECT submission FROM submissions WHERE round_id=? ORDER BY submitted_at DESC').bind(round).all();
   return reply({boardId:m.id,draft:draft?JSON.parse(draft.draft):null,submissions:results.map(r=>JSON.parse(r.submission))});
  }
  if(request.method==='GET'&&url.pathname==='/api/feedback'){
   const {results}=await env.DB.prepare('SELECT report FROM drafts WHERE round_id=? ORDER BY updated_at DESC').bind(round).all();
   return reply({boardId:m.id,roundId:round,reviews:results.map(r=>JSON.parse(r.report))});
  }
  if(request.method==='POST'&&['/api/draft','/api/submission'].includes(url.pathname)){
   if(!origins.has(origin))return reply({error:'origin rejected'},403);
   if(Number(request.headers.get('Content-Length'))>850000)return reply({error:'feedback too large'},413);
   const raw=await request.text();if(raw.length>850000)return reply({error:'feedback too large'},413);
   const p=JSON.parse(raw);if(p.boardId!==m.id||p.roundId!==round||!/^[a-zA-Z0-9_-]{20,80}$/.test(p.reviewerId||''))return reply({error:'invalid review'},400);
   const submit=url.pathname==='/api/submission',input=submit?{...p.submission,answers:p.submission?.clicked}:p.draft,d=clean(input,m),report=reviewReport(m,d);
   const statements=[env.DB.prepare(`INSERT INTO drafts(round_id,reviewer_id,draft,report,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(round_id,reviewer_id) DO UPDATE SET draft=CASE WHEN excluded.updated_at>=drafts.updated_at THEN excluded.draft ELSE drafts.draft END,report=CASE WHEN excluded.updated_at>=drafts.updated_at THEN excluded.report ELSE drafts.report END,updated_at=MAX(drafts.updated_at,excluded.updated_at)`).bind(round,p.reviewerId,JSON.stringify(d),JSON.stringify(report),d.updated)];
   if(submit){const name=d.name.trim()||'Anonymous',ts=new Date().toISOString(),ids=m.videos.flatMap(v=>v.shots.map(s=>s.id));const row={...d,name,ts,roundId:round,ids,answers:ids.map(id=>d.answers[id]||'-'),clicked:d.answers,feedback:report};statements.push(env.DB.prepare(`INSERT INTO submissions(round_id,reviewer_id,name_key,submission,submitted_at) VALUES(?,?,?,?,?) ON CONFLICT(round_id,reviewer_id,name_key) DO UPDATE SET submission=excluded.submission,submitted_at=excluded.submitted_at`).bind(round,p.reviewerId,name.toLowerCase(),JSON.stringify(row),ts));}
   await env.DB.batch(statements);return reply({saved:true});
  }
  return reply({error:'not found'},404);
 }catch(e){return reply({error:['invalid feedback','invalid timestamp'].includes(e.message)?e.message:'could not save feedback'},400);}
}};
