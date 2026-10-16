'use strict';
(()=>{
 const $=s=>document.querySelector(s),lab=$('#laboratory'),nav=$('.lab-nav'),collection=$('#collection-panel');
 const tr=s=>window.FishI18n?.translate(s)||s;
 document.addEventListener('keydown',event=>{
  if(!event.shiftKey||event.ctrlKey||event.altKey||event.metaKey||event.repeat||event.isComposing||event.key.toLowerCase()!=='c')return;
  if(event.target instanceof Element&&event.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])'))return;
  const amount=window.bettaApp.store.cheatCoins();
  if(amount){event.preventDefault();window.bettaApp.message('+'+amount+' ◈');}
 });
 // Keep the existing month action available in both laboratory tasks.
 $('#season').after($('#advance'));
 let task='observe';
 const setTask=value=>{task=value;lab.dataset.task=value;for(const link of nav.children)link.setAttribute('aria-current',link.dataset.task===value?'page':'false');if(value==='breed')showCollection();window.dispatchEvent(new Event('resize'));};
 const rail=document.createElement('button');rail.id='toggle-collection';rail.className='secondary collection-toggle';rail.type='button';rail.setAttribute('aria-controls','collection-panel');
 const showCollection=()=>{collection.hidden=false;rail.setAttribute('aria-expanded','true');};
 collection.before(rail);collection.hidden=true;rail.setAttribute('aria-expanded','false');rail.textContent=tr('Il tuo allevamento · mostra / nascondi');rail.onclick=()=>{collection.hidden=!collection.hidden;rail.setAttribute('aria-expanded',String(!collection.hidden));};
 [...nav.children].forEach((link,i)=>{link.dataset.task=i===1?'breed':'observe';link.onclick=()=>{setTask(link.dataset.task);if(i===2)showCollection();};});
 const menu=$('#fish-more-menu');for(const button of [...$('#fish-actions').children])if(button.tagName==='BUTTON')menu.append(button);
 const choose=document.createElement('button');choose.id='choose-observed-parent';choose.className='primary';$('#fish-actions').prepend(choose);
 function update(){const s=window.bettaApp.store.getState(),fish=s.fish.find(f=>f.id===s.selected)||s.fish[0];if(!fish)return;choose.textContent=tr(fish.sex==='F'?'Scegli come madre':'Scegli come padre');const status=BettaStore.selectionStatus(s,fish);choose.disabled=!status.allowed;choose.title=status.reason||'';}
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
 setTask('observe');
})();
