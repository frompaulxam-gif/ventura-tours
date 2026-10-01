'use strict';

/*
 * Set menus transcribed from the two supplied photographs.  They stay in the
 * same catalogue as the à-la-carte menu so they can be searched, edited and
 * included in the normal itemised bill.
 */
const setMenuProteins={
  lunch:[
    ['Bean Curd',0],['Chicken',0],['Pork',0],['Prawns',150],['Seafood',150],
    ['Fish',150],['Duck',150],['Beef',150]
  ],
  early:[
    ['Vegetable',0],['Bean Curd',0],['Chicken',0],['Pork',0],
    ['Beef',150],['Duck',150],['Prawns',200],['Seafood',200]
  ]
};
const lunchStarters=[
  ['Grilled Chicken Satay','2 pcs'],['Thai Fish Cakes','2 pcs'],
  ['Chicken & Prawn Dumplings','3 pcs'],['Chicken Spring Rolls','2 pcs'],
  ['Vegetable Spring Rolls','2 pcs'],['Sweet Corn Fritters','2 pcs'],
  ['Bean Curd Satay','2 pcs']
].map(([name,portion])=>({name,portion}));
const earlyStarters=[
  ['Sweet Corn Fritters','2 pcs'],['Chicken Spring Rolls','2 pcs'],
  ['Grilled Chicken Satay','2 pcs'],['Chicken & Prawn Dumplings','3 pcs'],
  ['Bean Curd Satay','2 pcs'],['Vegetable Spring Rolls','2 pcs'],
  ['Thai Fish Cakes','2 pcs'],['Vegetable Tempura','4 pcs']
].map(([name,portion])=>({name,portion}));
const lunchMains=[
  ['Panang Curry',0],['Special Fried Rice',0],['Sweet & Sour Stir Fry',0],
  ['Holy Basil Stir Fry',0],['Green Curry',0],['Ginger Stir Fry',0],
  ['Massaman Curry',0],['Garlic & Pepper Stir Fry',0],['Pad Thai Noodles',0],
  ['Pad Kee Mao Noodles',0],['Boat Noodles',100]
].map(([name,delta])=>({name,delta}));
const earlyMains=[
  'Sweet & Sour Stir Fry','Holy Basil Stir Fry','Green Curry','Massaman Curry',
  'Pad Thai Noodles','Garlic & Pepper Stir Fry','Panang Curry','Special Fried Rice'
].map(name=>({name,delta:0}));
const lunchDrinks=[
  'Pepsi','Diet Coke','7up','Coke Zero','Orange Juice','Mango Juice','Apple Juice',
  'Cranberry Juice','Jasmine Tea','Green Tea'
].map(name=>({name,detail:['Pepsi','Diet Coke','7up','Coke Zero'].includes(name)?'Can 330ml':''}));
const earlyDrinks=[
  'Diet Coke','Pepsi','Sprite','Coke Zero','Fanta','Jasmine Tea','Green Tea','English Breakfast Tea'
].map(name=>({name,detail:['Diet Coke','Pepsi','Sprite','Coke Zero','Fanta'].includes(name)?'330ml':'',delta:250}));
const setSauces=['Sweet Chilli Sauce','Peanut Sauce','Soya Sauce','Spicy Seafood Sauce'].map(name=>({name,delta:50}));

const SET_MENU_PRODUCTS=[
  {
    id:'SM-LUNCH',section:'Set menus',menu_number:null,name:'Lunch Deal',source_photo:'f8f1cde3-16cf-432a-8a3e-62e70e4eb0e5.JPG',
    description:'Starter + main + soft drink. Dine-in lunch offer.',portion:'Starter + Main + Soft Drink',
    variants:[{option:'Starter + Main + Soft Drink',price_pence:1400,sku:'SM-LUNCH-01',price_status:'Matches photographed menu'}],
    price_basis:'Printed beside Lunch Deal',notes:'Lunch menu. No service charge. Protein supplements and extra sauce are shown in the photographed menu.',visually_checked:true,group:'Food',
    setMenu:{kind:'lunch',serviceExempt:true,subtitle:'Starter + main + soft drink',notice:'Lunch menu · no service charge',starters:lunchStarters,mains:lunchMains,proteins:setMenuProteins.lunch,drinks:lunchDrinks,sauces:setSauces,spice:[{name:'Mild'},{name:'Medium'},{name:'Hot'}],riceIncluded:true}
  },
  {
    id:'SM-EARLY',section:'Set menus',menu_number:null,name:'Early Bird',source_photo:'27b40cdf-37e8-4065-9a38-6ed36c517381.JPG',
    description:'Starter + main course + side. Sunday–Thursday, 5pm–6:30pm.',portion:'Starter + Main Course + Side',
    variants:[{option:'Starter + Main Course + Side',price_pence:1800,sku:'SM-EARLY-01',price_status:'Matches photographed menu'}],
    price_basis:'Printed beside Early Bird',notes:'Sunday–Thursday, 5pm–6:30pm. Dine-in only. 10% service charge is added. Drink, protein, side and sauce supplements are shown in the photographed menu.',visually_checked:true,group:'Food',
    setMenu:{kind:'early',serviceExempt:false,subtitle:'Starter + main course + side',notice:'Sunday–Thursday · 5pm–6:30pm · dine-in only · 10% service, removable on the bill',starters:earlyStarters,mains:earlyMains,proteins:setMenuProteins.early,drinks:earlyDrinks,sauces:setSauces,sides:[{name:'Jasmine rice',delta:0},{name:'Chips',delta:0},{name:'Sticky rice',delta:100},{name:'Egg fried rice',delta:100},{name:'Egg fried noodles',delta:100}],riceIncluded:true}
  }
];
for(const product of SET_MENU_PRODUCTS)if(!MENU.some(item=>item.id===product.id))MENU.push(product);

const SetMenuBuilder=(function(){
 const fields=['starter','main','protein','side','drink','sauce','spice'];
 const lists={starter:'starters',main:'mains',protein:'proteins',side:'sides',drink:'drinks',sauce:'sauces',spice:'spice'};
 const name=item=>Array.isArray(item)?item[0]:item.name;
 const extra=item=>Array.isArray(item)?item[1]:item.delta||0;
 const money=p=>'£'+(p/100).toFixed(2);
 function text(item){return name(item)+(item.portion?' ('+item.portion+')':'')+(item.detail?' ('+item.detail+')':'')+(extra(item)?' (+'+money(extra(item))+')':'');}
 function quote(product,values,requireComplete=false){
  const set=product.setMenu,base=product.variants[0].price_pence;
  if(!set||!Number.isSafeInteger(base)||base<0)throw Error('Invalid set menu price.');
  const chosen={},required=set.kind==='lunch'?['starter','main','protein','drink']:['starter','main','protein','side'];
  for(const field of fields){
   const value=values[field],items=set[lists[field]];
   if(value===undefined||value==='')continue;
   if(!items||!/^\d+$/.test(String(value))||!items[Number(value)])throw Error('Invalid '+field+' choice.');
   chosen[field]=items[Number(value)];
  }
  // Boat noodles are explicitly limited to pork, beef or chicken in the photo.
  if(chosen.main?.name==='Boat Noodles'&&chosen.protein&&!['Pork','Beef','Chicken'].includes(name(chosen.protein)))throw Error('Boat Noodles: choose Pork, Beef or Chicken.');
  const ready=required.every(field=>chosen[field]);
  if(requireComplete&&!ready)throw Error('Choose each required option before adding this set menu.');
  let total=base;
  for(const item of Object.values(chosen)){const delta=extra(item);if(!Number.isSafeInteger(delta)||delta<0)throw Error('Invalid supplement.');total+=delta;}
  const labels={starter:'Starter',main:'Main',protein:'Protein',side:'Side',drink:'Drink',sauce:'Extra sauce',spice:'Spice'};
  const selections=fields.filter(field=>chosen[field]).map(field=>labels[field]+': '+text(chosen[field]));
  if(set.riceIncluded)selections.push('Steamed rice included');
  const option=selections.join(' · '),sku=product.id+'-'+fields.map(field=>values[field]===undefined||values[field]===''?'x':values[field]).join('-');
  return {ready,total,selections,option,sku,serviceExempt:Boolean(set.serviceExempt)};
 }
 return {fields,lists,text,quote};
})();
