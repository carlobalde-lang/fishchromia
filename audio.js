'use strict';
window.FishAudio=(()=>{
 const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 const control=el('button'),settings=el('button','⚙'),panel=el('dialog');control.id='fish-audio-toggle';settings.id='fish-audio-settings';settings.setAttribute('aria-label','Regola audio');panel.id='audio-panel';panel.setAttribute('aria-label','Musica e suoni');
 let enabled=true,volumes={music:.65,ambience:.35,effects:.8};try{enabled=localStorage.getItem('fishchromia-audio')!=='off';const saved=JSON.parse(localStorage.getItem('fishchromia-audio-levels')||'null');if(saved)for(const key of Object.keys(volumes))if(Number.isFinite(saved[key]))volumes[key]=Math.max(0,Math.min(1,saved[key]));}catch{}
 let context,master,buses={},meters={},step=0,note=0,lastEffect=0;const chords=[[196,246.94,293.66],[174.61,220,261.63],[146.83,196,246.94],[164.81,220,293.66]];
 function label(){control.textContent=enabled?'♪':'♪̸';control.setAttribute('aria-label',enabled?'Disattiva musica e suoni':'Attiva musica e suoni');control.setAttribute('aria-pressed',String(enabled));}
 function levels(){if(!context)return;for(const key of Object.keys(volumes))buses[key].gain.setTargetAtTime(volumes[key],context.currentTime,.08);}
 function tone(bus,frequency,volume,duration,type='sine',delay=0){if(!context||context.state!=='running')return;const now=context.currentTime+delay,o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.value=frequency;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(volume,now+.025);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g).connect(buses[bus]);o.start(now);o.stop(now+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};}
 function start(){
  if(!enabled||context)return;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  context=new Audio();master=context.createGain();master.gain.value=.75;const limiter=context.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=12;limiter.ratio.value=4;limiter.attack.value=.01;limiter.release.value=.18;master.connect(limiter).connect(context.destination);
  for(const key of Object.keys(volumes)){buses[key]=context.createGain();buses[key].gain.value=volumes[key];buses[key].connect(master);meters[key]=context.createAnalyser();meters[key].fftSize=1024;buses[key].connect(meters[key]);}
  // Short, softly decaying notes replace the continuous chord drone.
  const melody=[0,2,1,null,2,null,1,null,0,1,2,null,1,null,null,null];
  function musicBeat(){
   if(context.state!=='running'||!enabled)return;
   const beat=note%melody.length,index=melody[beat];
   if(index!==null){
    const frequency=chords[step][index]*(beat<8?2:1);
    tone('music',frequency,.13,.65,'sine');
    tone('music',frequency*2,.018,.30,'sine');
   }
   if(beat===0||beat===8)tone('music',chords[step][0]/2,.065,.55,'sine',.05);
   note++;if(note%melody.length===0)step=(step+1)%chords.length;
  }
  musicBeat();setInterval(musicBeat,800);
  const buffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate),data=buffer.getChannelData(0);let smooth=0;for(let i=0;i<data.length;i++){smooth=(smooth+(Math.random()*2-1)*.03)/1.025;data[i]=smooth;}
  const water=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();water.buffer=buffer;water.loop=true;filter.type='lowpass';filter.frequency.value=900;gain.gain.value=.11;water.connect(filter).connect(gain).connect(buses.ambience);water.start();
  setInterval(()=>{if(context.state==='running'&&enabled)tone('ambience',180+Math.random()*180,.035,.14);},3200);
 }
 function effect(kind='tap'){
  if(!enabled)return;start();if(!context||context.state!=='running')return;const now=context.currentTime;if(kind==='tap'&&now-lastEffect<.07)return;lastEffect=now;
  const notes={brood:[392,493.88,587.33],discovery:[523.25,659.25,783.99],sale:[659.25,880],contest:[392,523.25,659.25,1046.5],month:[293.66,392],photo:[880,659.25],tap:[523.25]};
  (notes[kind]||notes.tap).forEach((f,i)=>tone('effects',f,kind==='tap'?.10:.20,kind==='tap'?.14:.38,'sine',i*.10));
 }
 panel.append(el('h2','Musica e suoni'),el('p','Un ambiente tranquillo, con suoni discreti per i momenti importanti.'));
 for(const [key,name] of [['music','Musica'],['ambience','Acqua e bollicine'],['effects','Effetti']]){const row=el('label',name),input=el('input'),value=el('output');input.type='range';input.min=0;input.max=100;input.value=Math.round(volumes[key]*100);input.id='volume-'+key;row.htmlFor=input.id;value.textContent=input.value+'%';input.oninput=()=>{volumes[key]=Number(input.value)/100;value.textContent=input.value+'%';levels();try{localStorage.setItem('fishchromia-audio-levels',JSON.stringify(volumes));}catch{}};row.append(input,value);panel.append(row);}
 const close=el('button','Chiudi');close.onclick=()=>panel.close();panel.append(close);settings.onclick=()=>panel.showModal();
 control.onclick=()=>{enabled=!enabled;try{localStorage.setItem('fishchromia-audio',enabled?'on':'off');}catch{}label();if(enabled){start();context?.resume();}else context?.suspend();};document.body.append(control,settings,panel);label();
 document.addEventListener('pointerdown',event=>{if(event.target===control)return;if(enabled){start();context?.resume();}},{once:true});
 document.addEventListener('click',event=>{if(event.target.closest('button')&&!event.target.closest('#audio-panel')&&event.target!==control&&event.target!==settings)effect('tap');});
 document.addEventListener('visibilitychange',()=>{if(context){if(document.hidden)context.suspend();else if(enabled)context.resume();}});
 function getLevels(){const result={};for(const [key,meter] of Object.entries(meters)){const data=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(data);result[key]=Math.sqrt(data.reduce((sum,v)=>sum+v*v,0)/data.length);}return result;}
 return {effect,getLevels,getState:()=>({enabled,volumes:{...volumes},running:context?.state==='running'})};
})();
