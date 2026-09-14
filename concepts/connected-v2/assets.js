import * as THREE from './vendor/three.module.min.js';

// Bespoke, reusable meshes. Geometry is built once; scrolling only moves groups.
const palette={paper:0xe4ddc9,cream:0xf1ead9,fold:0xc2bba6,ink:0x17221b,gold:0xc8ab72,silver:0xc8cec7,sage:0x586c58};
const paper=new THREE.MeshStandardMaterial({color:palette.paper,roughness:.82,side:THREE.DoubleSide});
const cream=new THREE.MeshStandardMaterial({color:palette.cream,roughness:.76,side:THREE.DoubleSide});
const fold=new THREE.MeshStandardMaterial({color:palette.fold,roughness:.88,side:THREE.DoubleSide});
const ink=new THREE.MeshPhysicalMaterial({color:palette.ink,metalness:.25,roughness:.33,clearcoat:.7,clearcoatRoughness:.24});
const gold=new THREE.MeshPhysicalMaterial({color:palette.gold,metalness:.95,roughness:.23,clearcoat:.5,clearcoatRoughness:.18});
const silver=new THREE.MeshPhysicalMaterial({color:palette.silver,metalness:.94,roughness:.2,clearcoat:.4});
const sage=new THREE.MeshStandardMaterial({color:palette.sage,roughness:.67});
const fineGold=new THREE.MeshStandardMaterial({color:0xa48d60,metalness:.75,roughness:.44});
const white=new THREE.MeshStandardMaterial({color:0xf8f1df,roughness:.65});
const emerald=new THREE.MeshPhysicalMaterial({color:0x426b4a,metalness:.38,roughness:.28,clearcoat:1});
const luminous=new THREE.MeshStandardMaterial({color:0xffe2a0,emissive:0xe4bb69,emissiveIntensity:1.1,metalness:.3,roughness:.3});
const sphere=new THREE.SphereGeometry(.035,12,8);

function mesh(parent,geo,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;}
function shape(points){const s=new THREE.Shape();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();return s;}
function rounded(w,h,r){const x=-w/2,y=-h/2;const s=new THREE.Shape();s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
function slab(parent,w,h,d,r,mat,x=0,y=0,z=0){const geo=new THREE.ExtrudeGeometry(rounded(w,h,r),{depth:d,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:Math.min(.024,d*.35),bevelThickness:Math.min(.022,d*.35),curveSegments:8});geo.translate(0,0,-d/2);return mesh(parent,geo,mat,x,y,z);}
function polygon(parent,points,mat,z=0){return mesh(parent,new THREE.ShapeGeometry(shape(points)),mat,0,0,z);}
function stroke(parent,points,mat=gold,width=.012){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(parent,new THREE.TubeGeometry(curve,Math.max(12,points.length*7),width,6,false),mat);}
function straight(parent,a,b,mat=gold,width=.01){return mesh(parent,new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(...a),new THREE.Vector3(...b)),1,width,6,false),mat);}
function texture(width,height,draw){const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');draw(ctx,width,height);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;return tex;}
function lettering(parent,w,h,draw,z=.06){const map=texture(768,Math.round(768*h/w),draw);const mat=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false});return mesh(parent,new THREE.PlaneGeometry(w,h),mat,0,0,z);}
function label(ctx,text,x,y,size=22,color='#233126',weight=400){ctx.fillStyle=color;ctx.font=`${weight} ${size}px Archivo, Arial, sans-serif`;ctx.fillText(text,x,y);}
function bar(ctx,x,y,w,h=5,color='#b2b8a8'){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,h/2);ctx.fill();}
function roundRect(ctx,x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function dot(ctx,x,y,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}

export function makeEnvelope(){
 const group=new THREE.Group();group.name='Folded envelope and enquiry';
 slab(group,2.06,1.36,.055,.055,paper,0,-.10,-.09);
 polygon(group,[[-1.02,.52],[0,1.4],[1.02,.52]],fold,-.09);
 polygon(group,[[-.95,.55],[0,1.34],[.95,.55]],paper,-.085);
 const letter=new THREE.Group();letter.name='Enquiry letter';letter.position.set(0,.46,-.015);group.add(letter);
 slab(letter,1.80,1.75,.025,.035,cream);
 lettering(letter,1.76,1.71,(c,w,h)=>{
  label(c,'V',52,95,50,'#324b36',500);label(c,'NEW ENQUIRY',130,89,20,'#777d69',500);
  bar(c,52,128,w-104,2,'#c4c7b5');label(c,'A new possibility.',52,204,37,'#263529',500);
  label(c,'Let’s make it happen.',52,251,23,'#72816a');
  bar(c,52,302,w-116);bar(c,52,332,w-162);bar(c,52,362,w-226);
  dot(c,73,430,22,'#93a07f');label(c,'Your next conversation',116,438,21,'#617558');
 },.032);
 polygon(group,[[-1.03,.54],[-1.03,-.78],[.16,-.14]],paper,.125);
 polygon(group,[[1.03,.54],[1.03,-.78],[-.16,-.14]],cream,.133);
 polygon(group,[[-1.03,-.78],[-1.03,-.70],[0,.04],[1.03,-.70],[1.03,-.78]],paper,.14);
 straight(group,[-1.0,-.70,.145],[0,.035,.145],fold,.006);straight(group,[0,.035,.145],[1,-.70,.145],fold,.006);
 const seal=mesh(group,new THREE.CylinderGeometry(.13,.13,.015,40),gold,.62,-.46,.17);seal.rotation.x=Math.PI/2;
 group.userData.letter=letter;return group;
}

export function makeDocuments(){
 const group=new THREE.Group();group.name='Layered project documents';
 for(let i=2;i>=0;i--){const sheet=new THREE.Group();sheet.position.set((i-1)*.075,-i*.035,-i*.055);sheet.rotation.z=(i-1)*-.095;group.add(sheet);
  const s=shape([[-.83,-1.1],[.83,-1.1],[.83,.83],[.55,1.1],[-.83,1.1]]);
  const geo=new THREE.ExtrudeGeometry(s,{depth:.012,bevelEnabled:false,curveSegments:4});mesh(sheet,geo,i===0?cream:paper);
  polygon(sheet,[[.55,1.10],[.55,.83],[.83,.83]],fold,.022);
  if(i===0){lettering(sheet,1.55,2.12,(c,w,h)=>{
   label(c,'DATA REPORT',55,79,21,'#758268',500);label(c,'Patterns in',55,173,47,'#283728',500);label(c,'the detail.',55,229,47,'#283728',500);
   bar(c,55,276,w-120,3,'#b0b89c');
   for(let j=0;j<4;j++){dot(c,67,332+j*48,5,'#9c865a');bar(c,87,328+j*48,w-155-(j%2)*65,6);}
   roundRect(c,55,558,w-110,174,12,'#dde2cf');
   for(let j=0;j<7;j++)bar(c,85+j*68,683-j*13,30,25+j*13,j===6?'#8e7951':'#a5b092');
   label(c,'OPPORTUNITIES, MADE CLEAR',55,801,17,'#778567',500);
  },.024);}
 }
 // A bent metal paper clip catches the light above the paper edge.
 stroke(group,[[.26,1.17,.04],[.32,1.27,.04],[.45,1.27,.04],[.51,1.18,.04],[.51,.61,.04],[.44,.54,.04],[.33,.59,.04],[.33,1.04,.04],[.40,1.10,.04],[.43,1.02,.04],[.43,.73,.04]],silver,.016);
 return group;
}

export function makeAnalytics(){
 const group=new THREE.Group();group.name='Analytics dashboard with raised chart columns';
 slab(group,1.98,1.84,.07,.105,ink);
 lettering(group,1.92,1.78,(c,w,h)=>{
  label(c,'DATA / OVERVIEW',47,74,22,'#b8c6a6',500);label(c,'Find the signal.',47,148,40,'#e8eadb',500);
  bar(c,47,184,w-94,2,'#647658');
  label(c,'WEEKLY ACTIVITY',47,245,20,'#9bae8b',500);
  for(let i=0;i<3;i++)bar(c,47,321+i*90,w-94,2,'#53664c66');
  label(c,'MON',54,646,15,'#90a580');label(c,'FRI',563,646,15,'#90a580');
 },.066);
 for(let i=0;i<6;i++){const height=[.25,.44,.34,.59,.49,.75][i];slab(group,.15,height,.095,.018,i===5?gold:sage,-.71+i*.275,-.60+height/2,.115);}
 stroke(group,[[-.77,.0,.19],[-.46,.19,.19],[-.15,.1,.19],[.15,.32,.19],[.43,.25,.19],[.77,.52,.19]],gold,.013);
 return group;
}

export function makeIntelligence(){
 const group=new THREE.Group();group.name='Interwoven intelligence sculpture';
 // Three elliptical, ribbon-like loops share a dark polished centre.
 const rings=[];
 for(let i=0;i<3;i++){
  const ring=mesh(group,new THREE.TorusGeometry(.72,.085,12,96),i===1?silver:gold);
  ring.rotation.set(.78+i*.7,.45+i*1.02,.35+i*.55);ring.scale.set(1,.92,1);rings.push(ring);
 }
 const core=mesh(group,new THREE.SphereGeometry(.38,40,24),ink);core.scale.set(1,1.1,1);
 const belt=mesh(group,new THREE.TorusGeometry(.405,.014,8,64),luminous);belt.rotation.x=.7;
 const orb=mesh(group,new THREE.SphereGeometry(.072,20,12),luminous,.71,.0,.0);
 group.userData.rings=rings;group.userData.orb=orb;return group;
}

export function makeApproval(){
 const group=new THREE.Group();group.name='Human review and approval';
 slab(group,2.1,1.63,.095,.115,ink);
 const rim=rounded(2.12,1.65,.12).getPoints(56).map(p=>new THREE.Vector3(p.x,p.y,.035));rim.push(rim[0]);
 mesh(group,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim),120,.009,5,false),fineGold);
 lettering(group,2.05,1.58,(c,w,h)=>{
  dot(c,58,65,9,'#b4c59b');label(c,'YOUR REVIEW',83,73,20,'#b6c3a9',500);label(c,'Ready when you are.',47,156,37,'#e4e5d4',500);
  label(c,'AI prepared. Human approved.',47,202,22,'#a0af96');bar(c,47,244,w-94,2,'#5a6a4d');
  roundRect(c,47,276,424,118,13,'#27372b');label(c,'The next step is yours.',72,323,24,'#d2dac5');label(c,'Review · refine · approve',72,361,17,'#90a181');
  label(c,'V E N T U R A',47,487,17,'#b8a77b',500);
 },.082);
 const badge=new THREE.Group();badge.name='Approval seal';badge.position.set(.70,-.60,.18);group.add(badge);
 const disk=mesh(badge,new THREE.CylinderGeometry(.31,.31,.075,64),emerald);disk.rotation.x=Math.PI/2;
 const ring=mesh(badge,new THREE.TorusGeometry(.296,.011,8,64),gold,0,0,.044);
 stroke(badge,[[-.13,0,.052],[-.035,-.10,.052],[.15,.12,.052]],white,.022);
 group.userData.badge=badge;return group;
}

export function makePlane(){
 const group=new THREE.Group();group.name='Folded paper plane — action';
 // A dimensional folded sheet, with a central keel and two distinct wings.
 const tip=[1.13,.46,.04],tail=[-.95,-.46,0],ridge=[-.34,-.02,.27],left=[-.93,.60,-.04],right=[-.10,-.99,-.14];
 function tri(a,b,c,mat){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b,...c],3));g.computeVertexNormals();return mesh(group,g,mat);}
 tri(tip,left,ridge,cream);tri(tip,ridge,right,paper);tri(ridge,tail,right,fold);tri(tip,tail,ridge,cream);
 straight(group,tip,ridge,fineGold,.009);straight(group,ridge,tail,fold,.007);
 // The slim, trailing receipt makes the idea of a completed action concrete.
 const receipt=new THREE.Group();receipt.position.set(-.66,-.15,-.22);receipt.rotation.z=-.20;group.add(receipt);
 slab(receipt,.79,.39,.025,.04,ink);
 lettering(receipt,.76,.36,(c,w,h)=>{dot(c,62,183/2,15,'#afbf8c');label(c,'SENT',113,117,71,'#c8d2b6',500);},.022);
 group.userData.receipt=receipt;return group;
}

export function makeSignal(){const group=new THREE.Group();const core=mesh(group,new THREE.SphereGeometry(.047,16,10),luminous);const halo=mesh(group,new THREE.SphereGeometry(.12,16,10),new THREE.MeshBasicMaterial({color:0xe6c782,transparent:true,opacity:.13,depthWrite:false,blending:THREE.AdditiveBlending}));return group;}

export function makeConnection(points){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'catmullrom',.4);const geo=new THREE.TubeGeometry(curve,90,.009,5,false);const material=new THREE.MeshStandardMaterial({color:0x9b865b,metalness:.7,roughness:.47,transparent:true,opacity:0});const tube=new THREE.Mesh(geo,material);tube.name='Champagne workflow connection';return {curve,tube};}

export function environment(renderer){
 const env=new THREE.Scene();const room=new THREE.Mesh(new THREE.BoxGeometry(22,18,18),new THREE.MeshStandardMaterial({color:0x88857b,side:THREE.BackSide}));env.add(room);
 env.add(new THREE.AmbientLight(0xffffff,.8));
 const panels=[[-5,5,5,3,7,1,9],[5,1,3,2,9,1,6],[0,7,-2,9,1,3,8],[-1,-5,3,4,.8,2,2],[1,0,-8,8,8,1,2]];
 for(const[x,y,z,w,h,d,power]of panels){const light=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({color:new THREE.Color(power,power*.96,power*.86)}));light.position.set(x,y,z);env.add(light);}
 const pmrem=new THREE.PMREMGenerator(renderer);const target=pmrem.fromScene(env,.025,.1,50);env.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});pmrem.dispose();return target;
}

// Small everyday fragments share geometry and textures across the opening cluster.
export function makeClutterLibrary(){
 const note=new THREE.Group();note.name='Loose reminder';
 const noteMat=new THREE.MeshStandardMaterial({color:0xc8b889,roughness:.88,side:THREE.DoubleSide});
 polygon(note,[[-.43,-.43],[.26,-.43],[.43,-.25],[.43,.43],[-.43,.43]],noteMat);
 polygon(note,[[.26,-.43],[.26,-.25],[.43,-.25]],fold,.012);
 lettering(note,.80,.80,(c,w,h)=>{label(c,'DON’T FORGET',64,127,40,'#5b593a',500);bar(c,64,200,540,13,'#8e8762');bar(c,64,267,458,13,'#8e8762');bar(c,64,334,507,13,'#8e8762');label(c,'Follow up.',64,510,68,'#454e35',500);},.022);

 const message=new THREE.Group();message.name='Another conversation';
 slab(message,1.23,.62,.035,.12,cream);
 polygon(message,[[-.39,-.27],[-.43,-.45],[-.15,-.27]],cream);
 lettering(message,1.17,.55,(c,w,h)=>{dot(c,74,93,31,'#9eac8e');label(c,'Just checking in…',135,107,35,'#42513d',500);bar(c,135,151,474,9,'#a6af99');bar(c,135,189,321,9,'#bdc3b0');},.035);

 const receipt=new THREE.Group();receipt.name='Loose receipt';
 const points=[[-.30,.63],[.30,.63],[.30,-.63]];for(let i=0;i<9;i++)points.push([.30-i*.075,-.63+(i%2)*.06]);
 polygon(receipt,points,cream);
 lettering(receipt,.55,1.17,(c,w,h)=>{label(c,'NOTES',70,145,69,'#506044',500);bar(c,70,210,620,4,'#bcc2aa');for(let i=0;i<7;i++){bar(c,70,298+i*108,340+(i%3)*77,14,'#a5b194');bar(c,570,298+i*108,112,14,'#899779');}bar(c,70,1114,618,4,'#bcc2aa');label(c,'TO FILE',70,1245,47,'#8b7b52',500);},.025);

 const attachment=new THREE.Group();attachment.name='An attachment to organise';
 slab(attachment,1.14,.47,.035,.065,ink);
 lettering(attachment,1.08,.41,(c,w,h)=>{roundRect(c,30,40,136,190,15,'#62735b');label(c,'PDF',45,154,51,'#ece9d8',500);label(c,'Project brief',201,106,37,'#d8dfcc',500);label(c,'Attachment · v2',201,170,29,'#9fae90');},.035);

 const calendar=new THREE.Group();calendar.name='A date to remember';
 slab(calendar,.70,.82,.032,.065,paper);
 lettering(calendar,.65,.76,(c,w,h)=>{roundRect(c,0,0,w,186,0,'#748269');label(c,'NEXT WEEK',107,121,58,'#e4e8d7',500);label(c,'12',162,632,400,'#3b4e38',500);bar(c,165,715,442,11,'#a3ae92');},.033);
 const clip=new THREE.Group();clip.name='Loose metal paper clip';
 stroke(clip,[[-.1,-.42,.02],[-.2,-.34,.02],[-.2,.33,.02],[-.1,.43,.02],[.1,.43,.02],[.2,.33,.02],[.2,-.26,.02],[.1,-.36,.02],[0,-.36,.02],[-.06,-.25,.02],[-.06,.24,.02],[.04,.28,.02],[.07,.17,.02],[.07,-.14,.02]],gold,.023);
 const trend=new THREE.Group();trend.name='Trend analysis';
 slab(trend,1.12,.79,.033,.06,ink);
 lettering(trend,1.06,.73,(c,w,h)=>{
  label(c,'ACTIVITY / TREND',42,69,27,'#b6c4a1',500);
  for(let y=130;y<440;y+=84)bar(c,42,y,w-84,2,'#67785e66');
  const pts=[[44,376],[148,310],[245,335],[345,221],[452,252],[555,166],[719,126]];
  c.beginPath();c.moveTo(44,450);for(const [x,y] of pts)c.lineTo(x,y);c.lineTo(719,450);c.closePath();c.fillStyle='#aebe8526';c.fill();
  c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle='#d3bc83';c.lineWidth=9;c.lineJoin='round';c.stroke();dot(c,719,126,12,'#efe3bd');
 },.035);

 const table=new THREE.Group();table.name='Spreadsheet data';
 slab(table,.97,.87,.028,.035,cream);
 lettering(table,.92,.82,(c,w,h)=>{
  label(c,'SOURCE DATA',43,68,30,'#506247',500);
  roundRect(c,36,101,w-72,77,7,'#829575');
  ['A','B','C','D'].forEach((t,i)=>label(c,t,81+i*176,152,26,'#f2f0e4',500));
  for(let r=0;r<5;r++)for(let col=0;col<4;col++){const x=36+col*176,y=192+r*83;roundRect(c,x,y,166,73,3,(r+col)%3===0?'#d4ddc9':'#e6eadc');label(c,String(12+r*17+col*9),x+27,y+48,28,'#52694a');}
 },.033);

 const distribution=new THREE.Group();distribution.name='Dimensional data distribution';
 const values=[.40,.27,.20,.13],materials=[gold,sage,silver,ink];let angle=.10;
 values.forEach((value,i)=>{const arc=value*Math.PI*2-.10;const segment=mesh(distribution,new THREE.TorusGeometry(.37,.092,10,36,arc),materials[i]);segment.rotation.z=angle;angle+=arc+.10;});

 const bars=new THREE.Group();bars.name='Comparative analysis';
 slab(bars,1.0,.81,.032,.055,paper);
 lettering(bars,.95,.76,(c,w,h)=>{label(c,'CHANNELS',43,71,33,'#4d6245',500);for(let i=0;i<4;i++)bar(c,43,153+i*113,680,2,'#a8b79a88');},.035);
 for(let i=0;i<5;i++){const height=[.19,.36,.27,.51,.43][i];slab(bars,.10,height,.065,.014,i===3?gold:sage,-.35+i*.174,-.30+height/2,.075);}

 const heatmap=new THREE.Group();heatmap.name='Pattern analysis';
 slab(heatmap,.87,.85,.035,.06,ink);
 lettering(heatmap,.81,.79,(c,w,h)=>{label(c,'PATTERNS',44,78,34,'#bbc9a7',500);const colors=['#384d39','#617b4f','#91a675','#bfb884'];for(let r=0;r<5;r++)for(let col=0;col<6;col++)roundRect(c,42+col*115,138+r*114,93,93,9,colors[(r*3+col*2+(r%2))%4]);},.037);

 const dataset=new THREE.Group();dataset.name='Structured data extract';
 slab(dataset,1.17,.48,.035,.045,ink);
 lettering(dataset,1.10,.42,(c,w,h)=>{label(c,'{ }',29,152,75,'#c9b47d',500);label(c,'DATASET',189,86,31,'#c7d4b6',500);label(c,'rows → fields → insights',189,157,26,'#9aad89');},.036);
 return [note,message,receipt,attachment,calendar,clip,trend,table,distribution,bars,heatmap,dataset];
}
