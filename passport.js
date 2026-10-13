'use strict';
(()=>{
 const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;},tr=text=>window.FishI18n?.translate(text)||text;
 const dialog=node('dialog');dialog.id='fish-passport';dialog.className='passport-dialog';const header=node('header'),title=node('h2','Passaporto del pesce'),close=node('button','Chiudi');close.type='button';close.onclick=()=>dialog.close();header.append(title,close);const notice=node('p');notice.setAttribute('role','status');const preview=node('img');preview.alt='Passaporto del pesce';preview.hidden=true;const save=node('button','Scarica PNG');save.className='primary';save.type='button';save.disabled=true;dialog.append(header,notice,preview,save);document.body.append(dialog);
 let current=null,data=null,sequence=0;
 const records=s=>new Map([...(s.career?.archive||[]),...(s.fishArchive||[]),...s.fish].map(f=>[f.id,f]));
 function short(ctx,text,max){let result=text;while(ctx.measureText(result).width>max&&result.length)result=result.slice(0,-1);return result===text?result:result.slice(0,-1)+'…';}
 async function build(f,s){
  const image=new Image();image.src=window.betta3d.portrait(f);await image.decode();const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const c=canvas.getContext('2d');c.fillStyle='#0b232b';c.fillRect(0,0,1080,1350);c.strokeStyle='#b89b62';c.lineWidth=3;c.strokeRect(24,24,1032,1302);
  const text=(value,x,y,size=26,color='#e8eee5')=>{c.font=size+'px Arial';c.fillStyle=color;c.fillText(short(c,String(value),940),x,y);};
  text('FISHCHROMIA',60,80,26,'#d9bd83');text(tr('Passaporto del pesce')+' · #'+f.id,60,120,24,'#a5c7bf');text(f.name,60,185,42);text(BettaTypes.name(f)+' · '+BettaTypes.colorName(f),60,225,26,'#d9bd83');
  const gradient=c.createRadialGradient(540,470,40,540,470,520);gradient.addColorStop(0,'#275765');gradient.addColorStop(1,'#0b232b');c.fillStyle=gradient;c.fillRect(50,255,980,520);c.drawImage(image,124,255,832,520);
  text('F'+f.gen+' · '+tr(f.sex==='F'?'Femmina':'Maschio')+' · '+f.age+' '+tr('mesi')+' · Seed '+f.seed,60,805,26);text(tr('Specie')+': '+BettaSpecies.label(f),60,845,24,'#a5c7bf');
  const map=records(s),parents=f.parents||[],grandparents=parents.flatMap(id=>map.get(id)?.parents||[]);const lineage=(ids,y,label)=>{text(tr(label),60,y,25,'#d9bd83');if(!ids.length){text(tr(label==='Genitori'?'Fondatore':'Nessun nonno registrato'),60,y+35,22);return;}ids.forEach((id,i)=>{const ancestor=map.get(id),x=60+(i%2)*490,row=Math.floor(i/2);c.font='20px Arial';c.fillStyle='#e8eee5';c.fillText(short(c,'#'+id+' · '+(ancestor?.name||tr('Dati non disponibili')),455),x,y+35+row*31);});};
  lineage(parents,905,'Genitori');lineage(grandparents,1000,'Nonni');text(tr('Genotipo'),60,1140,25,'#d9bd83');
  const formPairs=Object.entries(f.form).map(([k,v])=>k+': '+v),colorPairs=Object.entries(f.genes).map(([k,v])=>k+': '+v);
  text(tr('Forma')+': '+formPairs.join('   '),60,1178,22);text(tr('Colore')+': '+colorPairs.slice(0,10).join('   '),60,1208,22);text(colorPairs.slice(10).join('   '),60,1238,22);
  text(tr('Genetica del modello di gioco')+' · '+tr('Mese')+' '+s.month,60,1300,19,'#a5c7bf');return canvas.toDataURL('image/png');
 }
 async function open(id=window.bettaApp.store.getState().selected){const token=++sequence,s=window.bettaApp.store.getState(),f=records(s).get(Number(id));current=null;data=null;preview.hidden=true;preview.removeAttribute('src');save.disabled=true;notice.textContent=tr('Creazione del passaporto…');if(!dialog.open)dialog.showModal();try{if(!f?.genes||!f?.form)throw Error(tr('Dati dell’esemplare non disponibili.'));const result=await build(f,s);if(token!==sequence)return;current={fishId:f.id,width:1080,height:1350,parents:[...(f.parents||[])]};data=result;preview.src=result;preview.hidden=false;save.disabled=false;notice.textContent=tr('Immagine pronta da scaricare.');}catch(error){if(token===sequence)notice.textContent=error.message;}}
 save.onclick=()=>{if(!data||!current)return;const link=node('a');link.href=data;link.download='fishchromia-passaporto-'+current.fishId+'.png';link.click();};
 const entry=node('button','Passaporto');entry.className='secondary';entry.id='open-passport';entry.type='button';entry.onclick=()=>open();document.getElementById('export-fish').parentElement.append(entry);
 window.bettaPassport={open,getState:()=>current?{...current,parents:[...current.parents]}:null};
})();
