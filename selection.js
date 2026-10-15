'use strict';
window.BettaSelection=(()=>{
 const cache=new Map();
 function traitProbability(a,b,trait){
  if(trait==='all')return 1;
  if(!BettaSpecies.ornamental(a)||!BettaSpecies.ornamental(b))return 0;
  const signature=JSON.stringify([a.form,b.form,trait]);if(cache.has(signature))return cache.get(signature);
  const keys=({dumbo:['E'],crowntail:['W'],doubletail:['D'],halfmoon:['L','A','H','V','S','W'],plakat:['L'],long:['L'],veiltail:['V'],spade:['S']})[trait];let total=0;
  if(!keys)throw Error('Tratto non valido.');
  function visit(i,form,p){if(i===keys.length){if(BettaTypes.matchesTrait({...a,form},trait))total+=p;return;}const k=keys[i];for(const [g,w] of BettaTypes.distribution(a.form[k],b.form[k]))visit(i+1,{...form,[k]:g},p*w);}
  visit(0,{},1);if(cache.size>=256)cache.clear();cache.set(signature,total);return total;
 }
 function probability(a,b,p){return BettaBreedingGuide.probability(a,b,p.color)*traitProbability(a,b,p.trait);}
 function progress(state,p){
  const born=state.fish.filter(f=>f.parents),color=born.filter(f=>BettaCareer.matches(f).includes(p.color)),trait=born.filter(f=>BettaTypes.matchesTrait(f,p.trait)),matches=color.filter(f=>BettaTypes.matchesTrait(f,p.trait));
  return {color:color.length,trait:trait.length,matches,achieved:p.achieved||[]};
 }
 function partners(state,id,project){
  const a=state.fish.find(f=>f.id===id);if(!a)return [];
  return state.fish.filter(b=>b.sex!==a.sex).map(b=>{const status=BettaStore.pairingStatus(state,a,b),p=project?probability(a,b,project):null;return {fish:b,ready:status.allowed,reason:status.reason,relationship:BettaStore.relationship(a,b),probability:p,brood:p===null?null:1-(1-p)**4,forecast:BettaTypes.forecast(a,b)};}).sort((a,b)=>Number(b.ready)-Number(a.ready)||(b.probability||0)-(a.probability||0)||a.fish.id-b.fish.id);
 }
 return {traitProbability,probability,progress,partners};
})();
