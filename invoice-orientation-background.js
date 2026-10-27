// Durable jobs live on the server; the existing browser OCR processes one at a time.
(function(){
  let timer=null,running=false,cursor=0,owner='',lastInteraction=0;
  const scope=()=>String(window.__SCF_ACCESS_CONTEXT?.employeeId||'');
  const visible=()=>document.visibilityState!=='hidden';
  const eligible=()=>window.__SCF_ACCESS_CONTEXT?.invoiceBackgroundProcessing===true&&window.matchMedia?.('(min-width:769px) and (pointer:fine)')?.matches===true;
  window.scfCanRunInvoiceOrientationBackground=eligible;
  const syncBusy=()=>{const state=window.scfGetSyncState?.();return !!(state?.pending||state?.status==='syncing');};
  const busy=()=>syncBusy()||Date.now()-lastInteraction<10000||!!navigator.scheduling?.isInputPending?.();
  const schedule=ms=>{clearTimeout(timer);timer=setTimeout(run,ms);};
  async function run(){
    if(running)return;
    if(!scope()||!eligible()||!visible()||navigator.onLine===false){schedule(30000);return;}
    if(busy()){schedule(15000);return;}
    const actor=scope();if(owner!==actor){owner=actor;cursor=0;}
    const active=()=>scope()===actor&&eligible()&&visible()&&navigator.onLine!==false&&!busy();
    running=true;let delay=60000;
    try{
      const response=await serverInvoiceOrientationBackground({action:'claim_invoice_orientation_job',after:cursor,desktop:true});
      if(!active()){schedule(30000);return;}
      cursor=response.after||0;
      if(response.unavailable){delay=300000;return;}
      const job=response.job;
      if(!job){delay=cursor?5000:60000;return;}
      let result;
      try{
        // Renew the private photo URL; no signed URL or image text is stored in jobs.
        const path=storagePhotoPathFromUrl(job.photoSource.replace('/object/','/object/sign/'));
        if(!path)throw new Error('Unsupported photo path');
        const src=await createPrivatePhotoUrl(path);
        result=active()?await window.scfDetectInvoiceOrientation(src,{isActive:active,retry:true}):{status:'cancelled'};
      }catch{result={status:'failed'};}
      if(scope()===actor){
        const status=result.status==='ready'?'ready':result.status==='uncertain'?'uncertain':result.status==='cancelled'?'deferred':'retry';
        await serverInvoiceOrientationBackground({action:'finish_invoice_orientation_job',id:job.id,token:job.token,status,angle:result.angle,desktop:true});
      }
      delay=15000;
    }catch{delay=60000;}
    finally{running=false;schedule(delay);}
  }
  window.scfWakeInvoiceOrientationBackground=()=>{if(!running)schedule(2000);};
  document.addEventListener('visibilitychange',()=>{if(visible())window.scfWakeInvoiceOrientationBackground();});
  window.addEventListener('online',()=>window.scfWakeInvoiceOrientationBackground());
  for(const event of ['pointerdown','keydown','wheel','touchstart'])document.addEventListener(event,()=>{lastInteraction=Date.now();},{passive:true,capture:true});
  schedule(10000);
})();
