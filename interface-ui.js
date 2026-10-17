'use strict';
(()=>{
 const $=s=>document.querySelector(s),lab=$('#laboratory'),nav=$('.lab-nav'),collection=$('#collection-panel');
 const tr=s=>window.FishI18n?.translate(s)||s;
 // Keep mobile utilities in the laboratory menu, and restore their original
 // locations in rooms and on desktop so they remain available everywhere.
 const mobileUtilities=matchMedia('(max-width:720px)'),utilityMenu=document.querySelector('.lab-shortcut-buttons');
 const utilities=['fish-language-control','fish-audio-toggle','fish-audio-settings'].map(id=>{
  const control=document.getElementById(id);if(!control)return null;
  const marker=document.createComment('Original position: '+id);control.before(marker);return {control,marker};
 }).filter(Boolean);
 const placeUtilities=()=>{for(const {control,marker} of utilities){if(mobileUtilities.matches&&!lab.hidden&&utilityMenu)utilityMenu.append(control);else marker.after(control);}};
 new MutationObserver(placeUtilities).observe(lab,{attributes:true,attributeFilter:['hidden']});mobileUtilities.addEventListener('change',placeUtilities);placeUtilities();
 for(const brand of document.querySelectorAll('.top .brand,.room-header .room-brand')){
  const home=document.createElement('a');home.className='brand-home';home.href='#room';home.setAttribute('aria-label',tr('Torna alla Stanza 1'));
  home.append(...brand.childNodes);brand.append(home);
  home.onclick=event=>{event.preventDefault();document.getElementById('back-room').click();document.getElementById('room-breeders').click();};
  document.addEventListener('fish-language-change',()=>home.setAttribute('aria-label',tr('Torna alla Stanza 1')));
 }
 document.addEventListener('keydown',event=>{
  if(!event.shiftKey||event.ctrlKey||event.altKey||event.metaKey||event.repeat||event.isComposing||event.key.toLowerCase()!=='c')return;
  if(event.target instanceof Element&&event.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])'))return;
  const amount=window.bettaApp.store.cheatCoins();
  if(amount){event.preventDefault();window.bettaApp.message('+'+amount+' ◈');}
 });
 // Keep the existing month action available in both laboratory tasks.
 $('#season').after($('#advance'));
 const setTask=()=>{lab.dataset.task='breed';showCollection();window.dispatchEvent(new Event('resize'));};
 const rail=document.createElement('button');rail.id='toggle-collection';rail.className='secondary collection-toggle';rail.type='button';rail.setAttribute('aria-controls','collection-panel');
 const showCollection=()=>{collection.hidden=false;rail.setAttribute('aria-expanded','true');};
 collection.before(rail);collection.hidden=true;rail.setAttribute('aria-expanded','false');rail.textContent=tr('Il tuo allevamento · mostra / nascondi');rail.onclick=()=>{collection.hidden=!collection.hidden;rail.setAttribute('aria-expanded',String(!collection.hidden));};
 nav.remove();
 const menu=$('#fish-more-menu');for(const button of [...$('#fish-actions').children])if(button.tagName==='BUTTON')menu.append(button);
 const choose=document.createElement('button');choose.id='choose-observed-parent';choose.className='primary';$('#fish-actions').prepend(choose);
 function update(){const s=window.bettaApp.store.getState(),fish=s.fish.find(f=>f.id===s.selected)||s.fish[0];if(!fish)return;choose.hidden=s[fish.sex==='F'?'mother':'father']===fish.id;choose.textContent=tr(fish.sex==='F'?'Scegli come madre':'Scegli come padre');const status=BettaStore.selectionStatus(s,fish);choose.disabled=!status.allowed;choose.title=status.reason||'';}
 choose.onclick=()=>{const s=window.bettaApp.store.getState();window.bettaApp.store.pick(s.selected);setTask('breed');$('#breeding-panel').scrollIntoView({block:'start'});};
 window.bettaApp.store.subscribe(update);document.addEventListener('fish-language-change',update);update();
 window.FishInterface={setTask,showCollection};
 document.addEventListener('click',e=>{if(e.target.closest('.card-actions .pick:last-child'))setTask('breed');if(e.target.closest('.slot .pick'))showCollection();},true);
 const tools=$('.room-tools'),controls=$('.room-controls');tools.open=false;controls.prepend($('#room-lab'));controls.insertBefore($('#room-customize'),tools);$('.room-tools-content').append($('.room-pan'));tools.addEventListener('click',e=>{if(e.target.closest('button'))tools.open=false;});
 $('.room-header').append($('.room-navigation'));
 // Description and tank status share normal flow instead of overlapping anchors.
 const roomSummary=document.createElement('div');roomSummary.className='room-summary';
 $('.room-bottom').prepend(roomSummary);roomSummary.append($('.room-intro'),$('.room-context'));
 document.addEventListener('click',e=>{if(!tools.contains(e.target))tools.open=false;});
 const tutorial=$('#starter-guide');if(tutorial){const place=()=>{const room=lab.hidden;tutorial.classList.toggle('lab-tutorial',!room);(room?$('#room'):lab).append(tutorial);};new MutationObserver(place).observe(lab,{attributes:true,attributeFilter:['hidden']});place();}
 setTask();
})();
