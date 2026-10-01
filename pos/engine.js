(function(root){
  'use strict';
  const MAX_PENCE=100000000;
  function integer(n,name,max=MAX_PENCE){if(!Number.isSafeInteger(n)||n<0||n>max)throw new Error(`Invalid ${name}`);return n;}
  function parseMoney(text){
    const s=String(text).trim();
    if(!/^\d+(\.\d{1,2})?$/.test(s))throw new Error('Enter an amount with no more than two decimal places.');
    const [whole,decimal='']=s.split('.');
    return integer(Number(whole)*100+Number(decimal.padEnd(2,'0')),'amount');
  }
  function parsePercent(text){
    const s=String(text).trim();
    if(!/^\d+(\.\d{1,2})?$/.test(s))throw new Error('Enter a percentage from 0 to 100.');
    const bp=parseMoney(s);if(bp>10000)throw new Error('The discount cannot be more than 100%.');return bp;
  }
  function calculate(bill,basis){
    let subtotal=0,quantity=0,exemptSubtotal=0;
    for(const l of bill.lines){integer(l.unitPrice,'price');integer(l.quantity,'quantity',999);const lineTotal=l.unitPrice*l.quantity;subtotal+=lineTotal;quantity+=l.quantity;if(l.serviceExempt)exemptSubtotal+=lineTotal;}
    integer(subtotal,'subtotal');
    const d=bill.discount||{type:'none',value:0};
    let discount=0;
    if(d.type==='percent'){integer(d.value,'percentage',10000);discount=Math.round(subtotal*d.value/10000);}
    else if(d.type==='amount'){integer(d.value,'discount');discount=Math.min(d.value,subtotal);}
    else if(d.type==='cash'){if(d.value!==1000)throw new Error('Cash discount must be 10%');}
    else if(d.type!=='none')throw new Error('Unknown discount type');
    const net=subtotal-discount;
    if(!['afterDiscount','beforeDiscount'].includes(basis))return {subtotal,quantity,discount,net,service:null,total:null};
    const exemptNet=subtotal?Math.round(exemptSubtotal*net/subtotal):0;
    const serviceBase=basis==='afterDiscount'?Math.max(0,net-exemptNet):Math.max(0,subtotal-exemptSubtotal);
    const serviceRate=bill.serviceRate??10;
    if(![0,10].includes(serviceRate))throw new Error('Invalid service-charge rate');
    const service=Math.round(serviceBase*serviceRate/100);
    const beforeCash=net+service;
    const cashDiscount=d.type==='cash'?Math.round(beforeCash*1000/10000):0;
    return {subtotal,quantity,discount,net,exemptSubtotal,serviceBase,serviceRate,service,beforeCash,cashDiscount,total:beforeCash-cashDiscount};
  }
  function validateState(state){
    if(!state||state.version!==1||!Array.isArray(state.bills)||state.bills.length>500)throw new Error('This is not a valid Thai Boran backup.');
    const ids=new Set();
    for(const b of state.bills){
      if(typeof b.id!=='string'||ids.has(b.id)||typeof b.name!=='string'||b.name.length>60||!Array.isArray(b.lines)||b.lines.length>1000)throw new Error('Invalid bill in backup.');
      ids.add(b.id);
      for(const l of b.lines){if(typeof l.key!=='string'||typeof l.name!=='string'||typeof l.option!=='string'||typeof l.sku!=='string'||l.quantity<1)throw new Error('Invalid item in backup.');}
      calculate(b,'afterDiscount');
      if(!['open','closed'].includes(b.status))throw new Error('Invalid bill status.');
    }
    if(!['afterDiscount','beforeDiscount',null].includes(state.serviceBasis))throw new Error('Invalid service-charge setting.');
    return state;
  }
  const api={calculate,parseMoney,parsePercent,validateState};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BillingEngine=api;
})(typeof window!=='undefined'?window:globalThis);
