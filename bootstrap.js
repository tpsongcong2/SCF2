
// Keyboard shortcuts for dialogs
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    const ov=document.querySelector('.scf-dialog-overlay');
    if(ov){const cancel=ov.querySelector('#scf-d-cancel');cancel&&cancel.click();}
    const overlay=document.querySelector('.overlay');
    if(overlay){const close=overlay.querySelector('.mclose');close&&close.click();}
  }
  if(e.key==='Enter'&&e.target.tagName!=='TEXTAREA'&&e.target.tagName!=='INPUT'&&e.target.tagName!=='SELECT'){
    const ok=document.querySelector('#scf-d-ok');
    if(ok){ok.click();}
  }
},true);

if('serviceWorker' in navigator){
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('./sw.js')
      .then(function(r){})
      .catch(function(e){console.log('SW err:',e);});
  });
}
