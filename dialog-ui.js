'use strict';
(()=>{
 const prepared=new WeakSet();let counter=0;
 function prepare(dialog){
  if(prepared.has(dialog))return;prepared.add(dialog);dialog.classList.add('ui-dialog');
  let header=dialog.querySelector(':scope > header'),title=header?.querySelector('h2')||dialog.querySelector('h2');
  if(!header&&title){
   header=document.createElement('header');
   const closeForm=dialog.querySelector(':scope > form[method="dialog"]');
   const onlyClose=closeForm&&closeForm.querySelector('.close')&&!closeForm.querySelector('input,select,textarea');
   const existingClose=dialog.querySelector(':scope > button');
   header.append(title);
   if(onlyClose){header.append(closeForm);const close=closeForm.querySelector('button');close.textContent='Chiudi';close.classList.add('secondary');}
   else if(existingClose&&/^(Chiudi|Close)$/.test(existingClose.textContent.trim()))header.append(existingClose);
   else{const close=document.createElement('button');close.type='button';close.className='secondary';close.textContent='Chiudi';close.onclick=()=>dialog.close();header.append(close);}
   dialog.prepend(header);
  }
  if(header)new ResizeObserver(()=>{const height=header.getBoundingClientRect().height;if(height)dialog.style.setProperty('--popup-header-height',Math.ceil(height)+'px');}).observe(header);
  if(title){title.id||='popup-title-'+(++counter);dialog.setAttribute('aria-labelledby',title.id);}
  // Keep form submission and cancellation in the original form, with a single
  // scroll container and its actions reachable at the bottom.
  if(dialog.classList.contains('shelf-label-editor')){
   const form=dialog.querySelector(':scope > form'),buttons=form?[...form.querySelectorAll(':scope > button')]:[];
   if(buttons.length){const actions=document.createElement('div');actions.className='ui-dialog-actions';actions.append(...buttons);form.append(actions);}
  }
 }
 document.querySelectorAll('dialog').forEach(prepare);
 new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){if(node.nodeType!==1)continue;if(node.matches('dialog'))prepare(node);node.querySelectorAll('dialog').forEach(prepare);}}).observe(document.body,{childList:true,subtree:true});
})();
