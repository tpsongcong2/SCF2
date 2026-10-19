document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    const overlay=document.querySelector('.overlay');
    if(overlay){const close=overlay.querySelector('.mclose');close&&close.click();}
  }
},true);

if('serviceWorker' in navigator&&location.protocol!=='file:'){
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('./sw.js?v=555').catch(function(e){console.log('FACE MASK SW err:',e);});
  });
}
