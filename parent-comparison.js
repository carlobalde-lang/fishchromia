'use strict';
(()=>{
 const store=window.bettaApp.store,tr=text=>window.FishI18n?.translate(String(text))||String(text);
 const node=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
 const button=node('button','Confronta genitori','secondary');button.id='compare-parents';button.type='button';
 document.querySelector('.parent-slots').before(button);
 const stickyButton=node('button','Confronta genitori','secondary');stickyButton.id='sticky-compare-parents';stickyButton.type='button';stickyButton.onclick=()=>button.click();
 document.querySelector('.sticky-breed-actions').prepend(stickyButton);
 const dialog=node('dialog',undefined,'parent-comparison');dialog.id='parent-comparison';dialog.setAttribute('aria-labelledby','parent-comparison-title');
 const header=node('header'),title=node('h2','Confronto tra genitori');title.id='parent-comparison-title';
 const close=node('button','Chiudi','secondary');close.type='button';close.onclick=()=>dialog.close();header.append(title,close);
 const intro=node('p','Le differenze sono evidenziate. Gli alleli descrivono il modello del gioco.','view-note');
 const content=node('div'),status=node('p',undefined,'comparison-status');status.setAttribute('role','status');
 dialog.append(header,intro,content,status);document.body.append(dialog);
 const pair=s=>[s.fish.find(f=>f.id===s.mother),s.fish.find(f=>f.id===s.father)];
 const list=items=>items.length?items.join(' · '):'Nessuno';
 function table(fish,rows,caption){
  const table=node('table',undefined,'comparison-table');table.append(node('caption',caption));
  const head=node('thead'),headRow=node('tr');
  for(const text of ['Dato','Femmina','Maschio']){const cell=node('th',text);cell.scope='col';headRow.append(cell);}head.append(headRow);table.append(head);
  const body=node('tbody');
  for(const [label,get] of rows){const values=fish.map(get),row=node('tr');row.classList.toggle('comparison-different',values[0]!==values[1]);const name=node('th',label);name.scope='row';row.append(name,...values.map(value=>node('td',value)));body.append(row);}
  table.append(body);return table;
 }
 function render(){
  const s=store.getState(),fish=pair(s);button.disabled=fish.some(f=>!f);
  button.title=button.disabled?'Seleziona entrambi i genitori per confrontarli.':'Confronto tra genitori';
  stickyButton.disabled=button.disabled;stickyButton.title=button.title;
  if(!dialog.open)return;
  const expanded=content.querySelector('.comparison-genotypes')?.open||false;
  content.replaceChildren();
  if(fish.some(f=>!f)){content.append(node('p','Seleziona entrambi i genitori per confrontarli.'));status.textContent='';window.FishI18n?.refresh();return;}
  const previews=node('div',undefined,'comparison-previews');
  fish.forEach((f,i)=>{
   const card=node('section',undefined,'comparison-parent');card.dataset.fishId=f.id;
   const role=node('span',i===0?'Femmina':'Maschio','eyebrow'),image=node('img',undefined,'comparison-preview');
   const name=node('h3',(s.mode==='career'?BettaCareer.displayName(f):f.name)+' · #'+f.id);
   card.append(role,image,name);previews.append(card);window.bettaApp.drawPreview(image,f);
  });
  content.append(previews,table(fish,[
   ['Specie',f=>BettaSpecies.label(f)],
   ['Età',f=>f.age+' '+tr('mesi')],
   ['Generazione',f=>'F'+f.gen],
   ['Forma',f=>BettaTypes.name(f)],
   ['Livrea',f=>BettaTypes.colorName(f)||BettaSpecies.description(f)],
   ['Tratti visibili',f=>list(BettaTypes.traitChoices.filter(c=>BettaTypes.matchesTrait(f,c.id)).map(c=>c.name))],
   ['Portatori e alleli',f=>BettaSpecies.coatEnabled(f)?list(BettaTypes.carrierChoices.filter(c=>BettaTypes.matchesCarrier(f,c.id)).map(c=>c.name)):'Non disponibile'],
   ['Stato riproduttivo',f=>{const ready=BettaStore.parentStatus(s,f);return ready.allowed?'Pronto per l’incrocio':ready.reason;}]
  ],'Dati dei genitori'));
  const details=node('details',undefined,'comparison-genotypes');details.open=expanded;details.append(node('summary','Confronta gli alleli'));
  for(const [key,label] of [['form','Genotipo delle pinne'],['genes','Genotipo del colore']]){
   const loci=[...new Set(fish.flatMap(f=>Object.keys(f[key]||{})))];
   details.append(table(fish,loci.map(locus=>[locus,f=>f[key]?.[locus]||'—']),label));
  }
  content.append(details);status.replaceChildren(node('span',store.breedingStatus().reason),node('small',BettaStore.relationship(...fish)));
  window.FishI18n?.refresh();
 }
 button.onclick=()=>{if(button.disabled)return;dialog.showModal();render();dialog.scrollTop=0;};
 store.subscribe(render);document.addEventListener('fish-language-change',render);render();
 window.bettaParentComparison={open:()=>button.click()};
})();
