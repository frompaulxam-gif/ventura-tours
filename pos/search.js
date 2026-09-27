(function(root){
 'use strict';
 const MAX_QUERY_LENGTH=160;
 function normalise(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
 const words=value=>[...new Set(value.split(' ').filter(Boolean))];
 function createIndex(products){
  return products.map((product,order)=>{
   const name=normalise(product.name),metadata=normalise([product.group,product.section,...(product.variants||[]).map(variant=>variant.option)].join(' '));
   const number=product.menu_number==null?'':normalise(product.menu_number);
   return {product,order,name,nameWords:words(name),metadataWords:words(metadata),number,text:[name,metadata,number].filter(Boolean).join(' ')};
  });
 }
 // Optimal string alignment treats a swapped neighbouring pair as one typing error.
 function distance(a,b,limit){
  if(Math.abs(a.length-b.length)>limit)return limit+1;
  let previousPrevious=null,previous=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
   const current=[i];
   for(let j=1;j<=b.length;j++){
    current[j]=Math.min(previous[j]+1,current[j-1]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));
    if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])current[j]=Math.min(current[j],previousPrevious[j-2]+1);
   }
   previousPrevious=previous;previous=current;
  }
  return previous[b.length];
 }
 function directMatch(token,entry){
  const numeric=/^\d+$/.test(token);
  if(token===entry.number)return {cost:0,location:'number',approximate:false};
  for(const [list,location,base] of [[entry.nameWords,'name',0],[entry.metadataWords,'metadata',8]]){
   if(list.includes(token))return {cost:base,location,approximate:false};
   // Numbers must match a whole token: table/menu item 1 must not suggest item 11.
   if(!numeric&&list.some(word=>word.startsWith(token)))return {cost:base+2,location,approximate:false};
   if(!numeric&&list.some(word=>word.includes(token)))return {cost:base+4,location,approximate:false};
  }
  return null;
 }
 function fuzzyMatch(token,entry){
  if(token.length<3||token.length>40||!/^[a-z]+$/.test(token))return null;
  const limit=token.length>=7?2:1;
  let best=null;
  for(const [list,location,base] of [[entry.nameWords,'name',30],[entry.metadataWords,'metadata',50]]){
   for(const word of list){
    if(word.length<3||word.length>40||!/^[a-z]+$/.test(word))continue;
    // A two-edit match also needs a long candidate, so short words stay conservative.
    const allowed=word.length>=7?limit:1,d=distance(token,word,allowed);
    if(d<=allowed&&(!best||base+d<best.cost))best={cost:base+d,location,approximate:true};
   }
  }
  return best;
 }
 function find(index,query){
  if(String(query??'').length>MAX_QUERY_LENGTH)return [];
  const text=normalise(query),tokens=words(text);
  if(!tokens.length||tokens.length>20)return [];
  const matches=[];
  for(const entry of index){
   const tokenMatches=tokens.map(token=>directMatch(token,entry)||fuzzyMatch(token,entry));
   if(tokenMatches.some(match=>!match))continue;
   const approximate=tokenMatches.some(match=>match.approximate);
   let rank;
   if(approximate)rank=100;
   else if(entry.name===text)rank=0;
   else if(entry.name.startsWith(text))rank=10;
   else if(tokens.length===1&&entry.number===text)rank=15;
   else if(tokenMatches.every(match=>match.location==='name'))rank=tokenMatches.every(match=>match.cost<=2)?20:30;
   else rank=tokenMatches.some(match=>match.location==='name')?40:50;
   matches.push({product:entry.product,approximate,rank,cost:tokenMatches.reduce((sum,match)=>sum+match.cost,0),order:entry.order});
  }
  return matches.sort((a,b)=>a.rank-b.rank||a.cost-b.cost||a.order-b.order).map(({product,approximate})=>({product,approximate}));
 }
 const api={normalise,createIndex,find};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MenuSearch=api;
})(typeof window!=='undefined'?window:globalThis);
