(() => {
  const products = [
  {
    "id": "manuka-glow",
    "name": "Manuka Glow",
    "short": "Manuka honey, lemon, maca & ginseng.",
    "description": "Created with glow & radiance in mind. A seamoss blend with the sweetness of manuka honey, fresh lemon juice, maca root and ginseng.",
    "ingredients": [
      "Manuka honey",
      "Fresh lemon juice",
      "Maca root",
      "Ginseng"
    ],
    "note": "Contains honey. This blend is not vegan.",
    "post": "DSY2OQHCKgN",
    "purpose": "Glow & radiance"
  },
  {
    "id": "king-strength",
    "name": "King Strength",
    "short": "Mango, shilajit, reishi & tongkat ali.",
    "description": "Created with energy & stamina in mind. Seamoss and mango meet shilajit, reishi and tongkat ali in King Strength.",
    "ingredients": [
      "Seamoss",
      "Shilajit",
      "Reishi",
      "Tongkat ali",
      "Mango"
    ],
    "note": "",
    "post": "DSY0qLLiOgy",
    "purpose": "Energy & stamina"
  },
  {
    "id": "power-up",
    "name": "Power Up",
    "short": "Goji berry, beetroot, ginseng & lion’s mane.",
    "description": "Created with energy & focus in mind. A seamoss blend bringing together goji berry, ginseng, beetroot, cinnamon and lion’s mane.",
    "ingredients": [
      "Seamoss",
      "Goji berry",
      "Ginseng",
      "Beetroot",
      "Cinnamon",
      "Lion’s mane"
    ],
    "note": "",
    "post": "DSYzpXpiCdF",
    "purpose": "Energy & focus"
  },
  {
    "id": "rich-clarification",
    "name": "Rich Clarification",
    "short": "Dates, cinnamon, lion’s mane & black maca.",
    "description": "Created with focus & clarity in mind. Dates and cinnamon sit alongside lion’s mane and black maca in this seamoss blend.",
    "ingredients": [
      "Dates",
      "Cinnamon",
      "Lion’s mane",
      "Black maca"
    ],
    "note": "The brand advises against consuming this blend during pregnancy.",
    "post": "DSTnyoviFSv",
    "purpose": "Focus & clarity"
  },
  {
    "id": "all-night-long",
    "name": "All Night Long",
    "short": "Mondia, damiana, ginseng & vanilla.",
    "description": "Created with desire & balance in mind. A seamoss blend of mondia, damiana, ginseng and vanilla.",
    "ingredients": [
      "Mondia",
      "Damiana",
      "Ginseng",
      "Vanilla"
    ],
    "note": "The brand advises against consuming this blend during pregnancy or if you have heart problems.",
    "post": "DSTjdDvCIza",
    "purpose": "Desire & balance"
  },
  {
    "id": "gut-health-booster",
    "name": "Golden Ginger",
    "short": "Ginger stem, black ginger, black maca & turmeric.",
    "description": "Golden Ginger brings together ginger stem, black maca, black ginger and turmeric in a seamoss blend.",
    "ingredients": [
      "Ginger stem",
      "Black maca",
      "Black ginger",
      "Turmeric"
    ],
    "note": "",
    "post": "DSTfE02iL22",
    "purpose": "Ginger & turmeric"
  }
];
  const body = document.body;
  const menuButton = document.querySelector('.menu-button');
  const navigation = document.querySelector('#main-navigation');
  const productDialog = document.querySelector('.product-dialog');
  document.querySelector('.motion-toggle').addEventListener('click',event => {
    const paused=body.classList.toggle('paused');
    event.currentTarget.setAttribute('aria-pressed',String(paused));
    event.currentTarget.setAttribute('aria-label',paused?'Play animations':'Pause animations');
    event.currentTarget.innerHTML=paused?'Play motion <span aria-hidden="true">▷</span>':'Pause motion <span aria-hidden="true">Ⅱ</span>';
    document.dispatchEvent(new CustomEvent('seamoss:motion',{detail:{paused}}));
  });
  const closeMenu=()=> { navigation.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open navigation'); };
  menuButton.addEventListener('click',()=> { const open=navigation.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation'); });
  navigation.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=> { if(event.key==='Escape'&&navigation.classList.contains('open')){closeMenu();menuButton.focus();} });
  document.querySelectorAll('[data-product]').forEach(button=>button.addEventListener('click',()=> {
    const product=products.find(item=>item.id===button.dataset.product);
    const image=document.querySelector('#product-dialog-image');const version='?v=real1';image.src='assets/blends/'+product.id+'.webp'+version;image.srcset='assets/blends/'+product.id+'-768.webp'+version+' 768w, assets/blends/'+product.id+'.webp'+version+' 1536w';image.sizes='(max-width: 700px) calc(100vw - 24px), 46vw';image.alt='Creative ingredient still life for Super Seamoss '+product.name;
    document.querySelector('#product-dialog-title').textContent=product.name;
    document.querySelector('#product-dialog-description').textContent=product.description;
    document.querySelector('#product-dialog-ingredients').replaceChildren(...product.ingredients.map(ingredient=> { const item=document.createElement('li');item.textContent=ingredient;return item; }));
    const note=document.querySelector('#product-dialog-note');note.textContent=product.note;note.hidden=!product.note;
    document.querySelector('#product-dialog-source').href='https://www.instagram.com/super.seamoss/p/'+product.post+'/';
    productDialog.showModal();body.classList.add('dialog-open');productDialog.scrollTop=0;
  }));
  productDialog.querySelector('.close-button').addEventListener('click',()=>productDialog.close());
  productDialog.addEventListener('click',event=> { if(event.target!==productDialog)return;const rect=productDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)productDialog.close(); });
  productDialog.addEventListener('close',()=>body.classList.remove('dialog-open'));
  if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.documentElement.classList.add('js-motion');
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target);}}),{threshold:.08});
    document.querySelectorAll('.reveal').forEach(element=>observer.observe(element));
  }
})();
