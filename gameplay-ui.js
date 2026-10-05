'use strict';
(()=>{
 const store=window.bettaApp.store,node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;},button=(text,run,id)=>{const b=node('button',text,'secondary');b.type='button';if(id)b.id=id;b.onclick=run;return b;};
 const dialog=node('dialog',undefined,'life-dialog');dialog.id='life-panel';dialog.setAttribute('aria-labelledby','life-title');const head=node('header'),title=node('h2','La vita dell’allevamento');title.id='life-title';head.append(title,button('Chiudi',()=>dialog.close()));const nav=node('nav'),content=node('section'),notice=node('p');notice.setAttribute('role','status');dialog.append(head,nav,notice,content);document.body.append(dialog);
 let tab='diary',geneId=null,contestFish=null,photoMode=false,paused=false;
 const tabs={diary:'Diario',genealogy:'Genealogia',photos:'Fotografie',customers:'Clienti',contests:'Concorsi',guide:'Guida'};
 for(const [id,text] of Object.entries(tabs)){const b=button(text,()=>{tab=id;render();});b.dataset.lifeTab=id;nav.append(b);}
 const run=fn=>{try{fn();notice.textContent='';}catch(e){notice.textContent=e.message;}};
 const open=(which='diary')=>{tab=which;render();if(!dialog.open)dialog.showModal();};
 for(const container of [document.querySelector('.room-pan'),document.querySelector('.top-right')])container.prepend(button('Diario e attività',()=>open(),'life-open-'+(container.classList.contains('room-pan')?'room':'lab')));
 function genealogy(s,id,depth=0,seen=new Set()){
  const f=[...s.fish,...(s.career?.archive||[])].find(f=>f.id===id),item=node('li');
  item.append(node('strong',f?.name||'Esemplare #'+id),node('small',f?s.fish.some(x=>x.id===id)?' · in allevamento':' · nello storico':' · dati non disponibili'));
  if(depth<5&&!seen.has(id)&&f?.parents){const branch=node('ul'),path=new Set(seen);path.add(id);for(const parent of f.parents)branch.append(genealogy(s,parent,depth+1,path));item.append(branch);}return item;
 }
 function render(){
  const s=store.getState();content.replaceChildren();for(const b of nav.children)b.setAttribute('aria-pressed',String(b.dataset.lifeTab===tab));notice.textContent='';
  if(tab==='diary'){
   content.append(node('h3','Una storia, nidiata dopo nidiata'),node('p','Nascite, prime livree, vendite e concorsi restano qui, insieme ai tuoi progressi.'));
   const events=s.diary||[];if(!events.length)content.append(node('p','Il diario comincia con la tua prossima esperienza.'));
   for(const e of [...events].reverse()){const row=node('article',undefined,'diary-event');row.append(node('small','Mese '+e.month),node('p',e.text));for(const id of e.fishIds.slice(0,4))row.append(button('Genealogia #'+id,()=>{geneId=id;tab='genealogy';render();}));content.append(row);}
  }else if(tab==='genealogy'){
   content.append(node('h3','Albero genealogico'));const select=node('select');select.id='genealogy-fish';select.setAttribute('aria-label','Scegli il pesce per la genealogia');const fish=[...s.fish,...(s.career?.archive||[])];if(!fish.some(f=>f.id===geneId))geneId=s.selected;
   for(const f of fish){const option=node('option',f.name+' · #'+f.id);option.value=f.id;select.append(option);}select.value=geneId;select.onchange=()=>{geneId=Number(select.value);render();};content.append(select);const tree=node('ul',undefined,'genealogy-tree');tree.append(genealogy(s,geneId));content.append(tree,node('p','Lo storico conserva anche i genitori venduti. La vista mostra fino a cinque generazioni di antenati.'));
  }else if(tab==='photos'){
   content.append(node('h3','Il tuo album fotografico'),button('Entra in modalità foto',()=>{dialog.close();enterPhoto();}));const grid=node('div',undefined,'life-grid');
   for(const [i,p] of (s.photos||[]).entries()){const card=node('article'),image=node('img');image.src=p.data;image.alt=p.caption;card.append(image,node('p',p.caption),node('small','Mese '+p.month),button('Scarica',()=>download(p.data,'fishchromia-foto-'+(i+1)+'.jpg')),button('Rimuovi foto',()=>run(()=>store.deletePhoto(i))));grid.append(card);}content.append(grid);if(!(s.photos||[]).length)content.append(node('p','Inquadra una vasca o un pesce e scatta la tua prima fotografia. L’album conserva le ultime dodici foto.'));
  }else if(tab==='customers'){
   if(!s.career){content.append(node('p','I clienti abituali visitano il negozio in modalità carriera.'));return;}
   content.append(node('h3','Volti che tornano a trovarti'),node('p','Ogni cliente ha gusti propri. Gli acquisti costruiscono un rapporto e aumentano il budget delle visite successive.'));
   const grid=node('div',undefined,'life-grid');for(const r of BettaCareer.regulars){const relationship=s.career.regulars?.[r.id]||{visits:0,purchases:0},card=node('article');card.append(node('h4',r.name),node('p',r.description),node('p',relationship.visits+' visite · '+relationship.purchases+' acquisti'),node('small',relationship.purchases>=5?'Cliente affezionato':relationship.purchases?'Ti conosce già':'Un nuovo incontro'));const orders=s.career.orders.filter(o=>o.customerId===r.id&&['available','accepted'].includes(o.status));for(const order of orders)card.append(node('p','Richiesta: '+BettaCareer.byId(order.colorId).name+' · '+order.reward+' monete'));grid.append(card);}content.append(grid,button('Apri ordini',()=>{dialog.close();window.bettaCareerUI.open('orders');}));
  }else if(tab==='contests'){
   if(!s.career){content.append(node('p','I concorsi sono disponibili in modalità carriera.'));return;}
   const theme=BettaCareer.contest(s),entry=s.career.contestEntries?.find(e=>e.month===s.month);content.append(node('h3',theme.title),node('p','Un concorso al mese per gli adulti nati nel tuo allevamento. Il risultato è immediato: oro 220 monete, argento 140, bronzo 80.'));
   content.append(node('p','Punteggio del gioco: tema fino a 50 punti, generazione fino a 20, maturità fino a 10 e presentazione fino a 20.'));
   if(entry)content.append(node('p',entry.fishName+' · '+entry.score+' punti · '+entry.medal));else{
    const choices=s.fish.filter(f=>f.age>=4&&f.gen>=1&&!s.career.listings.some(l=>l.fishId===f.id)),select=node('select');select.id='contest-fish';select.setAttribute('aria-label','Esemplare per il concorso');for(const f of choices){const o=node('option',f.name+' · '+BettaCareer.contestScore(s,f)+' punti');o.value=f.id;select.append(o);}if(choices.some(f=>f.id===contestFish))select.value=contestFish;select.onchange=()=>contestFish=Number(select.value);const enter=button('Iscrivi al concorso',()=>run(()=>store.career('contest',{fishId:Number(select.value)})),'contest-enter');enter.disabled=!choices.length;content.append(select,enter);if(!choices.length)content.append(node('p','Fai crescere una nidiata fino a quattro mesi.'));
   }
   content.append(node('h3','La tua bacheca dei trofei'));for(const t of [...(s.career.trophies||[])].reverse())content.append(node('article','🏆 '+t.title+' · '+t.medal+' · '+t.fishName+' · mese '+t.month,'diary-event'));if(!s.career.trophies?.length)content.append(node('p','Il primo trofeo ti aspetta. I premi compaiono anche nella stanza.'));
  }else{
   content.append(node('h3','La tua prima nidiata e la prima vendita'),node('p','La guida ti accompagna in sei passi, usando i comandi del gioco. Puoi interromperla e riprenderla quando vuoi.'),button('Riprendi la guida',()=>{dialog.close();store.tutorial('resume');}),button('Nascondi la guida',()=>{store.tutorial('dismiss');dialog.close();}));
  }
 }
 // Playable onboarding, driven by saved milestones rather than elapsed time.
 const guide=node('aside',undefined,'starter-guide');guide.id='starter-guide';guide.setAttribute('aria-label','Primi passi');document.body.append(guide);
 function guideStep(s){const t=s.tutorial||{};if(t.sold)return 6;if(t.listed)return 5;if(t.grown)return 4;if(t.born)return 3;if(t.paired)return 2;if(t.observed)return 1;return 0;}
 const steps=[['Conosci i tuoi pesci','Apri il laboratorio per osservare il tuo primo esemplare.','Osserva un pesce'],['Scegli una coppia','Una femmina e un maschio pronti daranno origine alla prima nidiata.','Scegli la coppia'],['La prima nidiata','Genera quattro piccoli e ritrovali nella stanza di crescita.','Fai nascere i piccoli'],['Fai crescere i piccoli','Passa i mesi: a quattro mesi i tuoi discendenti potranno essere venduti.','Passa un mese'],['Prepara la prima vendita','Esponi un adulto nato qui a un prezzo accessibile per i clienti.','Prepara la vetrina'],['Il primo cliente','Visita il negozio: i clienti arrivano mentre giochi. Un prezzo basso facilita la prima vendita.','Visita il negozio'],['Hai completato la guida','Prima nidiata e prima vendita: scegli una nuova livrea o partecipa a un concorso.','Continua a giocare']];
 function updateGuide(s){guide.hidden=s.mode!=='career'||s.tutorial?.dismissed||photoMode;guide.replaceChildren();if(guide.hidden)return;const n=guideStep(s),step=steps[n];guide.append(node('small',n<6?'PRIMI PASSI · '+(n+1)+' / 6':'PRIMI PASSI COMPLETATI'),node('strong',step[0]),node('p',step[1]),button(step[2],()=>run(()=>tutorialAction(n)),'tutorial-next'),button('Più tardi',()=>store.tutorial('dismiss'),'tutorial-skip'));
 }
 function tutorialAction(n){
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());
  const s=store.getState();if(n===0){window.betta3d?.openLaboratory();store.tutorial('observe');}
  else if(n===1){const females=s.fish.filter(f=>f.sex==='F'),pair=females.flatMap(f=>s.fish.filter(m=>m.sex==='M').map(m=>[f,m])).find(([f,m])=>BettaStore.pairingStatus(s,f,m).allowed);if(!pair)throw Error('Non c’è una coppia pronta: passa un mese.');window.betta3d?.openLaboratory();store.choosePair(pair[0].id,pair[1].id);document.querySelector('.breeding').scrollIntoView({block:'center'});}
  else if(n===2)document.getElementById('breed').click();
  else if(n===3)document.getElementById('room-advance').click();
  else if(n===4){window.bettaCareerUI.open('shop');const select=document.getElementById('sale-fish'),f=s.fish.find(f=>f.gen>0&&f.age>=4&&!s.career.listings.some(l=>l.fishId===f.id));if(select&&f){select.value=f.id;select.dispatchEvent(new Event('change'));document.getElementById('sale-price').value=Math.max(1,Math.floor(BettaCareer.value(f,s.month)*.60));document.querySelector('.career-sale-form').scrollIntoView({block:'center'});}}
  else if(n===5)window.betta3d?.openShop();else store.tutorial('dismiss');
 }
 const tools=node('div');tools.id='photo-tools';tools.hidden=true;const caption=node('input');caption.id='photo-caption';caption.maxLength=120;caption.setAttribute('aria-label','Titolo della fotografia');
 const pause=button('Ferma movimento',()=>{paused=!paused;window.betta3d.photoPause(paused);pause.textContent=paused?'Riprendi movimento':'Ferma movimento';},'photo-pause');
 const rotate=button('Ruota pesce',()=>window.betta3d.photoRotate(.35,0),'photo-rotate');const photoStatus=node('span');photoStatus.setAttribute('role','status');
 tools.append(caption,pause,rotate,button('Scatta e salva',()=>run(capture),'photo-capture'),button('Esci',exitPhoto,'photo-exit'),photoStatus);document.body.append(tools);
 for(const container of [document.querySelector('.room-pan'),document.querySelector('.top-right')])container.prepend(button('Foto',enterPhoto,'photo-open-'+(container.classList.contains('room-pan')?'room':'lab')));
 function enterPhoto(){if(!window.betta3d?.getState().readyId){window.bettaApp.message('Attendi che la vista 3D sia pronta.');return;}photoMode=true;paused=false;document.body.classList.add('photo-mode');tools.hidden=false;guide.hidden=true;photoStatus.textContent='Trascina e usa lo zoom per scegliere l’inquadratura.';rotate.disabled=!document.getElementById('room').hidden;caption.value=document.getElementById('room').hidden?window.bettaSelected().name:FishI18n.translate('Il mio acquario');window.scrollTo(0,0);}
 function exitPhoto(){photoMode=false;paused=false;window.betta3d?.photoPause(false);document.body.classList.remove('photo-mode');tools.hidden=true;pause.textContent='Ferma movimento';updateGuide(store.getState());}
 function download(data,name){const link=node('a');link.href=data;link.download=name;link.click();}
 async function capture(){const data=window.betta3d.photoSnapshot();if(!data){photoStatus.textContent='La vista non è ancora pronta.';return;}try{const image=new Image();image.src=data;await image.decode();const canvas=document.createElement('canvas');const scale=Math.min(480/image.width,480/image.height);canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,canvas.width,canvas.height);const s=store.getState(),name=caption.value.trim()||FishI18n.translate('Il mio acquario');store.savePhoto(canvas.toDataURL('image/jpeg',.78),name,document.getElementById('room').hidden?s.selected:null);download(data,'fishchromia-'+s.month+'-'+Date.now()+'.png');photoStatus.textContent=store.getStatus().notice?store.getStatus().notice+' La PNG è stata scaricata.':'Fotografia salvata nell’album e scaricata.';}catch(e){photoStatus.textContent=e.message;}}
 document.addEventListener('fish-language-change',()=>{if([FishI18n.translate('Il mio acquario','en'),'Il mio acquario'].includes(caption.value))caption.value=FishI18n.translate('Il mio acquario');});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&photoMode)exitPhoto();});
 const temperament=node('span',undefined,'view-note');temperament.id='fish-temperament';document.querySelector('.observation-heading').append(temperament);
 let previous=store.getState();temperament.textContent='Temperamento: '+['tranquillo','curioso','vivace'][Math.abs(window.bettaSelected().seed)%3];store.subscribe(()=>{const s=store.getState();for(const event of (s.diary||[]).filter(e=>(e.id||0)>(previous.diary?.at(-1)?.id||0))){const sound={birth:'brood',sale:'sale',discovery:'discovery',contest:'contest',photo:'photo',month:'month'}[event.kind];if(sound)window.FishAudio?.effect(sound);}previous=s;temperament.textContent='Temperamento: '+['tranquillo','curioso','vivace'][Math.abs(window.bettaSelected().seed)%3];updateGuide(s);if(dialog.open)render();});updateGuide(previous);
 window.bettaLife={open,enterPhoto,exitPhoto,getState:()=>({tab,photoMode,paused,tutorialStep:guideStep(store.getState())})};
})();
