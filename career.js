'use strict';
window.BettaCareer=(()=>{
 const regulars=[
  {id:'ada',name:'Ada',taste:'royal',description:'Ama le livree blu e gli allevamenti con una storia.'},
  {id:'luca',name:'Luca',taste:'red',description:'Cerca colori rossi intensi.'},
  {id:'nora',name:'Nora',taste:'turquoise',description:'Colleziona sfumature turchesi.'},
  {id:'milo',name:'Milo',taste:'black',description:'Preferisce i colori scuri.'},
  {id:'emma',name:'Emma',taste:'any',description:'Apprezza le generazioni nate nel tuo allevamento.'},
  {id:'leo',name:'Leo',taste:'any',description:'Ha gusti diversi e segue le nuove scoperte.'}
 ];
 const starters=['royal','red','black','turquoise'];
 const colors=()=>BettaTypes.colors;
 const byId=id=>colors().find(c=>c.id===id);
 const clone=x=>JSON.parse(JSON.stringify(x));
 const signature=fish=>{
  const p=BettaAppearance.params(fish);
  // Visible phenotype: recessive carriers and hidden blue alleles are not separate coats.
  const keys=['alien','white','orange','purple','gold','speckle','samurai','rim','bicolor','green','dragon','yellow','marble','butterfly','black','red','copper'];
  const values=keys.map(k=>p[k]>0?1:0);
  const blueMasked=Math.max(p.red,p.black,p.white,p.orange,p.gold,p.copper)>=.9;
  values.push(blueMasked?'hidden':p.blue,p.iridescence>=.7?1:0);
  return values.join(':');
 };
 let reference;
 function matches(fish){
  if(!BettaSpecies.ornamental(fish))return [];
  if(!reference)reference=colors().map(c=>({id:c.id,key:signature(BettaTypes.specimen('halfmoon',c.id,'M'))}));
  const key=signature(fish);return reference.filter(c=>c.key===key).map(c=>c.id);
 }
 function displayName(fish){
  return fish.name;
 }
 function coatName(fish){return matches(fish).map(id=>byId(id).name).join(' / ')||BettaTypes.colorName(fish)||'Combinazione ereditata';}
 function rarity(fish){return 1+['M','F','C','O','T','N','P','J','Q','U','Z','X','G','V'].filter(k=>fish.genes[k]?.includes(k)).length;}
 function demand(month){return colors()[(month*7)%colors().length].id;}
 function value(fish,month=1){return Math.round((38+rarity(fish)*17+Math.min(fish.gen,6)*5+(fish.form.E==='ee'?15:0))*(matches(fish).includes(demand(month))?1.25:1));}
 function chance(price,max){return price>max?.1:price<=max*.7?.9:.9-(price/max-.7)/.3*.5;}
 function offers(state){
  const owned=new Set(state.fish.map(signature)),seen=new Set();
  return colors().filter(color=>{
   const key=signature(BettaTypes.specimen('halfmoon',color.id,'M'));
   if(owned.has(key)||seen.has(key))return false;seen.add(key);return true;
  }).map(color=>({id:'stock-'+state.month+'-'+color.id,colorId:color.id,price:starters.includes(color.id)?65:160+Object.keys(color.genes).length*25}));
 }
 function makeOrders(month,discoveries,relationships={},reputation=0){
  const pool=Object.keys(discoveries);return Array.from({length:3},(_,i)=>{
   const colorId=pool[(month+i)%pool.length]||'royal';
   return {id:'order-'+month+'-'+i,colorId,customerId:regulars[(month+i)%regulars.length].id,reward:150+i*35+Math.min(200,reputation*2+(relationships[regulars[(month+i)%regulars.length].id]?.purchases||0)*20),deadline:month+6,status:'available'};
  });
 }
 function initial(){const discoveries=Object.fromEntries(starters.map(id=>[id,{month:1,fishId:null,parents:null,starter:true}]));return {version:1,regulars:{},contestEntries:[],trophies:[],cash:600,reputation:0,capacity:40,shopSlots:4,expansions:0,discoveries,listings:[],visits:[],archive:[],orders:makeOrders(1,discoveries),nextCustomer:1,customerRemaining:20};}
 function normalize(source,fish,month){
  if(!source||source.version!==1)throw Error('Dati carriera mancanti o non supportati.');
  const c=clone(source),integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
  c.customerRemaining??=20;
  if(!Number.isFinite(c.customerRemaining)||c.customerRemaining<0||c.customerRemaining>60)throw Error('Attesa clienti non valida.');
  for(const [k,min,max] of [['cash',0,1000000000],['reputation',0,1000000],['capacity',40,3000],['shopSlots',4,24],['expansions',0,124],['nextCustomer',1,1000000000]])if(!integer(c[k],min,max))throw Error('Valore carriera non valido: '+k);
  if(!c.discoveries||Array.isArray(c.discoveries)||typeof c.discoveries!=='object')throw Error('Album non valido.');
  for(const [id,d] of Object.entries(c.discoveries))if(!byId(id)||!d||!integer(d.month,1,month)||!(d.fishId===null||integer(d.fishId,1,1000000000))||!(d.parents===null||Array.isArray(d.parents)&&d.parents.length===2&&d.parents.every(p=>integer(p,1,1000000000))))throw Error('Scoperta non valida.');
  if(!starters.every(id=>c.discoveries[id]))throw Error('Album iniziale incompleto.');
  if(!Array.isArray(c.listings)||c.listings.length>c.shopSlots*4)throw Error('Vetrine non valide.');
  const occupancy=new Map();const seen=new Set();for(const l of c.listings){if(!l||seen.has(l.fishId)||!fish.some(f=>f.id===l.fishId&&f.age>=4)||!integer(l.price,1,1000000)||!integer(l.listedMonth,1,month))throw Error('Annuncio non valido.');seen.add(l.fishId);l.tank??=Math.floor((seen.size-1)/4);if(!integer(l.tank,0,c.shopSlots-1))throw Error('Vetrina non valida.');occupancy.set(l.tank,(occupancy.get(l.tank)||0)+1);if(occupancy.get(l.tank)>4)throw Error('Massimo 4 pesci per vetrina.');}
  if(!Array.isArray(c.orders)||c.orders.length>12||new Set(c.orders.map(o=>o.id)).size!==c.orders.length)throw Error('Ordini non validi.');
  for(const o of c.orders)if(!o||typeof o.id!=='string'||o.id.length>60||!byId(o.colorId)||!integer(o.reward,1,100000)||!integer(o.deadline,1,month+12)||!['available','accepted','completed','expired'].includes(o.status))throw Error('Ordine non valido.');
  if(!Array.isArray(c.visits)||c.visits.length>24||!Array.isArray(c.archive)||c.archive.length>3000)throw Error('Storico negozio non valido.');
  for(const v of c.visits)if(!v||typeof v.name!=='string'||typeof v.message!=='string'||v.name.length>80||v.message.length>300)throw Error('Visita non valida.');
  for(const a of c.archive)if(!a||!integer(a.id,1,1000000000)||typeof a.name!=='string'||a.name.length>120||!integer(a.month,1,month))throw Error('Archivio non valido.');
  c.regulars??={};c.contestEntries??=[];c.trophies??=[];
  if(!c.regulars||typeof c.regulars!=='object'||Array.isArray(c.regulars)||Object.keys(c.regulars).some(id=>!regulars.some(r=>r.id===id)))throw Error('Clienti non validi.');
  for(const v of Object.values(c.regulars))if(!v||!integer(v.visits,0,1000000)||!integer(v.purchases,0,v.visits))throw Error('Cliente non valido.');
  if(!Array.isArray(c.contestEntries)||c.contestEntries.length>120||!Array.isArray(c.trophies)||c.trophies.length>120)throw Error('Concorsi non validi.');
  for(const e of [...c.contestEntries,...c.trophies])if(!e||!integer(e.month,1,month)||!integer(e.fishId,1,1000000000)||typeof e.fishName!=='string'||e.fishName.length>120||typeof e.title!=='string'||e.title.length>120||!integer(e.score,0,100)||!['oro','argento','bronzo','partecipazione'].includes(e.medal))throw Error('Risultato concorso non valido.');
  if(new Set(c.contestEntries.map(e=>e.month)).size!==c.contestEntries.length||new Set(c.trophies.map(e=>e.month)).size!==c.trophies.length)throw Error('Concorso duplicato.');
  return c;
 }
 function contest(state){
  const pool=Object.keys(state.career.discoveries),colorId=pool[(state.month*3)%pool.length]||'royal',short=state.month%4===0,coat=state.month%2===1;
  return {id:'contest-'+state.month,title:coat?'Festival '+byId(colorId).name:short?'Concorso Plakat':'Concorso Halfmoon',colorId,short,coat};
 }
 function contestScore(state,fish){
  const theme=contest(state),t=BettaTypes.traits(fish),fit=theme.coat?matches(fish).includes(theme.colorId):theme.short?t.short:!t.short&&t.spread>=3;
  return Math.min(100,(fit?50:0)+Math.min(20,fish.gen*5)+Math.min(10,fish.age*2)+10+Math.abs(fish.seed%11));
 }
 function discover(state,batch){
  for(const fish of batch)for(const id of matches(fish))if(!state.career.discoveries[id]){
   state.career.discoveries[id]={month:state.month,fishId:fish.id,parents:fish.parents};state.career.cash+=100;state.career.reputation+=2;
   state.log.unshift('Nuova livrea: '+byId(id).name+' · +100 monete.');
  }
  state.log=state.log.slice(0,5);
 }
 function removable(state,fish){return fish&&state.fish.length>2&&state.fish.some(f=>f.id!==fish.id&&f.sex===fish.sex&&f.age>=2&&!state.career.listings.some(l=>l.fishId===f.id));}
 function remove(state,fish,reason){
  state.career.archive.push({id:fish.id,name:fish.name,month:state.month,parents:fish.parents,reason});state.career.archive=state.career.archive.slice(-3000);
  state.fish=state.fish.filter(f=>f.id!==fish.id);state.career.listings=state.career.listings.filter(l=>l.fishId!==fish.id);
  if(state.selected===fish.id)state.selected=state.fish[0].id;
  if(state.mother===fish.id)state.mother=null;if(state.father===fish.id)state.father=null;
 }
 function transact(state,action,data={}){
  if(state.mode!=='career')throw Error('Questa azione è disponibile in carriera.');
  const c=state.career,fish=state.fish.find(f=>f.id===Number(data.fishId));
  function spend(n){if(c.cash<n)throw Error('Monete insufficienti.');c.cash-=n;}
  if(['list','deliver'].includes(action)&&state.tankAssignments?.[fish?.id]==='community')throw Error('Sposta il pesce dall’acquario zero prima di venderlo.');
  if(action==='list'){
   if(!fish||fish.age<4)throw Error('Puoi vendere esemplari adulti da 4 mesi.');
   if(!removable(state,fish))throw Error('Conserva almeno un riproduttore per sesso fuori dal negozio.');
   if(state.fish.some(f=>f.age===0&&f.parents?.includes(fish.id)))throw Error('Attendi il prossimo mese: questo genitore ha appena avuto una nidiata.');
   if(!Number.isSafeInteger(data.price)||data.price<1||data.price>1000000)throw Error('Inserisci un prezzo intero fra 1 e 1.000.000.');
   const listing=c.listings.find(l=>l.fishId===fish.id);
   if(!listing&&c.listings.length>=c.shopSlots*4)throw Error('Vetrine piene: ritira un pesce o amplia il negozio.');
   if(listing)listing.price=data.price;else {let tank=0;while(c.listings.filter(l=>l.tank===tank).length>=4)tank++;c.listings.push({fishId:fish.id,price:data.price,listedMonth:state.month,tank});}
   if(state.mother===fish.id)state.mother=null;if(state.father===fish.id)state.father=null;
  }else if(action==='withdraw'){c.listings=c.listings.filter(l=>l.fishId!==Number(data.fishId));
  }else if(action==='buy'){
   const offer=offers(state).find(o=>o.id===data.offerId);if(!offer||!['F','M'].includes(data.sex))throw Error('Offerta non valida.');
   if(state.fish.length>=c.capacity)throw Error('Allevamento pieno: amplia o vendi alcuni pesci.');spend(offer.price);
   const f=BettaTypes.normalize(BettaTypes.specimen('halfmoon',offer.colorId,data.sex));f.id=state.nextFishId++;f.name=(BettaTypes.name(f)||'Betta')+' '+(f.sex==='F'?'femmina':'maschio')+' '+f.id;state.fish.unshift(f);state.selected=f.id;
   state.log.unshift('Acquistato '+f.name+' · '+offer.price+' monete.');
  }else if(action==='accept'){
   const o=c.orders.find(o=>o.id===data.orderId&&o.status==='available'&&o.deadline>=state.month);if(!o)throw Error('Ordine non disponibile.');
   if(c.orders.filter(o=>o.status==='accepted').length>=2)throw Error('Puoi accettare due ordini alla volta.');o.status='accepted';
  }else if(action==='deliver'){
   const o=c.orders.find(o=>o.id===data.orderId&&o.status==='accepted'&&o.deadline>=state.month);
   if(!o||!fish||fish.age<4||fish.gen<1||!matches(fish).includes(o.colorId)||!removable(state,fish))throw Error('Serve un adulto nato qui con la livrea richiesta, conservando i riproduttori.');
   if(c.listings.some(l=>l.fishId===fish.id)||state.fish.some(f=>f.age===0&&f.parents?.includes(fish.id)))throw Error('Ritira il pesce dalla vendita e attendi eventuale riposo mensile.');
   remove(state,fish,'ordine');o.status='completed';c.cash+=o.reward;c.reputation+=3;state.log.unshift('Ordine consegnato · +'+o.reward+' monete.');
  }else if(action==='contest'){
   c.contestEntries??=[];c.trophies??=[];
   if(c.contestEntries.some(e=>e.month===state.month))throw Error('Hai già partecipato al concorso di questo mese.');
   if(!fish||fish.age<4||fish.gen<1||c.listings.some(l=>l.fishId===fish.id))throw Error('Iscrivi un adulto nato qui e non in vendita.');
   const score=contestScore(state,fish),medal=score>=80?'oro':score>=65?'argento':score>=50?'bronzo':'partecipazione',reward={oro:220,argento:140,bronzo:80,partecipazione:0}[medal];
   const result={month:state.month,fishId:fish.id,fishName:fish.name,title:contest(state).title,score,medal};c.contestEntries.push(result);c.contestEntries=c.contestEntries.slice(-120);
   if(reward){c.trophies.push(result);c.trophies=c.trophies.slice(-120);c.cash+=reward;c.reputation+=medal==='oro'?3:medal==='argento'?2:1;}
   state.log.unshift(result.title+': '+score+' punti · '+medal+' · +'+reward+' monete.');
  }else if(action==='expand'){
   if(c.capacity>=3000)throw Error('Capienza massima raggiunta.');spend(250+c.expansions*150);c.expansions++;c.capacity=Math.min(3000,c.capacity+24);
  }else if(action==='shopExpand'){
   if(c.shopSlots>=24)throw Error('Negozio già completo.');spend(c.shopSlots*60);c.shopSlots+=4;
  }else throw Error('Azione sconosciuta.');
  state.log=state.log.slice(0,5);return state;
 }
 function advance(state){
  const c=state.career;for(const o of c.orders)if(o.deadline<state.month&&['available','accepted'].includes(o.status))o.status='expired';
  if(state.month%3===1){c.orders=[...c.orders.filter(o=>o.status==='accepted'),...makeOrders(state.month,c.discoveries,c.regulars,c.reputation)];}
  return state;
 }
 function customer(state,rng=Math.random){
   const c=state.career;
   const number=c.nextCustomer++,profile=regulars[(number-1)%regulars.length];c.regulars??={};const relationship=c.regulars[profile.id]??={visits:0,purchases:0};relationship.visits++;
   const wanted=rng()<.35?'any':profile.taste==='any'?Object.keys(c.discoveries)[Math.floor(rng()*Object.keys(c.discoveries).length)]:profile.taste,budget=80+Math.floor(rng()*360)+c.reputation*3+Math.min(100,relationship.purchases*10);
   const candidates=c.listings.map(l=>({l,f:state.fish.find(f=>f.id===l.fishId)})).filter(x=>x.f&&(wanted==='any'||matches(x.f).includes(wanted)));
   const visit={id:number,customerId:profile.id,name:profile.name,returning:relationship.visits>1,month:state.month,wanted,budget,message:'Nessun pesce corrisponde ai miei gusti.',bought:false};
   if(candidates.length){
    const {l,f}=candidates[Math.floor(rng()*candidates.length)],max=value(f,state.month);visit.fishId=f.id;visit.price=l.price;visit.max=max;
    if(l.price>budget)visit.message='Mi piace, ma supera il mio budget.';
    else if(removable(state,f)&&rng()<chance(l.price,max)){c.cash+=l.price;c.reputation++;remove(state,f,'vendita');visit.bought=true;relationship.purchases++;visit.message='Acquistato '+f.name+' per '+l.price+' monete.';state.log.unshift(visit.name+': '+visit.message);}
    else visit.message=l.price>max?'Prezzo alto: questa volta non acquisto.':'Oggi preferisco pensarci.';
   }
   c.visits=[visit,...c.visits].slice(0,24);
   c.customerRemaining=(15+rng()*25)/Math.min(2,1+c.reputation/100);
   state.log=state.log.slice(0,5);return state;
 }
 return {regulars,contest,contestScore,starters,initial,normalize,matches,displayName,coatName,signature,value,chance,offers,byId,demand,transact,discover,advance,customer};
})();
