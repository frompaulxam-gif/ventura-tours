(function(root){
 'use strict';
 const clone=value=>JSON.parse(JSON.stringify(value));
 const londonDate=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'});
 function serviceDate(timestamp){
  const instant=new Date(timestamp);if(!Number.isFinite(instant.getTime()))throw Error('Invalid saved bill time.');
  const parts=Object.fromEntries(londonDate.formatToParts(instant).map(part=>[part.type,part.value]));
  // Compare the London wall clock, then subtract a calendar day, so DST cannot shift the cut-off.
  const date=new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00.000Z`);
  if(Number(parts.hour)<4)date.setUTCDate(date.getUTCDate()-1);
  return date.toISOString().slice(0,10);
 }
 function validServiceDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
 function groupByServiceDate(entries){
  const groups=new Map();
  for(const entry of [...entries].sort((a,b)=>Date.parse(b.savedAt)-Date.parse(a.savedAt))){
   const date=entry.serviceDate??serviceDate(entry.savedAt);
   if(!groups.has(date))groups.set(date,[]);
   groups.get(date).push(entry);
  }
  return [...groups].sort(([a],[b])=>b.localeCompare(a)).map(([date,entries])=>({date,entries}));
 }
 function validateBill(bill,calculate){
  if(!bill||!Array.isArray(bill.lines)||bill.lines.some(l=>typeof l.sku!=='string'||typeof l.name!=='string'||typeof l.option!=='string'||l.quantity<1))throw Error('Invalid bill data.');
  calculate(bill,'afterDiscount');return bill;
 }
 function create({storage,key,tableIds,legacyTableIds=[],blank,calculate,now=()=>new Date().toISOString(),makeId=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)}){
  const historyKey=key+'-history-v1';
  function read(){
   const raw=storage.getItem(historyKey);if(raw===null)return [];
   const data=JSON.parse(raw);
   if(!data||data.version!==1||!Array.isArray(data.entries))throw Error('Saved history could not be read.');
   const ids=new Set();
   for(const entry of data.entries){
    if(!entry||typeof entry.id!=='string'||ids.has(entry.id)||!tableIds.includes(entry.tableId)&&!legacyTableIds.includes(entry.tableId)||!Number.isFinite(Date.parse(entry.savedAt)))throw Error('Invalid history record.');
    if(entry.status!==undefined&&!['paid','cleared','void'].includes(entry.status))throw Error('Invalid bill status.');
    if(entry.note!==undefined&&(typeof entry.note!=='string'||entry.note.length>500))throw Error('Invalid bill note.');
    if(entry.serviceDate!==undefined&&!validServiceDate(entry.serviceDate))throw Error('Invalid saved service date.');
    // Older records remain readable without rewriting their saved timestamp or browser storage.
    if(entry.serviceDate===undefined)entry.serviceDate=serviceDate(entry.savedAt);
    ids.add(entry.id);validateBill(entry.bill,calculate);
    if(!entry.totals||['subtotal','quantity','discount','net','serviceBase','serviceRate','service','beforeCash','cashDiscount','total'].some(k=>!Number.isSafeInteger(entry.totals[k])||entry.totals[k]<0))throw Error('Invalid saved totals.');
   }
   return data.entries;
  }
  function current(fallback){const raw=storage.getItem(key),saved=raw===null?clone(fallback):JSON.parse(raw);for(const id of tableIds)validateBill(saved[id],calculate);return saved;}
  function archiveAndClear(bills,tableId,{status='cleared',note=''}={}){
   if(!['paid','cleared','void'].includes(status))throw Error('Invalid bill status.');
   if(typeof note!=='string'||note.length>500)throw Error('Keep the reference or note to 500 characters.');
   if(!tableIds.includes(tableId)&&!legacyTableIds.includes(tableId))throw Error('Unknown table.');
   const live=current(bills);
   if(JSON.stringify(live[tableId])!==JSON.stringify(bills[tableId]))throw Error('This table changed in another tab. Reload and check it before clearing.');
   if(!live[tableId].lines.length)throw Error('This table has no items to save.');
   const entries=read(),snapshot=clone(live[tableId]),savedAt=now();
   const record={id:makeId(),tableId,savedAt,serviceDate:serviceDate(savedAt),status,note:note.trim(),bill:snapshot,totals:calculate(snapshot,'afterDiscount')};
   // Save the complete receipt first. If this write fails, the active bill is untouched.
   storage.setItem(historyKey,JSON.stringify({version:1,entries:[record,...entries]}));
   const next=clone(live);next[tableId]=blank();
   // A failed second write still leaves both the active bill and its safety copy.
   storage.setItem(key,JSON.stringify(next));
   return {bills:next,record};
  }
  function restore(bills,id,target){
   if(!tableIds.includes(target))throw Error('Choose a valid table.');
   const record=read().find(entry=>entry.id===id);if(!record)throw Error('This saved bill could not be found.');
   const live=current(bills);if(live[target].lines.length)throw Error('That table has an open bill. Choose an available table.');
   live[target]=clone(record.bill);storage.setItem(key,JSON.stringify(live));return live;
  }
  function move(bills,source,target){
   if(!tableIds.includes(target)||(!tableIds.includes(source)&&!legacyTableIds.includes(source))||source===target)throw Error('Choose a different available table.');
   const live=current(bills);
   if(JSON.stringify(live[source])!==JSON.stringify(bills[source]))throw Error('The source bill changed. Close and reopen Move table.');
   if(!live[source]?.lines.length)throw Error('This table has no items to move.');
   if(live[target].lines.length)throw Error('The destination table is now in use. Choose another available table.');
   live[target]=clone(live[source]);live[source]=blank();
   storage.setItem(key,JSON.stringify(live));return live;
  }
  return {historyKey,read,archiveAndClear,restore,move};
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={create,serviceDate,groupByServiceDate};else root.BillHistory={create,serviceDate,groupByServiceDate};
})(typeof window!=='undefined'?window:globalThis);
