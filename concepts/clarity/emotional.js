// Two independent visual languages: tension becoming order, and a held breath releasing.
// No office objects or dashboard geometry are used in either scene.
export function createEmotionalScenes(THREE){
 const clamp=n=>Math.max(0,Math.min(1,n));
 const ease=n=>{n=clamp(n);return n*n*n*(n*(n*6-15)+10);};
 const range=(p,a,b)=>ease((p-a)/(b-a));
 const untangle=new THREE.Group();untangle.name='Untangle — tension to flow';
 const exhale=new THREE.Group();exhale.name='Exhale — pressure to open space';
 const threadMaterials=[
  new THREE.MeshPhysicalMaterial({color:0xe7cf96,metalness:.90,roughness:.24,clearcoat:.5,transparent:true}),
  new THREE.MeshPhysicalMaterial({color:0xecedf0,metalness:.93,roughness:.21,clearcoat:.5,transparent:true}),
  new THREE.MeshPhysicalMaterial({color:0xe5dfd0,metalness:.32,roughness:.43,clearcoat:.25,transparent:true})
 ];
 const threads=[];
 // Matching topology lets the GPU morph each whole thread without replacing buffers.
 for(let i=0;i<12;i++){
  const start=[],finish=[],phase=i*2.399963,turns=1.65+(i%4)*.17;
  for(let j=0;j<=128;j++){
   const t=j/128,a=t*Math.PI*2*turns+phase;
   const r=1.12+.98*Math.sin(t*Math.PI*6+phase*.63);
   start.push(new THREE.Vector3(
    r*Math.cos(a)+.32*Math.sin(t*Math.PI*8+i),
    r*Math.sin(a)*1.03+.34*Math.cos(t*Math.PI*5+phase),
    .76*Math.sin(t*Math.PI*7+phase)+.35*Math.cos(a*1.7)
   ));
   finish.push(new THREE.Vector3(-3.45+t*6.9,2.0+(i-5.5)*.14+.32*Math.sin(t*Math.PI*2-.5),.04*Math.sin(t*Math.PI*2+i)));
  }
  const a=new THREE.CatmullRomCurve3(start),b=new THREE.CatmullRomCurve3(finish);
  const radius=i%4===1?.031:.020;
  const geometry=new THREE.TubeGeometry(a,144,radius,7,false),target=new THREE.TubeGeometry(b,144,radius,7,false);
  geometry.morphAttributes.position=[target.attributes.position];geometry.morphAttributes.normal=[target.attributes.normal];
  const material=threadMaterials[i%3].clone();const model=new THREE.Mesh(geometry,material);model.frustumCulled=false;
  model.name=`Thread ${i+1}`;untangle.add(model);threads.push({model,material,keeper:i%4===1,delay:(i%3)*.018});
 }
 const pebbleGeometry=new THREE.SphereGeometry(1,24,16),position=pebbleGeometry.attributes.position;
 for(let i=0;i<position.count;i++){const x=position.getX(i),y=position.getY(i),z=position.getZ(i);position.setXYZ(i,x+.10*y*z,y+.035*x*x,z+.10*y*y);}
 pebbleGeometry.computeVertexNormals();
 const petals=[];
 const tones=[0xf1eadb,0xd5d9dd,0xcbb580,0xe1ddd3,0x9ca2a7];
 for(let i=0;i<72;i++){
  const angle=i*2.3999632297,radius=Math.sqrt((i+.4)/72)*2.46;
  const material=new THREE.MeshPhysicalMaterial({color:tones[i%5],metalness:i%5===2?.72:.36,roughness:.27+(i%4)*.055,clearcoat:.62,clearcoatRoughness:.26,transparent:true});
  const mesh=new THREE.Mesh(pebbleGeometry,material);mesh.name=`Soft form ${i+1}`;
  const width=.36+(i%5)*.045,length=.50+(i%4)*.055,thickness=.15+(i%3)*.028;
  const initial=new THREE.Vector3(Math.cos(angle)*radius,Math.sin(angle)*radius*1.04,.50*Math.sin(angle*2)+.36*Math.cos(radius*2));
  exhale.add(mesh);petals.push({mesh,material,angle,radius,initial,width,length,thickness,tilt:.35*Math.sin(i*1.7),delay:(i%5)*.012});
 }
 function updateUntangle(progress,fit){
  untangle.scale.setScalar(fit*.98);
  for(const thread of threads){
   const t=range(progress,.12+thread.delay,.70+thread.delay);
   thread.model.morphTargetInfluences[0]=t;
   thread.material.opacity=thread.keeper?1:1-range(progress,.64+thread.delay,.88+thread.delay);
   thread.model.visible=thread.material.opacity>.002;
  }
 }
 function updateExhale(progress,fit,viewWidth,viewHeight){
  fit*=.88;
  exhale.scale.setScalar(fit);
  for(const p of petals){
   const release=range(progress,.10+p.delay,.88+p.delay),out=Math.pow(release,1.35);
   const angle=p.angle+.36*Math.sin(release*Math.PI);
   // Travel beyond the edge in every aspect ratio, leaving an actual empty centre.
   const edge=Math.max(viewWidth,viewHeight)*.69/fit+2.1;
   const radius=p.radius+(edge-p.radius)*out;
   p.mesh.position.set(Math.cos(angle)*radius,Math.sin(angle)*radius*1.04,p.initial.z*(1-release)-release*.8);
   p.mesh.rotation.set(p.tilt+release*.60,.5*Math.cos(p.angle)+release*.26,angle-.65+release*.45);
   const size=1+Math.sin(release*Math.PI)*.10;
   p.mesh.scale.set(p.width*size,p.length*size,p.thickness*size);
   p.material.opacity=1-range(progress,.58+p.delay,.96+p.delay);
   p.mesh.visible=p.material.opacity>.002&&progress<.999;
  }
 }
 untangle.visible=false;exhale.visible=false;
 return {untangle,exhale,update(progress,type,fit,viewWidth,viewHeight){
  untangle.visible=type==='untangle';exhale.visible=type==='exhale';
  if(untangle.visible)updateUntangle(progress,fit);
  if(exhale.visible)updateExhale(progress,fit,viewWidth,viewHeight);
 }};
}
