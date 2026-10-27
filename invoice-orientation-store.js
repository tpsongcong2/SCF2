// Shared angles only. Never rewrite image bytes or business order quantities.
function scfInvoicePhotoSource(src){
  return String(src||'').split('?')[0].replace(/\/storage\/v1\/object\/(?:public|sign|authenticated)\//,'/storage/v1/object/');
}
(function(){
  const known=new Map(),resolving=new Map(),waiting=new Map();let scheduled=false,remoteTail=Promise.resolve();
  const scope=()=>String(window.__SCF_ACCESS_CONTEXT?.employeeId||'');
  const key=ref=>JSON.stringify([scope(),String(ref.orderId),ref.kind,ref.photoSource]);
  const remote=task=>{const work=remoteTail.catch(()=>{}).then(task);remoteTail=work;return work;};
  const remember=(ref,value)=>{known.delete(key(ref));known.set(key(ref),value);if(known.size>300)known.delete(known.keys().next().value);return value;};
  const valid=row=>row&&[0,90,180,270].includes(row.angle)&&['auto','manual'].includes(row.mode);
  const queued=row=>row&&['pending','processing','uncertain','failed'].includes(row.backgroundStatus);
  const load=ref=>new Promise((resolve,reject)=>{
    const id=key(ref);if(waiting.has(id)){waiting.get(id).consumers.push({resolve,reject});return;}
    waiting.set(id,{ref,consumers:[{resolve,reject}]});
    if(scheduled)return;scheduled=true;
    queueMicrotask(async()=>{
      scheduled=false;const jobs=[...waiting.values()];waiting.clear();
      for(let i=0;i<jobs.length;i+=25){
        const chunk=jobs.slice(i,i+25);
        try{
          const rows=await remote(()=>serverLoadInvoiceOrientations(chunk.map(job=>job.ref)));
          for(const job of chunk){const row=rows.find(row=>String(row.orderId)===String(job.ref.orderId)&&row.kind===job.ref.kind&&row.photoSource===job.ref.photoSource);job.consumers.forEach(c=>c.resolve(valid(row)||queued(row)?row:null));}
        }catch(error){chunk.forEach(job=>job.consumers.forEach(c=>c.reject(error)));}
      }
    });
  });
  window.scfSaveSharedInvoiceOrientation=async function(ref,angle,{mode='manual',expectedAt}={}){
    if(![0,90,180,270].includes(angle))throw new Error('Góc xoay không hợp lệ.');
    const actor=scope();let old=known.get(key(ref));
    if(mode==='manual'&&!old&&expectedAt===undefined){const saved=await load(ref);if(valid(saved))old=remember(ref,saved);}
    const data=await remote(()=>{if(scope()!==actor)throw new Error('Tài khoản đã thay đổi.');return serverSaveInvoiceOrientation({...ref,angle,mode,expectedAt:expectedAt??old?.updatedAt??''});});
    if(scope()!==actor)throw new Error('Tài khoản đã thay đổi.');
    if(!valid(data.orientation))throw new Error('Máy chủ chưa xác nhận chiều ảnh.');
    const result=remember(ref,{...data.orientation,status:'ready',sharedState:'saved'});
    if(data.conflict){const error=new Error('Chiều ảnh vừa được sửa trên máy khác. Hãy thử lưu lại nếu muốn dùng chiều bạn chọn.');error.orientation=result;throw error;}
    return result;
  };
  window.scfResolveSharedInvoiceOrientation=function(ref,src,{isActive=()=>true,retry=false,onStage=()=>{},allowRecognition=true}={}){
    const id=key(ref),actor=scope();
    if(resolving.has(id)){const job=resolving.get(id);job.consumers.push({isActive,onStage,allowRecognition});job.retry=job.retry||retry;return job.promise;}
    const job={consumers:[{isActive,onStage,allowRecognition}],retry};
    const active=()=>scope()===actor&&job.consumers.some(c=>c.isActive());
    const stage=value=>job.consumers.filter(c=>c.isActive()).forEach(c=>c.onStage(value));
    const work=(async()=>{
      let readError;
      stage('loading');
      try{
        let saved=await load(ref);
        if(!active())return{status:'cancelled',angle:0};
        if(queued(saved)&&!job.retry){
          stage('background');
          // Poll only while this image is visible, for at most 30 seconds.
          // Closing the viewer cancels polling, never the durable server job.
          for(let poll=0;poll<6&&['pending','processing'].includes(saved?.backgroundStatus)&&active();poll++){
            await new Promise(resolve=>setTimeout(resolve,5000));
            if(!active())return{status:'cancelled',angle:0};
            saved=await load(ref);
          }
          if(queued(saved))return{status:['pending','processing'].includes(saved.backgroundStatus)?'queued':saved.backgroundStatus,angle:0,sharedState:'background'};
        }
        if(valid(saved)&&!job.retry)return remember(ref,{...saved,status:'ready',sharedState:'saved'});
        if(valid(saved))remember(ref,saved);
      }catch(error){readError=error;}
      if(!active())return{status:'cancelled',angle:0};
      if(!job.consumers.some(c=>c.isActive()&&c.allowRecognition))return{status:'disabled',angle:0,sharedState:readError?'local':'empty',saveError:readError?.message};
      stage('recognizing');
      const result=await window.scfDetectInvoiceOrientation(src,{isActive:active,retry:job.retry});
      if(result.status!=='ready'||!active())return result;
      // Do not blindly overwrite an existing shared manual angle when reads fail.
      if(readError)return{...result,sharedState:'local',saveError:readError.message};
      stage('saving');
      try{return await window.scfSaveSharedInvoiceOrientation(ref,result.angle,{mode:job.retry?'manual':'auto'});}
      catch(error){return{...result,sharedState:'local',saveError:error.message};}
    })().finally(()=>resolving.delete(id));
    job.promise=work;resolving.set(id,job);return work;
  };
  // New servers enqueue OCR transactionally with the photo. This client only checks
  // the receipt; eligible desktop sessions can resume recognition after reopening.
  const uploads=new Map();
  window.scfPrepareUploadedInvoiceOrientation=function(orderId,kind,src,confirmPhoto){
    if(!src||/^(?:data:|blob:)/i.test(src)||!scope()||typeof window.scfDetectInvoiceOrientation!=='function')return Promise.resolve({status:'unavailable'});
    const ref={orderId:String(orderId),kind,photoSource:scfInvoicePhotoSource(src)},actor=scope(),id=key(ref);
    if(uploads.has(id))return uploads.get(id);
    const active=()=>scope()===actor;
    const work=(async()=>{
      const confirmed=await confirmPhoto();
      if(!confirmed||!active())return {status:active()?'pending':'cancelled'};
      const saved=await load(ref);
      if(!active())return {status:'cancelled'};
      if(valid(saved))return remember(ref,{...saved,status:'ready',sharedState:'saved'});
      if(queued(saved)){window.scfWakeInvoiceOrientationBackground?.();return {status:'queued',angle:0,sharedState:'background'};}
      // Compatibility with servers not yet upgraded to the durable queue.
      if(window.scfCanRunInvoiceOrientationBackground?.()===false)return {status:'pending',angle:0};
      const result=await window.scfDetectInvoiceOrientation(src,{isActive:active});
      if(!active())return {status:'cancelled'};
      if(result.status!=='ready')return result;
      // Resolver reads shared state first and preserves another user's manual turn.
      // The detector caches this source, so the already-completed OCR is reused.
      return await window.scfResolveSharedInvoiceOrientation(ref,src,{isActive:active});
    })().catch(error=>({status:'failed',saveError:error?.message||String(error)})).finally(()=>uploads.delete(id));
    uploads.set(id,work);return work;
  };
})();
