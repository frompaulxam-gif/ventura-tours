(() => {
  const model=document.querySelector('.jar-model');
  const track=document.querySelector('.hero-track');
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  if(!model?.dataset.sequence || reducedMotion.matches)return;
  async function start(){
    const response=await fetch('assets/jar-sequence/frames.json');if(!response.ok)return;
    const config=await response.json();
    const frames=new Array(config.count);let lastFrame=-1;
    const canvas=model.querySelector('canvas');canvas.width=config.width;canvas.height=config.height;
    const context=canvas.getContext('2d');
    const render=()=> {
      if(document.body.classList.contains('paused'))return;
      const bounds=track.getBoundingClientRect();
      const distance=Math.max(1,bounds.height-window.innerHeight);
      const progress=Math.max(0,Math.min(1,-bounds.top/distance));
      const desired=Math.round(progress*(config.count-1));
      let index=desired;
      if(!frames[index]){for(let offset=1;offset<config.count;offset++){if(frames[desired-offset]){index=desired-offset;break;}if(frames[desired+offset]){index=desired+offset;break;}}}
      if(!frames[index]||index===lastFrame)return;
      context.clearRect(0,0,config.width,config.height);context.drawImage(frames[index],0,0,config.width,config.height);
      lastFrame=index;canvas.dataset.frame=String(index);model.classList.add('frame-ready');
    };
    const load=async index=>{const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src='assets/jar-sequence/'+String(index).padStart(3,'0')+'.webp';});frames[index]=image;render();};
    await load(0);track.classList.add('sequence-active');render();
    addEventListener('scroll',render,{passive:true});addEventListener('resize',render,{passive:true});
    document.addEventListener('seamoss:motion',render);
    const stop=()=>{removeEventListener('scroll',render);removeEventListener('resize',render);document.removeEventListener('seamoss:motion',render);};
    reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){stop();track.classList.remove('sequence-active');model.classList.remove('frame-ready');}},{once:true});
    let next=1;await Promise.all(Array.from({length:4},async()=>{while(next<config.count){const index=next++;try{await load(index);}catch{}}}));
  }
  start().catch(()=>{track.classList.remove('sequence-active');model.classList.remove('frame-ready');});
})();
