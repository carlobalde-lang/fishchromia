'use strict';
window.BettaBreedingGuide=(()=>{
 const maskLoci=new Set(['K','R','T','N','J','C']);
 const targetCache=new Map();
 function target(id){if(!targetCache.has(id)){if(!BettaCareer.byId(id))throw Error('Livrea non valida.');targetCache.set(id,BettaTypes.specimen('halfmoon',id,'M'));}return targetCache.get(id);}
 function outcomes(a,b){const list=[];for(const x of a)for(const y of b)list.push([x,y].sort().join(''));return list;}
 // Exact probability of the album's visible phenotype, including hidden blue.
 function probability(m,d,id){
  if(!BettaSpecies.ornamental(m)||!BettaSpecies.ornamental(d))return 0;
  const goal=target(id),masked=[...maskLoci].some(k=>goal.genes[k]===k+k);let total=1,clear=1;
  for(const k of BettaTypes.colorLoci){if(k==='B')continue;const active=goal.genes[k].includes(k),choices=outcomes(m.genes[k],d.genes[k]);const allowed=choices.filter(g=>g.includes(k)===active);total*=allowed.length/4;clear*=allowed.filter(g=>!maskLoci.has(k)||g!==k+k).length/4;if(!total)return 0;}
  return masked?Math.max(0,total-clear):clear*outcomes(m.genes.B,d.genes.B).filter(g=>g===goal.genes.B).length/4;
 }
 function distance(f,id){const g=target(id).genes;return BettaTypes.colorLoci.reduce((sum,k)=>sum+(k==='B'?(f.genes.B===g.B?0:1):f.genes[k].includes(k)===g[k].includes(k)?0:1),0);}
 function plan(state,id,intermediates=true){
  const goal=target(id),fish=state.fish.filter(BettaSpecies.ornamental),groups={F:new Map(),M:new Map()};
  for(const f of fish){const key=JSON.stringify(f.genes),old=groups[f.sex].get(key),ready=BettaStore.parentStatus(state,f).allowed;if(!old||ready&&!BettaStore.parentStatus(state,old).allowed||ready===BettaStore.parentStatus(state,old).allowed&&f.age>old.age)groups[f.sex].set(key,f);}
  const profiles=sex=>[...groups[sex].values()].sort((a,b)=>distance(a,id)-distance(b,id)||a.id-b.id).slice(0,128),pairs=[];
  for(const m of profiles('F'))for(const d of profiles('M')){const p=probability(m,d,id);if(!p)continue;const status=BettaStore.pairingStatus(state,m,d);pairs.push({mother:m.id,father:d.id,probability:p,brood:1-(1-p)**4,ready:status.allowed,reason:status.reason||''});}
  pairs.sort((a,b)=>Number(b.ready)-Number(a.ready)||b.probability-a.probability||a.mother-b.mother||a.father-b.father);
  const missing=BettaTypes.colorLoci.filter(k=>goal.genes[k].includes(k)&&!fish.some(f=>f.genes[k].includes(k)));
  const donors=BettaTypes.colors.filter(c=>c.id!==id).map(c=>({id:c.id,supplies:missing.filter(k=>target(c.id).genes[k].includes(k))})).filter(c=>c.supplies.length).sort((a,b)=>b.supplies.length-a.supplies.length||distance(target(a.id),id)-distance(target(b.id),id)).slice(0,3);
  const steps=[];
  if(!pairs.length&&intermediates){for(const c of BettaTypes.colors){if(c.id===id||state.career.discoveries[c.id])continue;const next=plan(state,c.id,false);if(next.pairs[0]?.ready)steps.push({id:c.id,pair:next.pairs[0],distance:distance(target(c.id),id)});}steps.sort((a,b)=>a.distance-b.distance||b.pair.probability-a.pair.probability);}
  return {id,pairs:pairs.slice(0,3),missing,donors,steps:steps.slice(0,2),limited:groups.F.size>128||groups.M.size>128};
 }
 function marketPair(state,id){
  const offers=BettaCareer.offers(state).filter(o=>o.colorId!==id),goal=target(id),masked=[...maskLoci].some(k=>goal.genes[k]===k+k),pairs=[];
  for(let i=0;i<offers.length;i++)for(let j=i+1;j<offers.length;j++){
   const a=offers[i],b=offers[j],mother=BettaTypes.specimen('halfmoon',a.colorId,'F'),father=BettaTypes.specimen('halfmoon',b.colorId,'M');
   if(probability(mother,father,id)>0)continue;
   const child={...mother,genes:{...mother.genes}};let intermediate=1;
   for(const k of BettaTypes.colorLoci){
    const choices=outcomes(mother.genes[k],father.genes[k]),wanted=goal.genes[k];
    // Match the album phenotype, not mere membership in the target allele pair.
    // Bb needs both alleles; unmasked coats cannot use a double-dose masking
    // factor. Selecting BB or CC here made valid two-generation paths disappear.
    const score=g=>{
     if(k==='B')return masked?0:g===wanted?0:[...wanted].every(a=>g.includes(a))?1:4;
     const n=[...g].filter(a=>a===k).length;
     return wanted.includes(k)?n===0?4:!masked&&maskLoci.has(k)&&n===2?4:n===1?.1:0:n===2?4:n===1?.3:0;
    };
    choices.sort((a,b)=>score(a)-score(b)||a.localeCompare(b));child.genes[k]=choices[0];intermediate*=choices.filter(g=>g===choices[0]).length/4;
   }
   const second=probability(child,child,id);if(!second)continue;
   pairs.push({mother:a,father:b,intermediateGenes:child.genes,intermediateProbability:intermediate,probability:second,price:a.price+b.price});
  }
  pairs.sort((a,b)=>b.probability-a.probability||b.intermediateProbability-a.intermediateProbability||a.price-b.price);
  return pairs[0]||null;
 }
 function progress(state,id,route,directPlan){
  const recipe=route?.pair||route,records=new Map([...(state.career?.archive||[]),...(state.fishArchive||[]),...state.fish].filter(f=>f.genes).map(f=>[f.id,f]));
  const listed=new Set(state.career?.listings.map(l=>l.fishId)||[]),same=(a,b)=>BettaTypes.colorLoci.every(k=>a[k]===b[k]);
  const sources=['mother','father'].map((key,i)=>{
   if(!recipe?.[key]?.colorId)return [];
   const genes=target(recipe[key].colorId).genes,sex=i?'M':'F';
   return [...records.values()].filter(f=>f.sex===sex&&same(f.genes,genes)).map(f=>f.id).concat(Array.isArray(route?.parentIds?.[key])?route.parentIds[key].filter(Number.isSafeInteger):[]);
  });
  const lineage=new Set();let changed=true;
  while(changed){changed=false;for(const f of records.values())if(f.parents&&!lineage.has(f.id)&&((sources[0].includes(f.parents[0])&&sources[1].includes(f.parents[1])||sources[0].includes(f.parents[1])&&sources[1].includes(f.parents[0]))||f.parents.some(p=>lineage.has(p)))){lineage.add(f.id);changed=true;}}
  const ideal=recipe?.intermediateGenes&&BettaTypes.colorLoci.every(k=>typeof recipe.intermediateGenes[k]==='string'&&new RegExp('^['+k+k.toLowerCase()+']{2}$').test(recipe.intermediateGenes[k]))?{...target(id),genes:recipe.intermediateGenes}:null;
  const keep=state.fish.filter(f=>lineage.has(f.id)&&BettaSpecies.ornamental(f)).map(f=>{
   const chance=Math.max(probability(f,f,id),ideal?probability(f,ideal,id):0);
   return {fishId:f.id,sex:f.sex,age:f.age,probability:chance,exact:!!ideal&&same(f.genes,ideal.genes),carrier:!BettaCareer.matches(f).includes(id),loci:BettaTypes.colorLoci.filter(k=>f.genes[k][0]!==f.genes[k][1]&&target(id).genes[k].includes(k)),listed:listed.has(f.id),protected:!!f.protected};
  }).filter(f=>f.probability>0).sort((a,b)=>Number(b.exact)-Number(a.exact)||b.probability-a.probability||b.age-a.age||a.fishId-b.fishId);
  const direct=directPlan||plan(state,id,false),missingSex=['F','M'].filter(sex=>!keep.some(f=>f.sex===sex&&!f.listed));
  const alternatives=[];
  for(const child of keep.slice(0,24)){
   const f=records.get(child.fishId),sex=f.sex==='F'?'M':'F';
   for(const partner of state.fish.filter(p=>p.sex===sex&&BettaSpecies.ornamental(p))){const p=probability(f,partner,id);if(p){const status=BettaStore.pairingStatus(state,f,partner);alternatives.push({fishId:f.id,partnerId:partner.id,sex,probability:p,ready:status.allowed,reason:status.reason||'',withdraw:[f.id,partner.id].filter(id=>listed.has(id))});}}
   for(const offer of BettaCareer.offers(state)){const partner=BettaCareer.offerSpecimen(offer,sex),p=probability(f,partner,id);if(p)alternatives.push({fishId:f.id,offer,sex,probability:p,ready:false,withdraw:listed.has(f.id)?[f.id]:[]});}
  }
  alternatives.sort((a,b)=>Number(b.ready)-Number(a.ready)||Number(!!a.offer)-Number(!!b.offer)||b.probability-a.probability||(a.offer?.price||0)-(b.offer?.price||0));
  const unique=[...new Map(alternatives.map(a=>[[a.fishId,a.partnerId||a.offer.id,a.sex].join(':'),a])).values()].slice(0,3);
  const parents=sources.map((ids,i)=>state.fish.filter(f=>ids.includes(f.id)&&f.sex===(i?'M':'F')).sort((a,b)=>Number(listed.has(a.id))-Number(listed.has(b.id))||b.age-a.age)[0]);
  const firstReady=parents.every(Boolean)&&BettaStore.pairingStatus(state,...parents).allowed;
  const complete=!!state.career?.discoveries[id],ready=direct.pairs.find(p=>p.ready);
  const phase=complete?'complete':ready?'final':keep.length?(keep.some(f=>f.age<2)&&!unique.some(a=>a.ready)?'grow':'select'):firstReady?'first':'sources';
  return {phase,parents:parents.map(f=>f?.id||null),sourceIds:{mother:[...new Set(sources[0])],father:[...new Set(sources[1])]},descendants:[...lineage],keep,missingSex,alternatives:unique,pair:ready||null};
 }
 return {probability,plan,marketPair,progress};
})();
