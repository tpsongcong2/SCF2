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
          for(const job of chunk){const row=rows.find(row=>String(row.orderId)===String(job.ref.orderId)&&row.kind===job.ref.kind&&row.photoSource===job.ref.photoSource);job.consumers.forEach(c=>c.resolve(valid(row)?row:null));}
        }catch(error){chunk.forEach(job=>job.consumers.forEach(c=>c.reject(error)));}
      }
    });
  });
  window.scfSaveSharedInvoiceOrientation=async function(ref,angle,{mode='manual',expectedAt}={}){
    if(![0,90,180,270].includes(angle))throw new Error('Góc xoay không hợp lệ.');
    const actor=scope();let old=known.get(key(ref));
    if(mode==='manual'&&!old&&expectedAt===undefined){const saved=await load(ref);if(saved)old=remember(ref,saved);}
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
        const saved=await load(ref);
        if(!active())return{status:'cancelled',angle:0};
        if(saved&&!job.retry)return remember(ref,{...saved,status:'ready',sharedState:'saved'});
        if(saved)remember(ref,saved);
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
})();
