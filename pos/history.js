(function(root){
 'use strict';
 const clone=value=>JSON.parse(JSON.stringify(value));
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
   const entries=read(),snapshot=clone(live[tableId]);
   const record={id:makeId(),tableId,savedAt:now(),status,note:note.trim(),bill:snapshot,totals:calculate(snapshot,'afterDiscount')};
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
 if(typeof module!=='undefined'&&module.exports)module.exports={create};else root.BillHistory={create};
})(typeof window!=='undefined'?window:globalThis);
