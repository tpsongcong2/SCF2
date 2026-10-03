// Read invoice text in four directions locally. Image shape is not text orientation.
function scfInvoiceOrientationScore(data){
  const words=(data?.words||[]).filter(word=>Number(word.confidence)>=40&&/[A-Za-zÀ-ỹ]{2}/.test(String(word.text||'')));
  let letters=0,weighted=0;
  for(const word of words){const n=(String(word.text).match(/[A-Za-zÀ-ỹ]/g)||[]).length;letters+=n;weighted+=n*Number(word.confidence);}
  const confidence=letters?weighted/letters:0;
  const text=String(data?.text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
  const anchors=['phieu giao hang','cong ty','so luong','ten hang','nguoi giao','nguoi nhan','invoice','delivery','customer','quantity'].filter(value=>text.includes(value)).length;
  return{letters,confidence,score:confidence*Math.sqrt(letters)/100+Math.min(anchors,4)*0.8};
}
function scfChooseInvoiceOrientation(candidates){
  const ranked=candidates.map(item=>({...item,...scfInvoiceOrientationScore(item.data)})).sort((a,b)=>b.score-a.score);
  const best=ranked[0],second=ranked[1];
  if(!best||best.letters<25||best.confidence<65||best.score<3.5||best.score<(second?.score||0)*1.25)return{status:'uncertain',angle:0};
  return{status:'ready',angle:best.angle,confidence:Math.round(best.confidence)};
}
(function(){
  const cache=new Map(),pending=new Map();let tail=Promise.resolve(),worker=null,idleTimer=null;
  const cacheKey=src=>{
    // Never retain signed URL tokens or recognized invoice text.
    const path=typeof storagePhotoPathFromUrl==='function'?storagePhotoPathFromUrl(src):'';
    let value=path||String(src).split('?')[0],hash=2166136261;
    for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619);}
    return 'scf_invoice_orientation_v1_'+(hash>>>0).toString(16);
  };
  const remember=(key,result)=>{
    cache.delete(key);cache.set(key,result);if(cache.size>120)cache.delete(cache.keys().next().value);
    if(result.status!=='ready')return;
    try{
      localStorage.setItem(key,JSON.stringify({...result,at:Date.now()}));
      const keys=Object.keys(localStorage).filter(k=>k.startsWith('scf_invoice_orientation_v1_'));
      if(keys.length>120){keys.sort((a,b)=>JSON.parse(localStorage.getItem(a)||'{}').at-JSON.parse(localStorage.getItem(b)||'{}').at).slice(0,keys.length-120).forEach(k=>localStorage.removeItem(k));}
    }catch{}
  };
  const cached=key=>{
    if(cache.has(key))return cache.get(key);
    try{const value=JSON.parse(localStorage.getItem(key)||'null');if(value?.status==='ready'&&[0,90,180,270].includes(value.angle)&&Date.now()-value.at<30*86400000){cache.set(key,value);return value;}}catch{}
    return null;
  };
  const terminate=()=>{clearTimeout(idleTimer);const old=worker;worker=null;if(old)Promise.resolve(old.terminate()).catch(()=>{});};
  const bounded=async(promise,ms,onTimeout)=>{
    let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>{onTimeout?.();reject(new Error('Orientation timeout'));},ms);})]);}finally{clearTimeout(timer);}
  };
  const getWorker=async()=>{
    if(worker)return worker;
    if(!window.Tesseract)await bounded(window.scfLoadExternalScript('tesseract'),20000);
    let expired=false;
    const initializing=window.Tesseract.createWorker('eng',1,{cachePath:'scf-invoice-orientation',errorHandler:()=>{}}).then(value=>{
      if(expired){value.terminate();throw new Error('Orientation initialization expired');}return value;
    });
    worker=await bounded(initializing,45000,()=>{expired=true;});return worker;
  };
  const imageCanvas=src=>bounded(new Promise((resolve,reject)=>{
    const image=new Image();image.crossOrigin='anonymous';
    image.onload=()=>{try{const scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);resolve(canvas);}catch(error){reject(error);}};
    image.onerror=()=>reject(new Error('Cannot read invoice pixels'));image.src=src;
  }),15000);
  const analyze=async(src,isActive)=>{
    if(!isActive())return{status:'cancelled',angle:0};
    clearTimeout(idleTimer);let canvas;
    try{
      canvas=await imageCanvas(src);if(!isActive())return{status:'cancelled',angle:0};
      const engine=await getWorker();if(!isActive())return{status:'cancelled',angle:0};
      const candidates=[],deadline=Date.now()+45000;
      for(const angle of [0,90,180,270]){
          if(!isActive())return{status:'cancelled',angle:0};
          const output=document.createElement('canvas'),sideways=angle===90||angle===270;
          output.width=sideways?canvas.height:canvas.width;output.height=sideways?canvas.width:canvas.height;
          const ctx=output.getContext('2d');ctx.translate(output.width/2,output.height/2);ctx.rotate(angle*Math.PI/180);ctx.drawImage(canvas,-canvas.width/2,-canvas.height/2);
          try{
            const {data}=await bounded(engine.recognize(output,{tessedit_pageseg_mode:'11',user_defined_dpi:'150'},{text:true,blocks:true,hocr:false,tsv:false}),Math.max(1,deadline-Date.now()),terminate);
            candidates.push({angle,data});
          }finally{output.width=output.height=1;}
      }
      return candidates.length===4?scfChooseInvoiceOrientation(candidates):{status:'cancelled',angle:0};
    }catch{terminate();return{status:'failed',angle:0};}
    finally{if(canvas)canvas.width=canvas.height=1;idleTimer=setTimeout(terminate,30000);}
  };
  window.scfDetectInvoiceOrientation=function(src,{isActive=()=>true,retry=false}={}){
    const key=cacheKey(src);if(retry){cache.delete(key);try{localStorage.removeItem(key);}catch{}}
    const known=retry?null:cached(key);if(known)return Promise.resolve(known);
    if(pending.has(key)){
      const job=pending.get(key);job.consumers.push(isActive);return job.promise;
    }
    const job={consumers:[isActive]},active=()=>job.consumers.some(fn=>fn());
    job.promise=tail.catch(()=>{}).then(()=>analyze(src,active)).then(result=>{if(result.status!=='cancelled')remember(key,result);return result;}).finally(()=>pending.delete(key));
    tail=job.promise;pending.set(key,job);return job.promise;
  };
})();
