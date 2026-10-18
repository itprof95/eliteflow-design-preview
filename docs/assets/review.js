
'use strict';
const designs=JSON.parse(document.getElementById('design-data').textContent);
const dialog=document.getElementById('viewer');
const image=document.getElementById('preview-image');
const stage=document.querySelector('.image-stage');
const tabs=[...document.querySelectorAll('[data-view]')];
let current=null,trigger=null;
function setView(view){
  if(!current)return;
  tabs.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===view)));
  stage.classList.toggle('mobile',view==='mobile');
  image.alt=current.name+' — '+({home:'full homepage',service:'water heater service page',mobile:'mobile homepage'})[view]+'; design concept';
  document.getElementById('view-status').textContent='Loading preview…';
  image.src='assets/'+current.key+'-'+view+'-clean.png';
  stage.scrollTop=0;
}
image.addEventListener('load',()=>{document.getElementById('view-status').textContent='Design preview';});
image.addEventListener('error',()=>{document.getElementById('view-status').textContent='Preview could not load. Please refresh and try again.';});
document.querySelectorAll('[data-design]').forEach(button=>button.addEventListener('click',()=>{
  current=designs.find(d=>d.key===button.dataset.design);trigger=button;
  document.getElementById('viewer-option').textContent='OPTION '+current.number+' / ELITEFLOW';
  document.getElementById('viewer-title').textContent=current.name;
  setView('home');dialog.showModal();document.getElementById('close-viewer').focus();
}));
tabs.forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
document.getElementById('close-viewer').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{if(trigger)trigger.focus();});
