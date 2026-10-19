export const money = n => n == null ? '—' : new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(n);
export const number = n => n == null ? '—' : new Intl.NumberFormat('en-GB',{maximumFractionDigits:0}).format(n);
export const divide = (a,b) => a == null || b == null || b <= 0 ? null : a/b;
export const cost = n => n == null ? '—' : n < 1 ? `${(n*100).toFixed(1)}p` : money(n);
export const pct = n => n == null ? '—' : `${(n*100).toFixed(1)}%`;
const day = 86400000;
const iso = n => new Date(n).toISOString().slice(0,10);
export function monday(date) {const d=new Date(date.slice(0,10)+'T12:00:00Z');return iso(+d-((d.getUTCDay()+6)%7)*day)}
export const weekEnd = start => iso(Date.parse(start+'T12:00:00Z')+6*day);
export function weekNumber(start) {const thursday=new Date(Date.parse(start+'T12:00:00Z')+3*day);return Math.ceil(((+thursday-Date.UTC(thursday.getUTCFullYear(),0,1))/day+1)/7)}
export function weeks(reports) {
 const values=new Set();for(const r of reports) if(r.periodStart&&r.periodEnd) for(let t=Date.parse(monday(r.periodStart)+'T12:00:00Z');iso(t)<=r.periodEnd;t+=7*day) values.add(iso(t));
 return [...values].sort().reverse();
}
export const fitsWeek = (r,w) => !!(r.periodStart&&r.periodEnd&&r.periodStart>=w&&r.periodEnd<=weekEnd(w));
export function reportsInWeek(reports,w) {
 const groups=new Map();
 for(const r of reports) if(r.periodStart<=weekEnd(w)&&r.periodEnd>=w) {
  const key=r.seriesId||r.id,old=groups.get(key);
  if(!old||(fitsWeek(r,w)&&!fitsWeek(old,w))||(fitsWeek(r,w)===fitsWeek(old,w)&&r.capturedAt>old.capturedAt)) groups.set(key,r);
 }
 return [...groups.values()];
}
export const metricDefinitions = {
 clicks:{label:'Link clicks',key:'clicks',format:number},
 pageViews:{label:'Page visits',key:'pageViews',format:number},
 cpc:{label:'Cost / click',numerator:'spend',denominator:'clicks',lower:true,format:cost},
 cpv:{label:'Cost / visit',numerator:'spend',denominator:'pageViews',lower:true,format:cost},
 ctr:{label:'Link click rate',numerator:'clicks',denominator:'impressions',format:pct},
 impressions:{label:'Impressions',key:'impressions',format:number},
 reach:{label:'People reached',key:'reach',format:number},
 plays3s:{label:'3-second views',key:'plays3s',format:number},
 viewRate:{label:'3s views / impressions',numerator:'plays3s',denominator:'impressions',format:pct},
 thruplays:{label:'15-second ThruPlays',key:'thruplays',format:number}
};
export function compareMetrics(ads) {
 const out={};
 for(const [key,d] of Object.entries(metricDefinitions)) {
  const rows=ads.filter(a=>(a.metrics.impressions>0||a.metrics.spend>0)).map(a=>({a,value:d.key?a.metrics[d.key]:divide(a.metrics[d.numerator],a.metrics[d.denominator])})).filter(x=>x.value!=null);
  const average=rows.length?(d.key?rows.reduce((s,x)=>s+x.value,0)/rows.length:divide(rows.reduce((s,x)=>s+x.a.metrics[d.numerator],0),rows.reduce((s,x)=>s+x.a.metrics[d.denominator],0))):null;
  const ordered=[...rows].sort((a,b)=>(d.lower?a.value-b.value:b.value-a.value)||(b.a.metrics[d.denominator||'impressions']||0)-(a.a.metrics[d.denominator||'impressions']||0)||a.a.id.localeCompare(b.a.id));
  const winner=rows.length>=2&&ordered.some(x=>x.value>0)?ordered[0].a.id:null;
  out[key]={average,winner,values:Object.fromEntries(rows.map(({a,value})=>{
   const peers=rows.filter(x=>(x.a.campaignId||x.a.id)===(a.campaignId||a.id));
   const mean=d.key?peers.reduce((s,x)=>s+x.value,0)/peers.length:divide(peers.reduce((s,x)=>s+x.a.metrics[d.numerator],0),peers.reduce((s,x)=>s+x.a.metrics[d.denominator],0));
   const relative=mean>0?(value-mean)/mean:0,score=d.lower?-relative:relative;
   return [a.id,{value,average:mean,tone:peers.length<2?'':score>.2?'good':score<-.2?'poor':'average',best:a.id===winner}];
  }))};
 }
 return out;
}
export function sumKnown(rows,key) { const values=rows.map(r=>r.metrics?.[key]).filter(x=>x!=null); return values.length? Math.round(values.reduce((a,b)=>a+b,0)*100)/100:null; }
export function validate(data) {
 if (data.schemaVersion!==1 || !Array.isArray(data.venues) || !Array.isArray(data.reports) || !data.media || !Array.isArray(data.links)) throw Error('This report file is not a supported Ads Desk dataset.');
 const ids=new Set();
 for(const r of data.reports){
  if(!r.id || ids.has(r.id) || !Array.isArray(r.ads) || !r.totals || !Array.isArray(r.groups) || !Array.isArray(r.insights) || !r.business) throw Error('A report has missing or duplicate fields.');
  ids.add(r.id);
  for(const field of ['periodStart','periodEnd']) if(!/^\d{4}-\d{2}-\d{2}$/.test(r[field]||'')||!Number.isFinite(Date.parse(r[field]))) throw Error('Reports need valid periodStart and periodEnd dates.');
  if(r.periodStart>r.periodEnd) throw Error('The report start date must precede its end date.');
  for(const row of [...r.ads,{metrics:r.totals}]) for(const val of Object.values(row.metrics||{})) if(val!=null && (typeof val!=='number'||!Number.isFinite(val)||val<0)) throw Error('Metrics must be non-negative numbers or null.');
 }
 return data;
}
