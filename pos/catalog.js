(function(root){
 'use strict';
 const copy=value=>JSON.parse(JSON.stringify(value));
 function create({storage,key,base}){
  const storageKey=key+'-menu-v1';
  function validateProduct(p){
   if(!p||typeof p.id!=='string'||!p.id||typeof p.name!=='string'||!p.name.trim()||p.name.length>150||!['Food','Drinks','Wine'].includes(p.group)||typeof p.section!=='string'||!p.section||!Array.isArray(p.variants)||!p.variants.length||p.variants.length>50)throw Error('Invalid menu item.');
   const skus=new Set();
   for(const v of p.variants){if(typeof v.sku!=='string'||!v.sku||skus.has(v.sku)||typeof v.option!=='string'||!v.option.trim()||v.option.length>80||!Number.isSafeInteger(v.price_pence)||v.price_pence<0||v.price_pence>1000000)throw Error('Enter a valid serving and a price from £0 to £10,000.');skus.add(v.sku)}
  }
  function read(){
   const raw=storage.getItem(storageKey);if(!raw)return {version:1,items:[]};
   const state=JSON.parse(raw);if(state.version!==1||!Array.isArray(state.items))throw Error('Saved menu changes could not be read.');
   const ids=new Set();for(const p of state.items){validateProduct(p);if(ids.has(p.id))throw Error('Duplicate saved menu item.');ids.add(p.id)}return state;
  }
  function load(){const state=read(),edits=new Map(state.items.map(p=>[p.id,p]));return copy([...base.map(p=>edits.get(p.id)||p),...state.items.filter(p=>!base.some(b=>b.id===p.id))]);}
  function save(product,expected){
   validateProduct(product);const state=read(),current=state.items.find(p=>p.id===product.id)||base.find(p=>p.id===product.id);
   if(JSON.stringify(current??null)!==JSON.stringify(expected??null))throw Error('This item changed in another tab. Close and reopen the editor before saving.');
   const next=copy(product),i=state.items.findIndex(p=>p.id===next.id);if(i<0)state.items.push(next);else state.items[i]=next;
   storage.setItem(storageKey,JSON.stringify(state));return load();
  }
  return {storageKey,load,save};
 }
 const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MenuCatalog=api;
})(typeof window!=='undefined'?window:globalThis);
