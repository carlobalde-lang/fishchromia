'use strict';
(()=>{
 const store=window.bettaApp.store,tr=text=>window.FishI18n?.translate(text)||text;
 const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 const button=(text,run,id)=>{const b=node('button',text,'secondary');b.type='button';b.onclick=run;if(id)b.id=id;return b;};
 const dialog=node('dialog',undefined,'personal-album-dialog');dialog.id='personal-album';dialog.setAttribute('aria-labelledby','personal-album-title');
 const header=node('header'),title=node('h2','Livree personali');title.id='personal-album-title';header.append(title,button('Chiudi',()=>dialog.close()));
 const notice=node('p'),body=node('div');notice.setAttribute('role','status');dialog.append(header,notice,body);document.body.append(dialog);
 let draft=null,busy=false,token=0,lastKey='';
 const records=s=>new Map([...(s.career?.archive||[]),...(s.fishArchive||[]),...s.fish].filter(f=>f.genes&&f.form).map(f=>[f.id,f]));
 const born=s=>[...records(s).values()].filter(f=>f.parents&&f.gen>0).sort((a,b)=>b.id-a.id);
 function attempt(fn){try{fn();notice.textContent='';}catch(e){notice.textContent=tr(e.message);}}
 function render(){
  const s=store.getState(),entries=s.personalCoats||[];lastKey=JSON.stringify([entries,s.fish.map(f=>f.id)]);body.replaceChildren();
  body.append(node('p','Conserva le livree nate nel tuo allevamento, anche quelle senza un nome nell’album ufficiale. Foto e genealogia restano disponibili dopo la vendita o la rimozione del pesce.'));
  body.append(node('small',entries.length+' / 48'));
  if(draft!==null){
   const fish=records(s).get(draft),form=node('form',undefined,'personal-coat-form'),label=node('label','Scegli il pesce'),select=node('select');select.id='personal-coat-fish';label.htmlFor=select.id;
   for(const f of born(s)){const option=node('option','#'+f.id+' · '+f.name);option.value=f.id;select.append(option);}select.value=draft;select.disabled=busy;select.onchange=()=>{draft=Number(select.value);token++;notice.textContent='';render();};label.append(select);
   const nameLabel=node('label','Nome della livrea'),name=node('input');name.id='personal-coat-name';nameLabel.htmlFor=name.id;name.maxLength=80;name.required=true;name.value=entries.find(p=>p.fish.id===draft)?.name||fish?.name||'';name.disabled=busy;nameLabel.append(name);
   const image=node('img');image.width=320;image.height=200;image.alt=tr('Anteprima della livrea');if(fish)window.betta3d?.thumbnail(image,fish);
   const save=node('button',entries.some(p=>p.fish.id===draft)?'Aggiorna ricordo':'Conserva livrea','primary');save.id='personal-coat-save';save.type='submit';save.disabled=busy||!fish;
   form.append(label,image,nameLabel,save,button('Annulla',()=>{token++;draft=null;busy=false;render();}));
   form.onsubmit=async event=>{
    event.preventDefault();if(busy||!name.reportValidity())return;const selected=draft,caption=name.value,sequence=++token;busy=true;save.disabled=true;select.disabled=true;name.disabled=true;notice.textContent=tr('Preparazione della foto…');
    try{
     await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));if(sequence!==token||!dialog.open)return;
     const image=new Image();image.src=window.betta3d.portrait(fish);await image.decode();if(sequence!==token||!dialog.open)return;
     const canvas=document.createElement('canvas');canvas.width=320;canvas.height=200;const ctx=canvas.getContext('2d');ctx.fillStyle='#102831';ctx.fillRect(0,0,320,200);ctx.drawImage(image,0,0,320,200);
     const photo=canvas.toDataURL('image/jpeg',.82);store.savePersonalCoat(selected,caption,photo);draft=null;notice.textContent=tr('Livrea conservata nell’album personale.');render();
    }catch(error){notice.textContent=tr(error.message);}finally{if(sequence===token){busy=false;save.disabled=false;select.disabled=false;name.disabled=false;}}
   };
   body.append(form);return;
  }
  const add=button('Aggiungi una livrea',()=>{const fish=born(store.getState());if(!fish.length)return;draft=fish.some(f=>f.id===s.selected)?s.selected:fish[0].id;render();},'personal-coat-add');add.disabled=!born(s).length||entries.length>=48;body.append(add);
  if(!entries.length)body.append(node('p','L’album personale è vuoto. Fai nascere una nidiata, poi scegli un piccolo da ricordare.'));
  const grid=node('div',undefined,'personal-coat-grid');
  for(const entry of [...entries].reverse()){
   const card=node('article',undefined,'personal-coat-card');card.dataset.personalCoat=entry.id;
   const image=node('img');image.src=entry.photo;image.alt=entry.name;image.setAttribute('translate','no');image.width=320;image.height=200;image.loading='lazy';
   const heading=node('h3',entry.name);heading.setAttribute('translate','no');card.append(heading,image,node('p','#'+entry.fish.id+' · F'+entry.fish.gen+' · '+tr('Mese')+' '+entry.month));
   const official=window.BettaCareer.matches(entry.fish).map(id=>tr(BettaCareer.byId(id).name));card.append(node('small',official.length?official.join(' / '):tr('Combinazione personale')));
   const rename=node('form',undefined,'personal-coat-rename'),input=node('input'),label=node('label','Nome della livrea');input.id='personal-coat-name-'+entry.id;label.htmlFor=input.id;input.value=entry.name;input.maxLength=80;input.required=true;label.append(input);const submit=node('button','Salva nome','secondary');submit.type='submit';rename.append(label,submit);rename.onsubmit=e=>{e.preventDefault();attempt(()=>store.renamePersonalCoat(entry.id,input.value));};card.append(rename);
   const details=node('details'),summary=node('summary','Genealogia e geni'),family=new Map(entry.ancestors.map(f=>[f.id,f]));details.append(summary);
   for(const [text,ids] of [['Genitori',entry.fish.parents],['Nonni',[...new Set(entry.fish.parents.flatMap(id=>family.get(id)?.parents||[]))]]]){
    details.append(node('h4',text));for(const id of ids)details.append(node('p','#'+id+' · '+(family.get(id)?.name||tr('Dati non disponibili'))));if(!ids.length)details.append(node('p','Dati non disponibili'));
   }
   details.append(node('h4','Genotipo'),node('p',Object.entries(entry.fish.genes).map(([k,v])=>k+': '+v).join(' · ')));card.append(details);
   const download=node('a','Scarica foto','secondary');download.href=entry.photo;download.download='fishchromia-livrea-'+entry.fish.id+'.jpg';card.append(download);
   if(s.fish.some(f=>f.id===entry.fish.id))card.append(button('Osserva',()=>{dialog.close();window.bettaApp.observeFish(entry.fish.id);}));
   card.append(button('Rimuovi dall’album',()=>attempt(()=>store.deletePersonalCoat(entry.id))));grid.append(card);
  }
  body.append(grid);
 }
 function open(fishId=null){token++;busy=false;draft=null;notice.textContent='';if(fishId!==null){const fish=records(store.getState()).get(fishId);if(fish?.parents&&fish.gen>0)draft=fishId;else notice.textContent=tr('Scegli un pesce nato nel tuo allevamento.');}render();if(!dialog.open)dialog.showModal();}
 dialog.addEventListener('close',()=>{token++;draft=null;busy=false;});
 store.subscribe(()=>{if(dialog.open&&draft===null&&lastKey!==JSON.stringify([store.getState().personalCoats||[],store.getState().fish.map(f=>f.id)]))render();});
 document.addEventListener('fish-language-change',()=>{if(dialog.open&&!busy)render();});
 document.getElementById('fish-actions').insertBefore(button('Conserva livrea',()=>open(store.getState().selected),'save-personal-coat'),document.getElementById('fish-more-actions'));
 document.querySelector('.room-tools-content').append(button('Livree personali',()=>open(),'open-personal-album'));
 window.BettaPersonalAlbum={open};
})();
