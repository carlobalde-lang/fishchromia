'use strict';
(()=>{
 const store=window.bettaApp.store,english=()=>window.FishI18n?.language==='en',t=(it,en)=>english()?en:it;
 const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
 const button=(it,en,fn)=>{const b=node('button',it);b.type='button';b.className='secondary';b.onclick=fn;return b;};
 const status=node('p');status.setAttribute('role','status');
 const run=fn=>{try{fn();status.textContent='';}catch(e){status.textContent=window.FishI18n?.translate(e.message)||e.message;window.bettaApp.message(status.textContent);}};
 const favorite=button('','',()=>{const s=store.getState(),f=s.fish.find(f=>f.id===s.selected);run(()=>store.markFish(f.id,'favorite',!f.favorite));});favorite.id='favorite-fish';
 const protect=button('','',()=>{const s=store.getState(),f=s.fish.find(f=>f.id===s.selected);run(()=>store.markFish(f.id,'protected',!f.protected));});protect.id='protect-fish';
 document.getElementById('fish-actions').prepend(favorite,protect);document.getElementById('fish-actions').after(status);
 for(const [value,it] of [['favorite','Preferiti'],['protected','Protetti']]){const o=node('option',it);o.value=value;document.getElementById('fish-filter').append(o);}
 const dialog=node('dialog');dialog.id='selection-dialog';dialog.className='selection-dialog';dialog.setAttribute('aria-labelledby','selection-title');document.body.append(dialog);
 let tab='projects',reference=null,projectId=null,limit=12;
 function open(which){tab=which;reference=store.getState().selected;limit=12;render();if(!dialog.open)dialog.showModal();}
 for(const host of [document.querySelector('.room-tools-content'),document.querySelector('.breeding')])host.append(button('Progetti di selezione','Breeding projects',()=>open('projects')));
 const compare=button('Confronta partner','Compare partners',()=>open('partners'));compare.id='compare-partners';document.getElementById('fish-actions').append(compare);
 function select(label,choices,value){const wrap=node('label',label),s=node('select');for(const [id,text] of choices){const o=node('option',text);o.value=id;s.append(o);}s.value=value??choices[0][0];wrap.append(s);return {wrap,input:s};}
 function render(){
  const state=store.getState(),projects=state.selectionProjects||[];dialog.replaceChildren();
  const h=node('h2',t('Selezione e incroci','Selection and breeding'));h.id='selection-title';dialog.append(h,button('Chiudi','Close',()=>dialog.close()));
  const nav=node('nav');nav.append(button('Progetti','Projects',()=>{tab='projects';render();}),button('Partner','Partners',()=>{tab='partners';render();}));dialog.append(nav);
  if(tab==='projects'){
   const form=node('form');form.id='selection-project-form';const label=node('label',t('Nome del progetto','Project name')),name=node('input');name.required=true;name.maxLength=80;name.id='selection-project-name';label.append(name);
   const color=select(t('Livrea obiettivo','Target coat'),BettaTypes.colors.map(c=>[c.id,c.name])),trait=select(t('Pinne obiettivo','Target fins'),[['all',t('Qualsiasi','Any')],...BettaTypes.traitChoices.map(c=>[c.id,c.name])]);color.input.id='selection-project-color';trait.input.id='selection-project-trait';
   const submit=node('button',t('Crea progetto','Create project'));submit.type='submit';submit.className='primary';form.append(label,color.wrap,trait.wrap,submit);form.onsubmit=e=>{e.preventDefault();run(()=>{projectId=store.saveProject({name:name.value,color:color.input.value,trait:trait.input.value});});};dialog.append(form);
   if(!projects.length)dialog.append(node('p',t('Scegli una livrea e un tratto delle pinne da ottenere nei pesci nati qui.','Choose a coat and fin trait to obtain in fish born here.')));
   for(const p of projects){const card=node('article');card.className='selection-card';card.dataset.projectId=p.id;const progress=BettaSelection.progress(state,p);card.append(node('h3',p.name),node('p',BettaCareer.byId(p.color).name+' · '+(BettaTypes.traitChoices.find(c=>c.id===p.trait)?.name||t('Qualsiasi pinna','Any fins'))));
    const meter=node('progress');meter.max=3;meter.value=Number(progress.color>0)+Number(progress.trait>0)+Number(progress.achieved.length>0);meter.setAttribute('aria-label',p.name);card.append(meter);
    card.append(node('p',t('Livrea: ','Coat: ')+progress.color+' · '+t('Pinne: ','Fins: ')+progress.trait+' · '+t('Obiettivo raggiunto: ','Goal achieved: ')+progress.achieved.length));
    card.append(node('small',t('Conteggi sui pesci nati qui. I risultati raggiunti restano registrati anche dopo la vendita.','Counts cover fish born here. Achievements remain recorded after sale.')));
    if(!progress.color)card.append(node('p',t('Manca ancora la livrea richiesta.','The target coat is still missing.')));if(!progress.trait)card.append(node('p',t('Manca ancora il tratto delle pinne.','The target fin trait is still missing.')));if(progress.color&&progress.trait&&!progress.matches.length)card.append(node('p',t('Combina i due caratteri nello stesso esemplare.','Combine both traits in one fish.')));
    for(const f of progress.matches.slice(0,6))card.append(button(f.name,f.name,()=>{dialog.close();window.bettaApp.observeFish(f.id);}));
    card.append(button('Confronta partner','Compare partners',()=>{projectId=p.id;tab='partners';limit=12;render();}),button('Elimina progetto','Delete project',()=>run(()=>store.deleteProject(p.id))));dialog.append(card);
   }
  }else{
   const fish=select(t('Esemplare di partenza','Starting fish'),state.fish.map(f=>[String(f.id),f.name+' · #'+f.id]),String(reference));fish.input.id='partner-reference';fish.input.onchange=()=>{reference=Number(fish.input.value);limit=12;render();};dialog.append(fish.wrap);
   const project=select(t('Obiettivo','Goal'),[['',t('Solo confronto genetico','Genetic comparison only')],...projects.map(p=>[String(p.id),p.name])],projects.some(p=>p.id===projectId)?String(projectId):'');project.input.id='partner-project';project.input.onchange=()=>{projectId=Number(project.input.value)||null;limit=12;render();};dialog.append(project.wrap);
   const a=state.fish.find(f=>f.id===Number(fish.input.value)),goal=projects.find(p=>p.id===projectId),rows=BettaSelection.partners(state,a?.id,goal);
   dialog.append(node('p',t('Probabilità della simulazione per ogni piccolo e per almeno uno dei quattro. Non sono previsioni biologiche reali.','Simulation probabilities for each fry and at least one of four. These are not real biological predictions.')));
   if(!rows.length)dialog.append(node('p',t('Non ci sono partner di sesso opposto.','There are no opposite-sex partners.')));
   for(const row of rows.slice(0,limit)){const b=row.fish,card=node('article');card.className='selection-card';card.dataset.partnerId=b.id;card.append(node('h3',b.name+' · #'+b.id),node('p',BettaTypes.name(b)+' · '+BettaTypes.colorName(b)),node('p',row.ready?t('Pronto per l’incrocio','Ready to breed'):row.reason),node('p',row.relationship));
    if(goal)card.append(node('strong',t('Obiettivo per piccolo: ','Goal per fry: ')+(row.probability*100).toFixed(2)+'% · '+t('Almeno uno su quattro: ','At least one of four: ')+(row.brood*100).toFixed(2)+'%'));
    const details=node('details');details.append(node('summary',t('Previsioni delle pinne','Fin predictions')));for(const [label,p] of row.forecast)details.append(node('p',label+': '+p+'%'));card.append(details);
    const choose=button('Scegli questa coppia','Choose this pair',()=>run(()=>{const s=store.getState();if(!BettaStore.pairingStatus(s,a,b).allowed)throw Error('Coppia non disponibile.');store.choosePair(a.sex==='F'?a.id:b.id,a.sex==='M'?a.id:b.id);dialog.close();window.betta3d?.openLaboratory();document.getElementById('breeding-panel').scrollIntoView({block:'start'});}));choose.disabled=!row.ready;card.append(choose);dialog.append(card);
   }
   if(rows.length>limit)dialog.append(button('Mostra altri partner','Show more partners',()=>{limit+=12;render();}));
  }
  dialog.append(status);
 }
 function sync(){const s=store.getState(),f=s.fish.find(f=>f.id===s.selected)||s.fish[0];favorite.textContent=f.favorite?t('★ Preferito','★ Favorite'):t('☆ Aggiungi ai preferiti','☆ Add to favorites');favorite.setAttribute('aria-pressed',String(!!f.favorite));protect.textContent=f.protected?t('🔒 Sblocca riproduttore','🔒 Unlock breeder'):t('Proteggi riproduttore','Protect breeder');protect.setAttribute('aria-pressed',String(!!f.protected));if(dialog.open)render();}
 store.subscribe(sync);document.addEventListener('fish-language-change',sync);sync();window.bettaSelectionUI={open};
})();
