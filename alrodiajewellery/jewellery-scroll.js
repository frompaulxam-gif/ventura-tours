(() => {
  if (document.body.dataset.site !== 'jewellery') return;
  const body = document.body;
  const hero = document.querySelector('.jewellery-hero');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const pieces = [
    {category:'The ring collection', heading:'A little forever.', title:'The solitaire.', description:'A brilliant centre. A simple promise.', note:['A moment.','A promise.','A piece of you.'], detail:['A single stone.','A lasting moment.'], storyLabel:'For a moment that lasts.', storyTitle:['A small circle.','A whole world of meaning.'], storyText:'A promise to someone else, or a milestone of your own. Explore Alródia’s rings and find a piece to mark your moment.', image:'assets/ring.png', alt:'Close detail of the solitaire’s diamond and gold setting', link:'ring', plural:'rings', light:'golden'},
    {category:'The necklace collection', heading:'Keep it close.', title:'The pendant.', description:'A delicate chain. A little light, close to you.', note:['A little detail.','An everyday ritual.','Always close.'], detail:['A fine chain.','A point of light.'], storyLabel:'Something to keep close.', storyTitle:['An everyday piece.','A personal kind of precious.'], storyText:'A simple pendant can carry a whole story. Explore Alródia’s necklaces for a thoughtful gift or a piece that becomes part of your every day.', image:'assets/necklace.png', alt:'Close detail of the diamond pendant and delicate gold chain', link:'necklace', plural:'necklaces', light:'daylight'},
    {category:'The earring collection', heading:'Catch the light.', title:'The diamond drops.', description:'A little movement. A beautiful finishing touch.', note:['A turn of the head.','A little sparkle.','All you.'], detail:['A matching pair.','Light in motion.'], storyLabel:'The detail that makes the day.', storyTitle:['A finishing touch.','A feeling all of your own.'], storyText:'From everyday dressing to a special evening, find earrings that feel like you. Discover the Alródia collection and choose your finishing touch.', image:'assets/earrings.png', alt:'Close detail of gold earrings and round diamond drops', link:'earrings', plural:'earrings', light:'evening'}
  ];
  const wrapper = document.querySelector('.jewellery-scroll');
  const objects = [...hero.querySelectorAll('.jewel-piece')];
  const chapters = [...hero.querySelectorAll('[data-chapter]')];
  const copy = [...hero.querySelectorAll('.hero-intro,.piece-copy,.jewel-side-note,.jewel-detail-note')];
  const progressBar = hero.querySelector('.jewel-scroll-progress span');
  const base = 'https://philippinesgreatbritain.com/alrodia-diamonds/ols/categories/';
  const backgrounds = ['oklch(19% .016 20)','oklch(26% .024 255)','oklch(17% .031 322)'];
  let active = -1, frame = 0;
  let travel = 1, start = 0;
  const clamp = value => Math.min(1, Math.max(0, value));
  const ease = value => { const t = clamp(value); return t*t*(3-2*t); };
  const reduced = () => media.matches || body.classList.contains('motion-paused');
  function text(id, value) { const el=document.getElementById(id); if(el.textContent!==value) el.textContent = value; }
  function lines(id, values) {
    document.getElementById(id).replaceChildren(...values.flatMap((value,index) => index ? [document.createElement('br'),document.createTextNode(value)] : [document.createTextNode(value)]));
  }
  function setPiece(index) {
    if (index === active) return;
    active = index;
    const piece = pieces[index];
    body.dataset.piece = String(index);
    body.dataset.light = piece.light;
    text('piece-collection',piece.category);
    text('jewellery-title',piece.heading);
    text('piece-title',piece.title);
    text('piece-description',piece.description);
    lines('piece-note',piece.note);
    lines('piece-detail',piece.detail);
    text('piece-link-label','Explore '+piece.plural);
    document.getElementById('piece-link').href = base+piece.link;
    text('piece-story-label',piece.storyLabel);
    lines('piece-story-title',piece.storyTitle);
    text('piece-story-text',piece.storyText);
    const enquiry = document.getElementById('piece-enquiry');
    enquiry.textContent = 'Enquire about '+piece.plural;
    enquiry.href = 'mailto:alrodia.jewellers@gmail.com?subject='+encodeURIComponent('Alrodia '+piece.plural+' enquiry');
    const closeup = document.getElementById('piece-closeup');
    closeup.src = piece.image; closeup.alt = piece.alt;
    chapters.forEach((chapter,i) => {
      chapter.classList.toggle('current-chapter', i===index);
      if(i===index) chapter.setAttribute('aria-current','step'); else chapter.removeAttribute('aria-current');
    });
    document.querySelectorAll('.collection-links a').forEach(a=>a.classList.toggle('selected-collection',a.href===base+piece.link));
  }
  function render() {
    frame = 0;
    const p = clamp((scrollY-start)/travel);
    // Reading holds alternate with two scroll-scrubbed transitions.
    const first = ease((p-.16)/.22);
    const second = ease((p-.57)/.22);
    const position = first+second;
    const index = Math.round(position);
    const still = reduced();
    setPiece(index);
    const from = Math.min(1,Math.floor(position));
    const mix = (position-from)*100;
    hero.style.backgroundColor = still ? backgrounds[index] : `color-mix(in oklab, ${backgrounds[from]} ${100-mix}%, ${backgrounds[from+1]} ${mix}%)`;
    objects.forEach((object,i) => {
      const distance = i-position;
      const amount = Math.min(1,Math.abs(distance));
      const showing = still ? i===index : amount<1;
      object.style.visibility = showing ? 'visible' : 'hidden';
      object.style.opacity = still ? (showing?'1':'0') : String(1-ease(amount));
      const baseRotation = [-15,0,-5][i];
      const turn = still ? 0 : (p*2-1)*9;
      const x = still ? 0 : distance*Math.min(innerWidth*.62,800);
      const y = still ? 0 : distance*85;
      const rotation = baseRotation+(still ? 0 : distance*32+turn);
      const scale = still ? 1 : 1-amount*.24;
      object.style.transform = `translate3d(${x}px,${y}px,0) rotateY(${still?0:distance*-24}deg) rotate(${rotation}deg) scale(${scale})`;
    });
    const distanceFromChange = Math.abs(position-index);
    const opacity = still ? 1 : 1-ease(distanceFromChange/.5);
    const copyOffset = still ? 0 : (position-index)*-24;
    copy.forEach(el => { el.style.opacity=String(opacity); el.style.translate=`0 ${copyOffset}px`; });
    progressBar.style.transform=`scaleX(${p})`;
    hero.querySelector('.jewel-orbit').style.transform=`rotate(${-27+(still?0:p*36)}deg)`;
    text('scroll-instruction', p>.94 ? 'Scroll to explore more' : 'Scroll to discover');
  }
  function requestRender() { if(!frame) frame=requestAnimationFrame(render); }
  function measure() {
    start = wrapper.getBoundingClientRect().top+scrollY;
    travel = Math.max(1,wrapper.offsetHeight-hero.offsetHeight);
    requestRender();
  }
  addEventListener('scroll',requestRender,{passive:true});
  addEventListener('resize',measure,{passive:true});
  addEventListener('pageshow',measure);
  document.addEventListener('alrodia:motion',requestRender);
  media.addEventListener('change',requestRender);
  new ResizeObserver(measure).observe(hero);
  // Native page scrolling remains available to wheel, touch, Space and Page Down.
  // Arrow keys provide the same scroll journey when the scene has keyboard focus.
  hero.addEventListener('keydown',e=>{
    if(e.target!==hero || !['ArrowLeft','ArrowRight'].includes(e.key))return;
    e.preventDefault();
    const next=Math.max(0,Math.min(2,active+(e.key==='ArrowRight'?1:-1)));
    scrollTo({top:start+[0,.48,.9][next]*travel,behavior:reduced()?'instant':'smooth'});
  });
  measure();
})();
